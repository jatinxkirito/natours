const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
exports.overview = async (req, res) => {
  const tours = await Tour.find();

  return res.status(200).render('overview', {
    title: 'Overview',
    tours,
  });
};
exports.tour = async (req, res, next) => {
  const data = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews',
    //select: '-createdAt -__v',
    'review rating user',
  );
  //console.log(data.reviews[0]);
  if (!data) {
    return next(new AppError('There is no tour with that name.', 404));
  }
  return res.status(200).render('tour', {
    title: `${data.name}`,
    data,
  });
};
exports.login = (req, res) => {
  return res.status(200).render('login', {
    title: 'login',
  });
};
exports.home = (req, res) => {
  return res.status(200).render('base', {
    title: 'Home',
  });
};
exports.me = (req, res, next) => {
  if (req.cookies.jwt) return res.status(200).render('account', {});
  return next(new AppError('Please login First', 500));
};
exports.change_data = async (req, res, next) => {
  //console.log('raichu');
  // console.log(req.body);

  const update_user = await User.findByIdAndUpdate(req.user._id, {
    name: req.body.name,
    email: req.body.email,
  });
  //return res.status(200).json({ user: update_user });
  return res.status(200).render('account', {
    // title: `${data.name}`,
    user: update_user,
  });
};
