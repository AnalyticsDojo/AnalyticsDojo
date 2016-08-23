import helmet from 'helmet';

let trusted = [
  "'self'"
];

if (process.env.NODE_ENV !== 'production') {
  trusted.push('ws://localhost:3000');
}

export default function csp() {
  return helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: trusted.concat('*.optimizely.com'),
      scriptSrc: [
        "'unsafe-eval'",
        "'unsafe-inline'",
        '*.google-analytics.com',
        '*.segment.com',
        '*.segment.io',
        '*.gstatic.com',
        'https://*.cloudflare.com',
        '*.cloudflare.com',
        'https://*.gitter.im',
        'https://*.cdnjs.com',
        '*.cdnjs.com',
        'https://*.jsdelivr.com',
        '*.jsdelivr.com',
        '*.twimg.com',
        'https://*.twimg.com',
        'https://*.github.com',
        'https://*.gist.github.com',
        '*.github.com',
        '*.youtube.com',
        '*.ytimg.com',
        'https://www.youtube.com/',
        'https://s.ytimg.com'
      ].concat(trusted),
      styleSrc: [
        "'unsafe-inline'",
        '*.gstatic.com',
        'https://*.github.com',
        'https://*.gist.github.com',
        '*.github.com',
        '*.googleapis.com',
        '*.bootstrapcdn.com',
        'https://*.bootstrapcdn.com',
        '*.cloudflare.com',
        'https://*.cloudflare.com'
      ].concat(trusted),
      fontSrc: [
        'font-src data',
        '*.cloudflare.com',
        'https://*.cloudflare.com',
        '*.bootstrapcdn.com',
        'https://*.github.com',
        'https://*.gist.github.com',
        '*.github.com',
        '*.googleapis.com',
        '*.gstatic.com',
        'https://*.bootstrapcdn.com',
        '*.optimizely.com'
      ].concat(trusted),
      imgSrc: [
        // allow all input since we have user submitted images for
        // public profile
        '*',
        'data:'
      ],
      mediaSrc: [
        '*.bitly.com',
        '*.amazonaws.com',
        '*.twitter.com'
      ].concat(trusted),
      frameSrc: [
        '*.gitter.im',
        '*.gitter.im https:',
        '*.youtube.com',
        'https://*.github.com',
        'https://*.gist.github.com',
        '*.github.com',
        '*.twitter.com',
        '*.ghbtns.com',
        '*.freecatphotoapp.com',
        'rpi-analytics.github.io',
        'analyticsdojo.github.io',
        'freecodecamp.github.io',
        '*.optimizely.com'
      ].concat(trusted)
    },
    // set to true if you only want to report errors
    reportOnly: false,
    // set to true if you want to set all headers
    setAllHeaders: false,
    // set to true if you want to force buggy CSP in Safari 5
    safari5: false
  });
}
