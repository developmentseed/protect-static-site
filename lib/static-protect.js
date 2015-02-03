var express = require('express');
var passport = require('passport');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var serverStatic = require('serve-static');
var path = require('path');
var GitHubStrategy = require('passport-github').Strategy;

//Private
// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}


//Public
function StaticProtect(root_folder) {

  this.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ""
  this.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
  this.SITE_URL = process.env.SITE_URL || "";
  this.DIST_FOLDER = process.env.DIST_FOLDER || "dist";
  this.SESSION_KEY = process.env.SESSION_KEY || 'change me to something difficult';
  this.USER_LIST = process.env.USER_LIST || false;

  console.log(this.USER_LIST);

  this.ROOT_FOLDER = typeof root_folder !== 'undefined'
    ? root_folder
    : __dirname;

}

StaticProtect.prototype.init = function(webServer) {

  var self = this

  // Passport session setup.
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  // Use the GitHubStrategy within Passport.
  passport.use(new GitHubStrategy({
      clientID: this.GITHUB_CLIENT_ID,
      clientSecret: this.GITHUB_CLIENT_SECRET,
      callbackURL: this.SITE_URL + "/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...

      process.nextTick(function () {

        if (self.USER_LIST) {
          var users = self.USER_LIST.split(',');

          if (users.indexOf(profile.username) > -1) {
            return done(null, profile);
          }
          else {
            return done(null, false);
          }
        }
        else {
          return done(null, profile);
        }



      });
    }
  ));

  webServer = typeof webServer !== 'undefined'
    ? webServer
    : express();

  this.app = webServer;

  // configure Express
  this.app.set('views', __dirname + '/views');
  this.app.set('view engine', 'ejs');
  this.app.use(logger('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
  }));
  this.app.use(cookieParser());
  this.app.use(bodyParser.urlencoded({
    extended: true
  }));
  this.app.use(bodyParser.json());
  this.app.use(methodOverride());
  this.app.use(session({
      secret: this.SESSION_KEY,
      resave: true,
      saveUninitialized: true
  }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  this.app.use(passport.initialize());
  this.app.use(passport.session());

  this.app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

  this.app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });

  this.app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHubwill redirect the user
  //   back to this application at /auth/github/callback
  this.app.get('/auth/github',
    passport.authenticate('github'),
    function(req, res){
    }
  );

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  this.app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
  });

  this.app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  this.app.use(ensureAuthenticated);

  this.app.use(serverStatic(path.join(this.ROOT_FOLDER, this.DIST_FOLDER)));

}

exports = module.exports = StaticProtect;
