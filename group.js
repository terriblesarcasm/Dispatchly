// create a user model
var Group = mongoose.model('Group', {
  //oauthID: Number,
  group_id: String,
  password: String,
  alertcodes: [],
  users: []
});

module.exports = Group;