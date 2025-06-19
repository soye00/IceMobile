var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { createClient } = require('@supabase/supabase-js');
// const multer = require('multer');
const session = require('express-session');

require("dotenv").config();  // .env
const cors = require('cors');
const nunjucks = require("nunjucks");


const app = express();

// Supabase 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Multer 설정 
// const upload = multer({ storage: multer.memoryStorage() });

// 세션 설정
app.use(session({
  name: 'login_session',
  secret: process.env.SESSION_SECRET || 'dksljfkjeijnvjsjdkhsd', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // 배포 시 HTTPS 필요 => secure: true 로 설정하기! 
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// nunjucks 설정
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

// Supabase 미들웨어 
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});



// 라우터

const indexRouter = require('./routes/index');
const signupRouter = require('./routes/signup');
const homeRouter = require('./routes/home');
const reservationRouter = require('./routes/reservation');
const myReservationsRouter = require('./routes/my-reservations');

app.use('/', indexRouter);
app.use('/signup', signupRouter);
app.use('/home', homeRouter);
app.use('/reservation', reservationRouter);
app.use('/my-reservations', myReservationsRouter);

module.exports = app;
