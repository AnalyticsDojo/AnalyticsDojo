var pm2 = require('pm2');
var nodemailer = require('nodemailer');
var moment = require('moment-timezone')
var _ = require('lodash');

var MACHINE_NAME = 'hk1';
var PRIVATE_KEY  = process.env.KISS_PRIVATE_KEY;   // Keymetrics Private key
var PUBLIC_KEY   = process.env.KISS_PUBLIC_KEY;   // Keymetrics Public  key

var instances = process.env.WEB_CONCURRENCY || -1; // Set by Heroku or -1 to scale to max cpu core -1
var maxMemory = process.env.WEB_MEMORY      || 512;// " " "
var transportOptions = {
    type: 'smtp',
    service: 'SendGrid',
    auth: {
        api_user: process.env.SENDGRID_USER || false,
        api_key: process.env.SENDGRID_PASSWORD
        }
    }

var mailReceiver = process.env.MAIL_RECEIVER || false;

pm2.connect(function() {
    pm2.start({
        script    : 'server/production-start.js',
        name      : 'AnalyticsDojo',     // ----> THESE ATTRIBUTES ARE OPTIONAL:
        exec_mode : 'cluster',            // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
        instances : instances,
        max_memory_restart : maxMemory + 'M',   // Auto restart if process taking more than XXmo
        env: {                            // If needed declare some environment variables
            "NODE_ENV": "production",
            "AWESOME_SERVICE_API_TOKEN": "xxx"
        },
        post_update: ["npm install"]       // Commands to execute once we do a pull from Keymetrics
    }, function() {
        pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, function() {

            // Display logs in standard output
            pm2.launchBus(function(err, bus) {
                console.log('[PM2] Log streaming started');

                bus.on('log:out', function(packet) {
                    console.log('[App:%s] %s', packet.process.name, packet.data);
                });

                bus.on('log:err', function(packet) {
                    console.error('[App:%s][Err] %s', packet.process.name, packet.data);
                });
            });


        });
    });
});

if (transportOptions.auth.user && mailReceiver) {
    console.log('setting up mailer');
    var transporter = nodemailer.createTransport(transportOptions);
    var compiled = _.template(
        'An error has occurred on server ' +
        '<% name %>\n' +
        'Stack Trace:\n\n\n<%= stack %>\n\n\n' +
        'Context:\n\n<%= text %>'
    );

    pm2.launchBus(function(err, bus) {
        if (err) {
            return console.error(err);
        }
        console.log('event bus connected');

        bus.on('process:exception', function(data) {
            var text;
            var stack;
            var name;
            try {
                data.date = moment(data.at || new Date())
                    .tz('America/Los_Angeles')
                    .format('MMMM Do YYYY, h:mm:ss a z');

                text = JSON.stringify(data, null, 2);
                stack = data.data.stack;
                name = data.process.name;
            } catch (e) {
                return e;
            }

            transporter.sendMail({
                to: mailReceiver,
                from: 'team@analyticsdojo.com',
                subject: 'Server exception',
                text: compiled({ name: name, text: text, stack: stack })
            });
        });
    });
}
