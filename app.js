var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require("dotenv").config();  // .env
const cors = require('cors');
const nunjucks = require("nunjucks");

var indexRouter = require('./routes/index');
var signupRouter = require('./routes/signup');

var app = express();

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

app.use('/', indexRouter);
app.use('/signup', signupRouter);


module.exports = app;
