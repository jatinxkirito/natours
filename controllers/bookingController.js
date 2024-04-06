const AppError = require('./../utils/appError.js');
const Tour = require('./../models/tourModel.js');
const Booking = require('./../models/bookingModel.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.generateCheckout = async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourid);
  // generating checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    payment_method_types: ['card'],
    client_reference_id: req.params.tourid,
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name}`,
            images: [
              'https://static.toiimg.com/photo/msid-79940540,width-96,height-65.cms',
            ],
            description: `${tour.summary}`,
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },

      //   {
      //     name: `${tour.name}`,
      //     // description: `${tour.summary}`,
      //     // images: [
      //     //   'https://static.toiimg.com/photo/msid-79940540,width-96,height-65.cms',
      //     // ],
      //     // currency: 'usd',
      //     // price: { unit_amount: tour.price * 100, currency: 'usd' },

      //     quantity: 1,
      //   },
    ],
  });
  return res.status(200).json({
    status: 'success',
    session,
  });
};
exports.createBooking = async (req, res, next) => {
  try {
    const { tour, user, price } = req.query;
    if (!tour || !user || !price) return next();
    await Booking.create({ tour, user, price });
    res.redirect(req.originalUrl.split('?')[0]);
    next();
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
exports.myBookings = async (req, res, next) => {
  try {
    //console.log(req.user.id);

    const bookings = await Booking.find({ user: req.user.id });

    const tourID = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourID } });

    return res.status(200).render('overview', {
      title: 'My tours',
      tours,
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
