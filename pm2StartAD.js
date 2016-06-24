var pm2 = require('pm2');
var nodemailer = require('nodemailer');
var moment = require('moment-timezone');
var _ = require('lodash');

var MACHINE_NAME = 'hk1';
var PRIVATE_KEY  = process.env.KISS_PRIVATE_KEY;   // Keymetrics Private key
var PUBLIC_KEY   = process.env.KISS_PUBLIC_KEY;   // Keymetrics Public  key

var instances = process.env.WEB_CONCURRENCY || -1; // Set by Heroku or -1 to scale to max cpu core -1
var maxMemory = process.env.WEB_MEMORY      || 512;// " " "
var transportOptions = {
    type: 'smtp',
    service: 'SES',
    auth: {
        user: process.env.SES_USERNAME || false,
        password: process.env.SES_PASSWORD
        }
}

pm2.connect(function() {
    pm2.start({
        script    : 'server/production-start.js',
        name      : 'AnalyticsDojo',     // ----> THESE ATTRIBUTES ARE OPTIONAL:
        exec_mode : 'cluster',            // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
        instances : instances,
        max_memory_restart : maxMemory + 'M',   // Auto restart if process taking more than XXmo
        env: {                            // If needed declare some environment variables
            "NODE_ENV": "production"
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
