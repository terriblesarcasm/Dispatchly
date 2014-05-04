var mongoose = require('mongoose')

// create a user model
var Alert = mongoose.model('Alert', {
  code: String,
});


module.exports = Alert;