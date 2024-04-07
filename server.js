const dotenv = require('dotenv');
const mongoose = require('mongoose');
// process.on('uncaughtException', (err) => {
//   console.log(err);
//   console.log('Shutting down...');

//   process.exit(1);
// });
const Tour = require('./models/tourModel');
dotenv.config({ path: './config.env' });
const app = require('./app');
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Blobfish');
  })
  .catch((error) => {
    console.log(error);
  });
const port = process.env.PORT || 3000;
// process.on('unhandledRejection', (err) => {
//   console.log(err);
//   console.log('Shutting down...');
//   // app.close(() => {
//   process.exit(1);
//   // });
// });
// const newTour = new Tour({
//   name: 'charmander',
//   price: 500,
// });
// newTour.save().then((data) => console.log(data));
// console.log(process.env);
app.listen(port, () => {
  console.log('App is running');
});
