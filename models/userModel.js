const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'This field is required'],
  },
  email: {
    type: String,
    lowercase: true,
    validate: [validator.isEmail, `Its not a valid email`],
    unique: true,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'lead'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'This field is required'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'This field is required'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: `Passowrds don't match`,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  resetTokenExpire: Date,
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hashSync(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.methods.ps = async function (og, givn) {
  return bcrypt.compare(givn, og);
};
userSchema.methods.changedPasswordAfter = function (timestamp) {
  if (this.passwordChangedAt) {
    const tm = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(tm, timestamp);
    return timestamp < tm;
  }
  return false;
};
userSchema.methods.getresettoken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.resetTokenExpire = Date.now() + 10 * 60 * 1000;

  return token;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
