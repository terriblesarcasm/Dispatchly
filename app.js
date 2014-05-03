/* initalize modules / db path */
var express = require("express");
var twilio = require("twilio");
var auth = require('./authentication.js');
var _ = require('underscore');
var client = new twilio.RestClient('AC645f23a47956757b6ee240ba83acc40d', 'da6895bd80208b87f5eeb94fa776961b');
var app = express();
var mongoose = require('mongoose');

/* initialize all DB models */
var User = require('./user.js');
var Group = require('./group.js');

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