const express = require('express');
const router = express.Router();

// 예약 폼 페이지
router.get('/', async function(req, res, next) {
  const user = req.session?.user || {};
  // addr 분리
  let postcode = '', address = '', address_detail = '';
  if (user.addr) {
    [postcode, address, address_detail] = user.addr.split(',').map(s => s.trim());
  }
  res.render('reservation', {
    title: '예약하기',
    user: {
      ...user,
      postcode,
      address,
      address_detail
    }
  });
});

// 예약 정보 저장
router.post('/', async function(req, res, next) {
  const { date, time, addr, model, remark, agree } = req.body;
  const user = req.session?.user || {};
  const user_email = user.email;
  const gisa_email = null; // 기사 배정 전

  try {
    const { data, error } = await req.supabase
      .from('reservation')
      .insert({
        date,
        time,
        addr,
        model,
        remark,
        agree: agree === 'on' || agree === true,
        user_email,
        gisa_email,
        state: 0
      });

    if (error) {
      return res.status(500).render('reservation', { title: '예약하기', user, error: error.message });
    }
    res.redirect('/reservation/complete');
  } catch (err) {
    res.status(500).render('reservation', { title: '예약하기', user, error: err.message });
  }
});

// 예약 완료 페이지
router.get('/complete', (req, res) => {
  res.render('reservation_complete', { title: '예약 완료' });
});

// 예약 내역 리스트 페이지
router.get('/my-reservations', async function(req, res, next) {
  const user = req.session?.user;
  if (!user) return res.redirect('/');
  try {
    const { data: reservations, error } = await req.supabase
      .from('reservation')
      .select('*')
      .eq('user_email', user.email)
      .order('date', { ascending: false });
    if (error) throw error;
    res.render('my_reservations', { title: '예약 내역', reservations });
  } catch (err) {
    res.status(500).render('my_reservations', { title: '예약 내역', reservations: [], error: err.message });
  }
});

module.exports = router;