var express = require('express');
var router = express.Router();



router.get('/', async function(req, res, next) {

  // const username = '홍길동';
  // const nextReservation = '2025-06-15';
  // const recentReservation = '2025-06-10';

  if(!req.session.user) {
    return res.redirect('/');
  }

  try {
    // Supabase에서 예약 조회
    const { data: reservations, error } = await req.supabase
      .from('reservation')
      .select('date')
      .eq('user_email', req.session.user.email)
      .order('date', { ascending: false });

    if (error) {
      console.error('예약 조회 오류:', error);
      return res.status(500).json({ error: '예약 조회 중 오류가 발생했습니다.' });
    }

    const recentReservation = reservations.length > 0 ? reservations[0].date : null;
    const nextReservation = reservations.find(r => new Date(r.date) > new Date())?.date || null;

    res.render('home', {
      title: 'ICECARE',
      username: req.session.user.name,
      recentReservation,
      nextReservation
    });
  } catch (err) {
    console.error('홈 페이지 렌더링 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});


module.exports = router;