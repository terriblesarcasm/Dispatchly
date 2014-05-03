/* initalize modules / db path */
var express = require("express");
var twilio = require("twilio");
var _ = require('underscore');
var client = new twilio.RestClient('AC645f23a47956757b6ee240ba83acc40d', 'da6895bd80208b87f5eeb94fa776961b');
var app = express();

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('views/index.html');
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