// create a user model
var mongoose = require('mongoose');
var Group = mongoose.model('Group', {
  //oauthID: Number,
  group_id: String,
  password: String,
  alertcodes: [],
  users: []
});

module.exports = Group;