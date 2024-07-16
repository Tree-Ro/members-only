const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//Session & Auth
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const app = express();
require('dotenv').config();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//MongoDB setup
require('./config/mongodb-setup')();

//Logging, datahandling & Formatting
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Passport & Sessions
const secret = process.env.SESSION_SECRET;
const mongodb_string = process.env.MONGODB_URL;
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongodb_string }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.session());
app.use(passport.authenticate('session'));

require('./config/passport-setup'); //Strategy && Serialise/Deserialise

// Locals
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
