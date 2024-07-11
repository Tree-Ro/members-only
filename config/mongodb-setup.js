require('dotenv').config();

//Set up mongoose connection
const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
const dev_db_url = 'fakemongodburl';
const mongoDB = process.env.MONGODB_URL || dev_db_url;

async function main() {
  try {
    await mongoose.connect(mongoDB);
  } catch (err) {
    console.log(err);
  }
}

module.exports = main;
