const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema({
  review: { type: String, required: [true, `Review can't be empty`] },
  rating: {
    type: Number,
    required: [true, `Rating can't be empty`],
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});
reviewSchema.statics.clcAverageRating = async function (tourId) {
  const stats = await Review.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating,
  });
};
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });
reviewSchema.post('save', function (data) {
  this.constructor.clcAverageRating(this.tour);
});
reviewSchema.post(/^findOne/, function (data) {
  //console.log('sdk');
  //console.log(this.constructor);
  try {
    Review.clcAverageRating(data.tour);
  } catch (e) {
    console.log(e);
  }
  //next();
});
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  // this.populate({ path: 'tour', select: 'name' });
  next();
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
