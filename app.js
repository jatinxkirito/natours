require('express-async-errors');
const express = require('express');
const path = require('path');
const AppError = require('./utils/appError');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PackageRouter } = require('./routes/tourRoutes');
const { UserRouter } = require('./routes/userRoutes');
const ReviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoute');
const sanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cln = require('xss-clean');
const ErrorController = require(`./controllers/errorController`);
const compression = require('compression');
const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json()); // express.json ek middleware hai jo shape deta hai hamare data ko
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(`${__dirname}/public`)); // for loading static files

exports.checkId = (req, res, next, val) => {
  let id = val;
  id = id * 1;
  if (!id)
    return res.status(404).json({
      status: 'error',
      error: 'invalid id',
    });

  if (id > data.length)
    return res.status(404).json({
      status: 'error',
      error: `id doesn't exists`,
    });
  next();
};
app.use(compression());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitize());
app.use(cln());
// app.use(helmet());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 100 });
app.use('/api', limiter);
// app.use((req, res, next) => {
//   console.log('Pikachuuuuuuu');
//   next();
// });
//const data = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));
// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'This is the bitch', ot: 'Pikachu' });
// });

app.use(`/api/v1/tours`, PackageRouter);
app.use(`/api/v1/users`, UserRouter);
app.use('/api/v1/reviews', ReviewRouter);
app.use(`/api/v1/booking`, bookingRouter);
app.use('/', viewRouter);
app.all(`*`, (req, res, next) => {
  const error = new AppError(
    `Can't find address ${req.originalUrl} on this server`,
    404,
  );
  // error.statusCode = 404;
  // error.status = 'fail';
  next(error);
});
app.use(ErrorController);

module.exports = { app };
