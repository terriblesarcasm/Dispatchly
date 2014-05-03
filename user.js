// create a user model
var mongoose = require('mongoose');
var User = mongoose.model('User', {
  //oauthID: Number,
  username: String,
  nickname: String,
  phonenumber: String,
  emailaddress: String,
  created: Date,
  groups: []
});

module.exports = User;