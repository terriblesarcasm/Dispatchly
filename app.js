/* initalize modules / db path */
var express = require("express");
var twilio = require("twilio");
var auth = require('./authentication.js');
var _ = require('underscore');
var client = new twilio.RestClient('AC645f23a47956757b6ee240ba83acc40d', 'da6895bd80208b87f5eeb94fa776961b');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');


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

app.get("/auth/facebook/callback", passport.authenticate('facebook', { failureRedirect: '/' }),
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


app.get("/home", ensureAuthenticated, function(req, res){
	User.findById(req.session.passport.user, function(err, user) {
		if (err) { console.log(err); }
		else {
			res.render('/views/app.html', { user: user });
		}
	})
});

function authnOrAuthzFacebook(req, res, next) {
  if (!req.isAuthenticated()) {
    passport.authenticate('facebook', { scope: ['email'], successRedirect: '/home',
                                        failureRedirect: '/login' })(req, res, next);
  } else {
    passport.authorize('facebook-authz')(req, res, next);
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
