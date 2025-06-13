var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('signup', { title: '회원가입' });
  });

module.exports = router;