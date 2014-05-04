/* initalize modules / db path */
var express = require("express");
var twilio = require("twilio");
var auth = require('./authentication.js');
var _ = require('underscore');
var client = new twilio.RestClient('AC645f23a47956757b6ee240ba83acc40d', 'da6895bd80208b87f5eeb94fa776961b');
var mongoose = require('mongoose');
var passport = require('passport');


var app = express();

app.configure(function() {
  app.use(express.static('public'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});


// seralize and deseralize
passport.serializeUser(function(user, done) {
    //console.log('serializeUser: ' + user._id)
    done(null, user._id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user){
        //console.log(user);
        if(!err) done(null, user);
        else done(err, null);
    })
});

/* initialize all DB models */
var User = require('./user.js');
var Group = require('./group.js');
mongoose.connect('mongodb://localhost/dispatchly');

/* bitly credentials / requirements */
var BitlyAPI = require("node-bitlyapi");
var Bitly = new BitlyAPI({
    client_id: "149af734d55f5dea2049022bffeb8342ce40aa6d",
    client_secret: "26fb726bafb6c08fa4e3fc4b89e7628601352326"    
});

/* serves main page */
/* all other requests should fall below this */
app.get("/", function(req, res) {
	res.sendfile('./views/index.html');
});

/* TESTING : create-group.temp */
/* TESTING : create-group.temp */
/* TESTING : create-group.temp */
/* TESTING : create-group.temp */
app.get("/create-group", function(req, res) {
	res.sendfile('./public/partials/create-group.html');
});
/* TESTING : create-group.temp */
/* TESTING : create-group.temp */
/* TESTING : create-group.temp */
/* TESTING : create-group.temp */

/* Create group API */
app.get("/db/create-group", function(req, res, next) {

	// Group model
	var group = new Group({
		group_id: req.query.name,
		password: req.query.password,
		address: req.query.address,
		zipcode: req.query.zipcode,
	});

	// Add user to the group they are creating
	group.users.push(req.user.name);

	// Save group to the DB
	group.save(function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("saved group to DB");
			res.send(true);
			//done(null, group);
		}
	});
});

/* bitly API request */
app.get("/api/bitly", function(req, res) {
	Bitly.authenticate("spamr", "i001254m", function(err, access_token) {
    // Returns an error if there was one, or an access_token if there wasn't 
    Bitly.setAccessToken(access_token);
    // Shorten the URL being passed through
	    Bitly.shorten({longUrl:req.query.name}, function(err, results) {
	    	res.send(results);
			});
	});
});

app.get("/auth/facebook", authnOrAuthzFacebook);

app.get("/auth/twitter", authnOrAuthzTwitter);

app.get("/auth/facebook/callback", passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/home');
});

app.get("/auth/twitter/callback", passport.authenticate('twitter', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/home');
	});

app.get('/authz/facebook/callback', 
  passport.authorize('facebook-authz', { failureRedirect: '/' }),
  function(req, res) {
    var user = req.user;
    var account = req.account;

    // Associate the Twitter account with the logged-in user.
    account.userId = user.id;
    account.save(function(err) {
      if (err) { return self.error(err); }
      res.redirect('/home');
    });
  });

app.get('/authz/twitter/callback', 
  passport.authorize('twitter-authz', { failureRedirect: '/' }),
  function(req, res) {
    var user = req.user;
    var account = req.account;

    // Associate the Twitter account with the logged-in user.
    account.userId = user.id;
    account.save(function(err) {
      if (err) { return self.error(err); }
      res.redirect('/home');
    });
  });


// testing
app.get("/home", function(req, res){
	User.findById(req.session.passport.user, function(err, user) {
		if (err) { console.log(err); }
		else {
			res.sendfile('./views/app.html', { user: user });
		}
	})
});


// secure
// app.get("/home", ensureAuthenticated, function(req, res){
// 	User.findById(req.session.passport.user, function(err, user) {
// 		if (err) { console.log(err); }
// 		else {
// 			res.sendfile('./views/app.html', { user: user });
// 		}
// 	})
// });

function authnOrAuthzFacebook(req, res, next) {
  if (!req.isAuthenticated()) {
    passport.authenticate('facebook', { scope: ['email'], successRedirect: '/home',
                                        failureRedirect: '/login' })(req, res, next);
  } else {
    passport.authorize('facebook-authz')(req, res, next);
  }
}

function authnOrAuthzTwitter(req, res, next) {
  if (!req.isAuthenticated()) {
    passport.authenticate('twitter', { scope: ['email'], successRedirect: '/home',
                                        failureRedirect: '/login' })(req, res, next);
  } else {
    passport.authorize('twitter-authz')(req, res, next);
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}




/* serves all the static files */
app.get(/^(.+)$/, function(req, res){
	console.log('static file request : ' + req.params);
	res.sendfile( __dirname + req.params[0]);
});


/* node port config */
var port = process.env.PORT || 5000;
	app.listen(port, function() {
	console.log("MEAN stack is running on port " + port);
});
