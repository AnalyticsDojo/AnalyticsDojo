import { Observable } from 'rx';
import debugFactory from 'debug';

const debug = debugFactory('freecc:user:remote');

function destroyAllRelated(id, Model) {
  return Observable.fromNodeCallback(
    Model.destroyAll,
    Model
  )({ userId: id });
}

module.exports = function(app) {
  var User = app.models.User;
  var UserIdentity = app.models.UserIdentity;
  var UserCredential = app.models.UserCredential;
  var Email = app.models.Email;
  User.observe('before delete', function(ctx, next) {
    debug('removing user', ctx.where);
    var id = ctx.where && ctx.where.id ? ctx.where.id : null;
    if (!id) {
      return next();
    }
    Observable.combineLatest(
      destroyAllRelated(id, UserIdentity),
      destroyAllRelated(id, UserCredential),
      function(identData, credData) {
        return {
          identData: identData,
          credData: credData
        };
      }
    ).subscribe(
      function(data) {
        debug('deleted', data);
      },
      function(err) {
        debug('error deleting user %s stuff', id, err);
        next(err);
      },
      function() {
        debug('user stuff deleted for user %s', id);
        next();
      }
    );
  });

  // set email varified false on user email signup
  // should not be set with oauth signin methods
  User.beforeRemote('create', function(ctx, user, next) {
    var body = ctx.req.body;
    if (body) {
      body.emailVerified = false;
    }
    next();
  });

  // send welcome email to new camper
  User.afterRemote('create', function({ req, res }, user, next) {
    debug('user created, sending email');
    if (!user.email) { return next(); }
    const redirect = req.session && req.session.returnTo ?
      req.session.returnTo :
      '/';

    var mailOptions = {
      type: 'email',
      to: user.email,
      from: 'Team@analyticsdojo.com',
      subject: 'Welcome to AnalyticsDojo!',
      redirect: '/',
      text: [
        'Greetings from Upstate New York!\n\n',
        'Thank you for joining our community.\n',
        'Feel free to email us at this address if you have ',
        'any questions about AnalyticsDojo.\n',
        'And if you have a moment, check out our blog: ',
        'medium.analyticsdojo.com.\n\n',
        'Good luck with the challenges!\n\n',
        '- the AnalyticsDojo Team'
      ].join('')
    };

    debug('sending welcome email');
    Email.send(mailOptions, function(err) {
      if (err) { return next(err); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }

        req.flash('success', {
          msg: [ "Welcome to AnalyticsDojo! We've created your account." ]
        });
        res.redirect(redirect);
      });
    });
  });
};
