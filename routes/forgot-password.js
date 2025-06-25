const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('forgot-password', {title: '비밀번호 찾기'});
});

module.exports = router;