const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('mypage', { title: '내정보' });
});

module.exports = router;