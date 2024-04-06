const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./../models/userModel.js');
// validators are used to check string before accepting it as a valid entry
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      minLength: [10, 'Length has to be atleast 10 ... I mean come on'],
      maxLength: [40, `Hold you horses... don't exceed 40 characters`],
      // validate: [validator.isAlpha, `Don't look at me... Stooooopid`],
    },
    slug: String,
    secret: {
      type: Boolean,
      default: false,
    },

    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'Tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'], // used to ensure that values entered are present in this array
        message: `It's either easy, medium or peaky fooking hard`,
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, `You can't go lower than 1 but I mean it can't be that bad `],
      max: [
        5,
        `Yes we really appreciate the fact that you loved it.. but sorry you can't rate more than 5`,
      ],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      set: (val) => Math.round(val * 10) / 10,
    },
    discount: {
      type: Number,
      validate: {
        validator: function (dis) {
          return dis < this.price;
        },
        message:
          'Fucking ({VALUE})? where do you think money comes from? Trees?',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a summary'],
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    startLocation: {
      type: {
        type: String,
        defualt: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          defualt: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // This one is used for embedding

    // guides: Array,

    //Now for refrencing

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// virtuals are terms that not need to be saved in scema as the are calculated from other terms
tourSchema.virtual('durationWeeks').get(function () {
  // not using arrow function because we need this keyword and arrow function doesnt has access to tha
  return this.duration / 7;
});
// Document middleware
// this middleware runs before .save and .create yani bilkul execution ke baad jab server me changes hore honge
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.index({ price: 1, ratingsAveragePrice: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// This method is used for embedding

// tourSchema.pre('save', async function (next) {
//   guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });
// tourSchema.pre('save', function (next) {
//   console.log('creating');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query middleware -> It is used in find and update operations
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.find({ secret: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.post(/^find/, function (doc, next) {
  // console.log(doc);
  console.log(Date.now() - this.start);
  next();
});

// aggregate middleware-> I think naam se hi obvious hai

// tourSchema.pre('aggregate', function (next) {
//   console.log(this.pipeline());
//   this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
