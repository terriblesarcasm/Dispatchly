// create a user model
var mongoose = require('mongoose');
var User = mongoose.model('User', {
  //oauthID: Number,
  name: String,
  nickname: String,
  phonenumber: String,
  emailaddress: String,
  created: Date,
  groups: [],
  accounts: []
});

module.exports = User;