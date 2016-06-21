var pm2 = require('pm2');

var MACHINE_NAME = 'hk1';
var PRIVATE_KEY  = '5el5wxzt95kom5u';   // Keymetrics Private key
var PUBLIC_KEY   = 'g89yg9i785kw55d';   // Keymetrics Public  key

var instances = process.env.WEB_CONCURRENCY || -1; // Set by Heroku or -1 to scale to max cpu core -1
var maxMemory = process.env.WEB_MEMORY      || 512;// " " "

pm2.connect(function() {
    pm2.start({
        script    : 'server/production-start.js',
        name      : 'production-app',     // ----> THESE ATTRIBUTES ARE OPTIONAL:
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
