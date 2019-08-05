const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = () => {
  return new User({name: "test", email: "test@test.test", password: "test"}).save();
};
