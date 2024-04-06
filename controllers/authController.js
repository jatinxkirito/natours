const AppError = require('./../utils/appError.js');
const crypto = require('crypto');
const EMAIL = require('./../utils/email.js');
const { promisify } = require('util');
const User = require('./../models/userModel.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
//const User = require('./../models/userModel.js');
const getct = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_expire,
  });
};
exports.signup = async (req, res, next) => {
  try {
    const user = await User.create({
      name: req.body.name,
      photo: req.body.photo,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new EMAIL(user, url).sendWelcome();
    const token = getct(user._id);
    res.cookie('token', token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_expire * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
    });
    user.passwordChangedAt = undefined;
    user.password = undefined;
    return res.status(201).json({
      status: 'success',
      token: token,
      body: user,
    });
  } catch (err) {
    next(err);
  }
  next();
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return next(
        new AppError((message = 'Please enter both email and password'), 400),
      );
    const user = await User.findOne({ email })
      .select('+password')
      .select('-name');
    // select me ham fields + - kar sakte hai output ke liye
    if (!user || !(await user.ps(user.password, password)))
      return next(new AppError('Invalid email or passowrd', 401));
    // console.log(user);
    token = getct(user._id);
    res.cookie('jwt', token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_expire * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
    });
    return res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    next(err);
  }
  next();
};
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'dj', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return res.status(200).json({
    status: 'success',
  });
};
exports.authorize = (...role) => {
  return (req, res, next) => {
    // console.log(req.user.role);
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You are not authorised to do this action', 403),
      );
    }
    //return res.status(204).body();
    next();
  };
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};
exports.protect = async (req, res, next) => {
  // to provide additional protection we have to consider two problems
  // 1)if token exists?
  let token;
  try {
    // we are using headers because general thumb of rule is to send token via authorizationkeyword
    // and token would alway have bearer first
    // console.log(req.headers.authorization);
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) token = req.cookies.jwt;
    //console.log(token);
    if (!token) return next(new AppError('Please login first', 401));
    // one way is this, second way is promisify
    const pr = await jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      function (err, ky) {
        if (err) return next(err);
        return ky;
      },
    );
    //const pr = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    // Now lets find if the given user even exists or not
    if (!pr) return next(new AppError(`I think someone hacked`, 401));
    const user = await User.findById(pr.id);
    //console.log(pr);
    req.user = user;
    //console.log(user);
    if (!user) return next(new AppError(`User doesn't exist anymore`, 401));
    if (user.changedPasswordAfter(pr.iat))
      return next(
        new AppError(`Your session has expired, please login again`, 401),
      );
  } catch (err) {
    return next(err);
  }
  return next();
};

exports.isLoggedin = async (req, res, next) => {
  let token;
  res.locals.user = undefined;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
    // console.log(token);
    // one way is this, second way is promisify
    if (token == 'dj') return next();
    const pr = await jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      function (err, ky) {
        if (err) return next(err);
        return ky;
      },
    );

    if (!pr) return next();
    const user = await User.findById(pr.id);
    //console.log(pr);

    //console.log(user);
    if (!user) return next();

    if (user.changedPasswordAfter(pr.iat)) return next();
    // console.log(user);
    req.user = user;
    res.locals.user = user;
  }
  // console.log(res.locals.user);
  return next();
};
exports.resetpassword = async (req, res, next) => {
  //console.log(req.params.token);
  const hashto = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashto,
    resetTokenExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(`User doesn't exist or token has expired`, 400));
  }
  //console.log(user);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = undefined;
  await user.save();
  const token = getct(user._id);
  // console.log(token);
  return res.status(200).json({
    status: 'success',
    token,
  });
  next();
};
exports.changepassword = async (req, res, next) => {
  try {
    if (
      !req.body.currentPassword ||
      !req.body.newPassword ||
      !req.body.confirmnewPassword
    )
      return next(
        new AppError(
          'Please provide current password and new Password and confirm password',
        ),
      );
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) token = req.cookies.jwt;
    if (!token) return next(new AppError('Invalid token', 401));

    const pr = await jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      function (err, ky) {
        if (err) return next(err);
        return ky;
      },
    );
    const user = await User.findById(pr.id).select('+password');
    // console.log(user);
    if (!(await user.ps(user.password, req.body.currentPassword)))
      return next(new AppError('Invalid password', 401));
    if (req.body.currentPassword == req.body.newPassword)
      return next(
        new AppError(`New password can't be same as old password`, 401),
      );
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.confirmnewPassword;
    await user.save();
    token = getct(user._id);
    res.cookie('jwt', token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_expire * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
    });
    return res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    return next(err);
  }
  next();
};
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new AppError(`This email doesn't exist, please signup first`, 404);
    }
    const tk = user.getresettoken();
    // console.log(tk);
    await user.save({ validateBeforeSave: false });
    const url = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${tk}`;

    try {
      await new EMAIL(user, url).sendReset();
      return res.status(200).json({
        status: 'success',
        message: 'Reset token has been sent to your email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.resetTokenExpire = undefined;
      return next(err);
    }
    // return next();
  } catch (err) {
    return next(err);
  }
};
