var express = require('express');
var router = express.Router();



router.get('/', function(req, res, next) {

  const username = '홍길동';
  const nextReservation = '2025-06-15';
  const recentReservation = '2025-06-10';

    res.render('home', { 
      title: 'ICECARE',
      username,
      nextReservation,
      recentReservation,
    });
  });

module.exports = router;