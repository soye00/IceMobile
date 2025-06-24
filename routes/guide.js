const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('guide', {title: '서비스 안내'});
}); 

module.exports = router;