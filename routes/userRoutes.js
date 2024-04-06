const express = require('express');
const UserRouter = express.Router();
const sharp = require('sharp');
const authc = require('./../controllers/authController.js');
const User = require('./../models/userModel.js');
const AppError = require('./../utils/appError.js');
const multer = require('multer');
const multerStorage = multer.memoryStorage();
// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/img/users/');
//   },
//   filename: function (req, file, cb) {
//     const filetype = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${filetype}`);
//     // null goes for error
//     // if there is error we replace null with err
//   },
// });
const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(' Only images are allowed', 400), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerfilter });
const getUpdatedata = (data, ...features) => {
  let obj = {};
  // console.log(data);
  Object.keys(data).forEach((key) => {
    if (features.includes(key)) {
      obj[key] = data[key];
    }
  });
  return obj;
};
const getm = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordChangedAt');
  return res.status(200).json({ user });
};
const deleteUser = async (req, res, next) => {
  if (!req.body.password)
    return next(new AppError('Please provide password', 403));
  const user = await User.findById(req.user.id).select('+password');
  if (!user.ps(user.password, req.body.password))
    return next(new AppError('Invalid password', 403));
  // console.log(await User.findByIdAndDelete(user.id));
  return res.status(200).json({ status: 'success', token: undefined });
};
const resize_image = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500, { fit: 'contain' })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};
const update_content = async (req, res, next) => {
  // console.log(req.file);
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        `Respectfully speaking.....I don't even know why would a frontend engineer do it... Including password update with all other data?`,
        400,
      ),
    );
  const x = getUpdatedata(req.body, 'name', 'email');
  if (req.file) x.photo = req.file.filename;
  //console.log(req.file);
  const y = await User.findByIdAndUpdate(req.user.id, x, {
    new: true,
    runValidators: true,
  });
  //console.log(y);

  //await User.findByIdAndUpdate(req.user._id);
  return res.status(200).json({ status: 'success', y });
};
const getAllusers = async (req, res, next) => {
  try {
    const user = await User.find();
    return res.status(200).json({ status: 'success', body: user });
  } catch (err) {
    return next(err);
  }
  next();
};
const getuser = (req, res) => {
  res.status(200).json({
    status: 'error',
    message: 'This route has not been configur',
  });
};
const deleteuser = (req, res) => {
  res.status(200).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
const updateuser = (req, res) => {
  res.status(200).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
UserRouter.route('/forgotpassword').post(authc.forgotPassword);
UserRouter.route('/changepassword').patch(authc.changepassword);
UserRouter.route('/update_content').patch(
  authc.protect,
  upload.single('photo'),
  resize_image,
  update_content,
);
UserRouter.route('/deleteuser').delete(authc.protect, deleteUser);
UserRouter.route('/resetpassword/:token').patch(authc.resetpassword);
UserRouter.route('/signup').post(authc.signup);
UserRouter.route('/').get(authc.protect, getAllusers);
UserRouter.route('/login').post(authc.login);
UserRouter.route('/logout').get(authc.logout);
UserRouter.route('/me').get(authc.protect, getm);
UserRouter.route('/:id').get(getuser).delete(deleteuser).patch(updateuser);
module.exports = { UserRouter };
