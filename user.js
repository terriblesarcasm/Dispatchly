// create a user model
var User = mongoose.model('User', {
  //oauthID: Number,
  username: String,
  nickname: String,
  phonenumber: String,
  emailaddress: String,
  created: Date,
  accounts: []
});


module.exports = User;