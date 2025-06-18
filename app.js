var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const session = require('express-session');

require("dotenv").config();  // .env
const cors = require('cors');
const nunjucks = require("nunjucks");


const app = express();

// Supabase 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Multer 설정 
const upload = multer({ storage: multer.memoryStorage() });

// // 세션 설정
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'env시크릿키추가하기',
//   resave: false,
//   saveUninitialized: false,
//   cookie: { secure: false }, // 배포 시 true로 설정하기 !! 
// }));

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

app.use('/', indexRouter);
app.use('/signup', signupRouter);
app.use('/home', homeRouter);

module.exports = app;
