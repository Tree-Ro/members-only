const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//Session & Auth
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/user');

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
app.use(session({ secret: secret, resave: false, saveUninitialized: true }));
app.use(passport.session());

passport.use(
  new LocalStrategy(async (email, password, done) => {
    console.log(
      'This function is never invoked despite passport.authenticate("local") getting run'
    );

    try {
      const user = await User.findOne({ email: email });
      if (!user) return done(null, false, { message: 'Incorrect username' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Incorrect password' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
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
