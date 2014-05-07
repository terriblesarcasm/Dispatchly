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
  app.use(express.urlencoded());
  app.use(express.json());
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
    });
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
app.get("/", ensureAuthenticated, function(req, res) {
	User.findById(req.session.passport.user, function(err, user) {
	    if(err) { 
	      console.log(err); 
	    } else {
	      res.sendfile('./views/app.html', { user: user});
	    }
	});
});

/* serves sign up page */
app.get("/signup", function(req, res) {
	res.sendfile('./views/signup.html');
});


/* serves response page */
app.get("/alert-response.html", ensureAuthenticated, function(req, res) {
	User.findById(req.session.passport.user, function(err, user) {
	    if(err) { 
	      console.log(err); 
	    } else {
	      res.sendfile('./views/alert-response.html', { user: user});
	    }
	});
});



/* twilio API request */
app.get("/api/twilio", createSMS);

function createSMS(req, res, next) {
	//Get the group sending the alert
	Group.findOne({ group_id: req.query.group }, 'users', function(err, groupData) {
		if (err) res.send("error");
		if (groupData) {
			console.log(groupData)
			for (var i = groupData.length - 1; i >= 0; i--) {
				console.log("i: " + i);
				
				//Need to User.findOne({name: user.name}) to get phone
				//create Twilio SMS
				// client.sms.messages.create({
				//     to:req.query.phone,
				//     from:req.query.from,
				//     body:req.query.bodymessage
				// }, function(error, message) {
				//     // The HTTP request to Twilio will run asynchronously. This callback
				//     // function will be called when a response is received from Twilio
				//     // The "error" variable will contain error information, if any.
				//     // If the request was successful, this value will be "falsy"
				//     if (!error) {
				//         // The second argument to the callback will contain the information
				//         // sent back by Twilio for the request. In this case, it is the
				//         // information about the text messsage you just sent:
				//         console.log('Success! The SID for this SMS message is:');
				//         console.log(message.sid);
				//         res.send('Success! The SID for this SMS message is: ' + message.sid);
				 
				//         console.log('Message sent on:');
				//         console.log(message.dateCreated);
				//     } else {
				//         console.log('Oops! There was an error.');
				//         console.log(error);
				//     }
				// });
			}
			res.send("success from: " + req.query.group + " code: " + req.query.code);
		} else {
			res.send("Couldn't find the group");
		}
	});
}


// app.get("/#/", ensureAuthenticated, function(req, res) {
// 	res.sendfile('./views/app.html');
// });

app.get("/login", function(req, res) {
		res.sendfile('./views/index.html');
	});


app.post('/login/localuser', 
	passport.authenticate('local', {failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
	});

/* Create new user account via API */
app.post("/db/register", function(req, res, next) {
	// should first check DB to see if the username currently exists

	var user = new User ({
	username: req.body.emailaddress,
	password: req.body.password,
	name: req.body.firstname + " " + req.body.lastname,
	phonenumber: req.body.phonenumber,
	});

	user.save(function(err) {
		if(err) {
			console.log(err);
			res.send(new String(err.code));
		} else {
			console.log("saved new user: " + user);
			passport.authenticate('local', {failureRedirect: '/login' }),
				function(req, res) {
					res.redirect('/');
				}
		}
	});	

});

app.get("/logout", function(req, res, next) {
	req.logout();
	res.redirect("/");
});


app.get("/db/loadgroup", function(req, res, next) {
	Group.findOne({group_id: req.query.group_id}, "users", function(err, groupData) {
		if (err) return console.error(err);
		if (groupData) { 
			console.log('loading groupData: ' + groupData);
			res.send(groupData);
		} 
		else {
			// no group found for whatever reason
		}
	})
});


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
			res.send(new String(err.code));
		} else {
			console.log("saved group to DB");

			// Save group to user
			var user = req.user;
			user.groups.push(req.query.name);
			
			user.save(function(err) {
				if(err) {
					console.log(err);
					res.send(new String(err.code));
				} else {
					console.log("saved group to user");
					res.send(true);
				}
			});			
		}

	});
});

/* Add phone number to user API */
app.get("/db/add-phone-number", function(req, res, next) {
	var user = req.user;
	user.phonenumber = req.query.phonenumber;

	user.save(function(err) {
		if(err) {
			console.log(err);
			res.send(new String(err.code));
		} else {
			console.log("saved phone number to user: " + req.query.phonenumber);
			res.send(true);
		}
	});	

});

app.get("/get/user", function(req, res, next) {
	res.send(req.user);
});

app.get("/db/add-alert", function(req, res, next) {
	Group.findOne({group_id: req.query.group_id}, function(err, groupData) {
		if (err) return console.error(err);
		if (groupData) { 
			console.log('there is a match: ' + groupData);

			// add code to group
			var group = groupData;
			groups.alertcodes.push(req.query.alert);

			group.save(function(err) {
				if(err) {
					console.log(err);
					res.send(new String(err.code));
				} else {
					console.log("saved alert to group");
					res.send("OK");
				}
			})

		} else {
			console.log('invalid group');
			res.send('invalid');
		}
	})
});

/* Join group API */
app.get("/db/join-group", function(req, res, next) {
	// Look for a group_id/password match in the DB
	Group.findOne({group_id: req.query.group_id, password: req.query.password}, function (err, groupData) {
		if (err) return console.error(err);
		if (groupData) { 
			console.log('there is a match: ' + groupData);

			// Add user to the group
			var group = groupData;
			group.users.push(req.user.name);

			// Add group to user
			var user = req.user;
			user.groups.push(groupData.group_id);

			// Save changes to the DB
			group.save(function(err) {
				if(err) {
					console.log(err);
					res.send(new String(err.code));
				} else {
					console.log("saved group to DB");

					user.save(function(err) {
						if(err) {
							console.log(err);
							res.send(new String(err.code));
						} else {
							console.log("saved user to DB");
							res.send(true);
						}
					});
				}
			});

		}
		else {
			console.log('invalid username/password');
			res.send('invalid');
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
    res.redirect('/');
});

app.get("/auth/twitter/callback", passport.authenticate('twitter', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
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
      res.redirect('/');
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
      res.redirect('/');
    });
  });

app.get('/get/profilepic', getProfilePic);




// testing
// app.get("/home", ensureAuthenticated, function(req, res){
// 	User.findById(req.session.passport.user, function(err, user) {
// 		if (err) { console.log(err); }
// 		else {
// 			res.sendfile('./views/app.html', { user: user });
// 		}
// 	});
// });


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
    passport.authenticate('facebook', { scope: ['email'], successRedirect: '/',
                                        failureRedirect: '/login' })(req, res, next);
  } else {
    passport.authorize('facebook-authz')(req, res, next);
  }
}

function authnOrAuthzTwitter(req, res, next) {
  if (!req.isAuthenticated()) {
    passport.authenticate('twitter', { scope: ['email'], successRedirect: '/',
                                        failureRedirect: '/login' })(req, res, next);
  } else {
    passport.authorize('twitter-authz')(req, res, next);
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

function getProfilePic(accounts) {
  var len = accounts.length;
  var twitter = "";
  for (var cnt = 0; cnt < len; cnt++) {
    if (accounts[cnt].provider == 'facebook.com') {
    	res.send(accounts[cnt].userid);
    } else if (accounts[cnt].provider == 'twitter.com') {
    	twitter = accounts[cnt].userid;
    }
  }
  res.send(twitter);
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
