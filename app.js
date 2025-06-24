var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { createClient } = require("@supabase/supabase-js");
// const multer = require('multer');
const session = require("express-session");
const nunjucks = require("nunjucks");

require("dotenv").config(); // .env
const cors = require("cors");

const app = express();

app.set('trust proxy', 1); // CloudType에서는 프록시 신뢰 설정 필수

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Multer 설정
// const upload = multer({ storage: multer.memoryStorage() });

// 세션 설정
app.use(
  session({
    name: "login_session",
    secret: process.env.SESSION_SECRET || "dksljfkjeijnvjsjdkhsd",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "productionㅇㅇㅇ", // 배포 시 HTTPS 필요 => secure: true 로 설정하기!
      maxAge: 24 * 60 * 60 * 1000, // 24시간
      sameSite: "lax",  // 배포 -> none, 개발 -> lax
    },
  })
);


app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:4000',
      'https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app',
      'https://mini-project06-ice-admin.vercel.app',
      "http://localhost:5174",
      "http://192.168.0.42:5174",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// nunjucks 설정
app.set("view engine", "html");
const env = nunjucks.configure("views", { autoescape: true, express: app });
env.addFilter("numberFormat", function (num) {
  if (typeof num !== "number") num = Number(num);
  if (isNaN(num)) return "";
  return num.toLocaleString();
});
env.addFilter("dateFormat", function (dateStr) {
  // dateStr: '2025-06-20' 또는 Date 객체
  let d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (!(d instanceof Date) || isNaN(d)) return dateStr;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`;
});

// Supabase 미들웨어
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// 라우터

const indexRouter = require("./routes/index");
const signupRouter = require("./routes/signup");
const homeRouter = require("./routes/home");
const reservationRouter = require("./routes/reservation");
const myReservationsRouter = require("./routes/my-reservations");
const payRouter = require("./routes/pay");
const mypageRouter = require("./routes/mypage");
const guideRouter = require("./routes/guide");
const centerRouter = require("./routes/center");
const pushRouter = require("./routes/push");

app.use("/", indexRouter);
app.use("/signup", signupRouter);
app.use("/home", homeRouter);
app.use("/reservation", reservationRouter);
app.use("/my-reservations", myReservationsRouter);
app.use("/pay", payRouter);
app.use("/mypage", mypageRouter);
app.use("/guide", guideRouter);
app.use("/center", centerRouter);
app.use("/push", pushRouter);

module.exports = app;
