var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./user.js');
var config = require('./oauth.js');
var Account = require('./account.js');



//authenticate Facebook
module.exports = passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	},
	function(accessToken, refreshToken, profile, done) {
		authentication(accessToken, refreshToken, profile, done, 'facebook.com');
	}
));


//authorize Facebook
passport.use('facebook-authz', new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackzURL,
		passportReqToCallback: true
	},
	function(req, accessToken, refreshToken, profile, done) {
		authorization(req, accessToken, refreshToken, profile, done, 'facebook.com');
	}
));



//authenticate your account, means the user is not already logged in
function authentication(accessToken, refreshToken, profile, done, provider) {
	// Attempt to look up user in database by accounts.uid
	User.findOne({ 'accounts.uid': profile.id }, function(err, user) {
		if(err) { console.log(err); }

		//if the query returns a user, done will send the user from query back to the app
		if (user !== null) {
			done(null, user);
		}	else {
			//if the query doesn't return any user, create it

			//User model
			var user = new User({
				//oauthID: profile.id
				name: profile.displayName,
				created: Date.now(),
				groups: []
			});

			//add the facebook account object to the user
			var acc = {
				uid: profile.id,
				provider: provider,
				name: profile.displayName,
				tokens: []
			};

			//add the access token to the acc.tokens array
			var t = { kind: 'oauth', accessToken: accessToken, attributes: { refreshToken: refreshToken} };
			acc.tokens.push(t);

			//push the account into the user object
			user.accounts.push(acc);

			//save the user to DB
			user.save(function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("saving user ...");
					done(null, user);
				}
			});
		}
	});
}


//authorize means the user is already logged in
function authorization(req, accessToken, refreshToken, profile, done, provider) {
  if (!req.user) {
    // Not logged-in, wtf?
  } else {
    User.findOne({ 'accounts.uid': profile.id }, function(err, user) {
      if (err) { console.log(err); }
      if (!err && user != null) {
        if (user.name == req.user.name) {
          done(null, user)  
        } else {
          console.log('account is already associated with another account');
        }
      } else{
        var user = req.user;
        var acc = {
          uid: profile.id,
          provider: provider,
          name: profile.displayName,
          tokens: []
        };
        var t = { kind: 'oauth', accessToken: accessToken, attributes: { refreshToken: refreshToken } };
        acc.tokens.push(t);
        user.accounts.push(acc);
        user.save(function(err) {
          if(err) { 
            console.log(err); 
          } else {
            console.log("saving user ...");
            done(null, user);
          };
        });
      }
    });
  }
}