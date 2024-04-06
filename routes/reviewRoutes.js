const express = require('express');
const ReviewRouter = express.Router({ mergeParams: true });
const authc = require('./../controllers/authController.js');
const Review = require('./../models/reviewModel.js');
const getReview = async (req, res, next) => {
  //console.log('nflads');
  const filter = {};
  if (req.params.Tourid) filter.tour = req.params.Tourid;

  //filter.dt = undefined;
  const data = await Review.find(filter);
  console.log(data.length);
  return res.status(200).json({ data });
};
const addReview = async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.Tourid;
  const rev = await Review.create({ ...req.body, user: req.user.id });
  //console.log('sdk;a');
  return res.status(200).json({ rev });
};
ReviewRouter.route(`/`).get(getReview);
ReviewRouter.route(`/:id`)
  .patch(authc.protect, authc.authorize('user'), async (req, res) => {
    // console.log(req.params);

    try {
      let tour = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      // console.log(tour);
      return res.status(200).json({ status: 'success', body: tour });
    } catch (err) {
      return res.status(404).json({
        status: 'error',
        error: err,
      });
    }
  })
  .delete(authc.protect, authc.authorize('admin', 'user'), async (req, res) => {
    // console.log(req.params);

    try {
      let tour = await Review.findByIdAndDelete(req.params.id);
      //  console.log(tour);
      return res.status(204).json({ status: 'success', body: null });
    } catch (err) {
      return res.status(404).json({
        status: 'error',
        error: err,
      });
    }
  });
ReviewRouter.route(`/`).post(
  authc.protect,
  authc.restrictTo('user'),
  addReview,
);
module.exports = ReviewRouter;
