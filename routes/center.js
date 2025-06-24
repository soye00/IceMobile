const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('center', {title: '고객센터'});
});

module.exports = router;