const dotenv = require('dotenv');
const Tour = require('./models/tourModel');
const User = require('./models/userModel');
const Review = require('./models/reviewModel');
const fs = require('fs');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
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
const deletour = async () => {
  try {
    await Tour.deleteMany();
    // await Review.deleteMany();
    // await User.deleteMany();
    console.log('deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const data = JSON.parse(fs.readFileSync('./dev-data/data/tours.json', 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync('./dev-data/data/reviews.json', 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync('./dev-data/data/users.json', 'utf-8'),
);
const addTour = async () => {
  try {
    // console.log(data);

    const x = await Tour.create(data);
    // const y = await Review.create(reviews);
    // const z = await User.create(users, { validateBeforeSave: false });
    console.log('added');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] == '--import') addTour();
else if (process.argv[2] == '--delete') deletour();
//console.log(process.argv);
