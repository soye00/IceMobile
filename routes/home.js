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
      .select('date, state')
      .eq('user_email', req.session.user.email)
      .order('date', { ascending: false });

    if (error) {
      console.error('예약 조회 오류:', error);
      return res.status(500).json({ error: '예약 조회 중 오류가 발생했습니다.' });
    }

    console.log("여기오나")
    // 결제완료(3), 기사배정(4) 중 nextReservation : 다음 예약일
    console.log(reservations);
    
    const nextReservation = reservations
  
      .filter(
        r => {
          console.log(r.date);
          console.log(1);

          return (r.state === 3 || r.state === 4) && new Date(r.date) >= new Date()
        }
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.date || null;

    // 청소완료(5) 중 가장 최근 예약  recentReservation : 최근 완료 예약건 
    const recentReservation = reservations
      .filter(r => r.state === 5)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || null;

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