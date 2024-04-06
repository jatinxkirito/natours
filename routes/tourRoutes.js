const fs = require('fs');
const express = require('express');
const PackageRouter = express.Router();
const sharp = require('sharp');
//const { checkId } = require(`../app`);
//const data = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/getapifeatures');
const AppError = require('./../utils/appError');
const authc = require('./../controllers/authController.js');
const ReviewRouter = require('./reviewRoutes.js');
const multer = require('multer');
const multerStorage = multer.memoryStorage();
const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(' Only images are allowed', 400), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerfilter });

//PackageRouter.param('id', checkId);

// const checkPost = (req, res, next) => {
//   if (!req.body.name || !req.body.price)
//     return res.status(400).json({
//       status: 'error',
//       message: 'either name or price not present',
//     });
//   next();
// };
const resize_image = async (req, res, next) => {
  // console.log(req.files);
  if (req.files.imageCover) {
    req.body.imageCover = `tours-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tours-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);
        req.body.images.push(filename);
      }),
    );
  }
  next();
};
const getMonthlyplan = async (req, res) => {
  try {
    const year = req.query.year * 1;
    console.log(year);
    const rep = await Tour.aggregate([
      {
        // suppose we have a feature as an array this is used to unwrap that feature and each item will be made into seperate object
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $substr: ['$startDates', 5, 2] },
          count: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    return res.status(200).json({ status: 'success', body: { rep } });
  } catch (err) {
    console.log(err);
    return res.status(404).json({
      status: 'error',
      error: err,
    });
  }
};
const getTourstats = async (req, res) => {
  try {
    // aggregate is like sequential multiple processes can be done in one query
    const stats = await Tour.aggregate([
      {
        // match is like a filter
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        // groupby is used to group values by a certain feature
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          averageRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        // one means ascending
        $sort: { averageRating: 1 },
      },
      // {
      //   $match: {
      //     _id: { $ne: 'easy' },
      //   },
      // },
    ]);
    return res.status(200).json({ status: 'success', body: { stats } });
  } catch (err) {
    return res.status(404).json({
      status: 'error',
      error: err,
    });
  }
};

const getall = async (req, res) => {
  try {
    let fs = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    let tour = await fs.query;

    return res.status(200).json({ status: 'success', body: tour });
  } catch (err) {
    return res.status(404).json({
      status: 'error',
      error: err,
    });
  }
};
const cheap5 = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};
PackageRouter.use('/:Tourid/reviews', ReviewRouter);
PackageRouter.route('/top-5-cheap').get(cheap5, getall);
PackageRouter.route('/tour-stats').get(getTourstats);
PackageRouter.route('/monthly-plan').get(getMonthlyplan);
PackageRouter.get('/', getall);
// PackageRouter.param('id', (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// });

PackageRouter.get('/:id/:dt?', async (req, res, next) => {
  console.log(req.params);

  try {
    let tour = await Tour.findOne({ _id: req.params.id }).populate('reviews');
    if (!tour) return next(new AppError(`Couldn't find this baby`, 404));
    // console.log(tour);
    return res.status(200).json({ status: 'success', body: tour });
  } catch (err) {
    return res.status(404).json({
      status: 'error',
      error: err,
    });
  }

  // if (id > data.length)
  //   return res.status(404).json({
  //     status: 'error',
  //     error: `id doesn't exists`,
  //   });
  // const ob = data.find((ele) => ele.id == id);
  res.status(200).json({
    status: 'success',
    // data: ob,
  });
});
//patch is used to just update the existing data
PackageRouter.route('/:id/:dt?').patch(
  authc.protect,
  authc.authorize('admin'),
  upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
  ]),
  resize_image,
  async (req, res) => {
    console.log(req.params);

    try {
      let tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      return res.status(200).json({ status: 'success', body: tour });
    } catch (err) {
      return res.status(404).json({
        status: 'error',
        error: err,
      });
    }
  },
);
PackageRouter.route('/:id/:dt?').delete(
  authc.protect,
  authc.authorize('admin', 'lead'),
  async (req, res) => {
    console.log(req.params);

    try {
      let tour = await Tour.findByIdAndDelete(req.params.id);
      console.log(tour);
      return res.status(204).json({ status: 'success', body: null });
    } catch (err) {
      return res.status(404).json({
        status: 'error',
        error: err,
      });
    }
  },
);
const CreateTour = async (req, res) => {
  // console.log(req.body);
  // let len = data.length;
  // const newob = Object.assign({ id: data[len - 1].id + 1 }, req.body);
  // data.push(newob);
  try {
    const data = await Tour.create(req.body);

    return res.status(201).json({
      status: 'success',
      data: {
        tour: req.body,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      staus: 'error',
      error: error,
    });
  }
};
const getinRange = async (req, res, next) => {
  const { distance, latlng, dis } = req.params;
  const radius = dis == 'mi' ? distance / 3963.2 : distance / 6378.1;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError('Please provide both latitude and longitude', 400),
    );
  //console.log(lat, lng);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  //console.log(tours.length);

  return res.status(200).json({ staus: 'success', tours });
};
const getds = async (req, res, next) => {
  const { latlng, dis } = req.params;
  const multi = dis == 'mi' ? 0.000621371 : 0.001;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError('Please provide both latitude and longitude', 400),
    );
  const rs = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multi,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  return res.status(200).json({ status: 'success', rs });
};

PackageRouter.route(
  '/tours-within/:distance/coordinates/:latlng/unit/:dis',
).get(getinRange);
PackageRouter.route('/tours-distance/coordinates/:latlng/unit/:dis').get(getds);

PackageRouter.route('/').post(
  authc.protect,
  authc.authorize('admin'),

  CreateTour,
);

// PackageRouter.post('/:Tourid/reviews', authc.protect, addReview);

module.exports = { PackageRouter };
