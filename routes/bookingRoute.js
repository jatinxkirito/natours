const express = require('express');
const bookingRouter = express.Router();
const authc = require('./../controllers/authController.js');
const booking = require('./../controllers/bookingController.js');
const AppError = require('./../utils/appError.js');
bookingRouter
  .route('/checkout/:tourid')
  .get(authc.protect, booking.generateCheckout);
module.exports = bookingRouter;
