const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('reservation', { title: '예약하기' });
});



module.exports = router;