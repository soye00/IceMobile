const express = require('express');
const router = express.Router();

// 예약 완료 페이지
router.get('/complete', (req, res) => {
  res.render('reservation_complete', { title: '예약 완료' });
});

// 예약 상세 페이지
router.get('/:res_no', async function(req, res, next) {
  const res_no = req.params.res_no;
  const user = req.session?.user;
  if (!user) return res.redirect('/');
  try {
    // 예약 정보 가져오기
    const { data: reservation, error } = await req.supabase
      .from('reservation')
      .select('*')
      .eq('res_no', res_no)
      .single();
    if (error || !reservation) throw error || new Error('예약 정보를 찾을 수 없습니다.');

    // 기사 정보 (state==4일 때만)
    let engineer = null;
    if (reservation.state == 4) {
      const { data: engineers, error: engErr } = await req.supabase
        .from('member')
        .select('file_url, nm, tel')
        .eq('auth', 2)
        .limit(1);
      if (!engErr && engineers && engineers.length > 0) {
        engineer = engineers[0];
      }
    }
    // 상태별 텍스트/컬러, 멘트
    const state_colors = {
      '1': { text: '신규예약', color: '#4CAF50' },
      '2': { text: '결제대기', color: '#FF9800' },
      '3': { text: '결제완료', color: '#2196F3' },
      '4': { text: '기사배정', color: '#9C27B0' },
      '5': { text: '청소완료', color: '#607D8B' },
      '6': { text: '예약취소', color: '#F44336' }
    };
    const state_messages = {
      '1': '신규 예약이 등록되었습니다.',
      '2': '아래 금액을 확인 후 결제를 완료해 주세요.',
      '3': '결제가 완료되었습니다.',
      '4': '기사 배정이 확정되었습니다.',
      '5': '청소가 완료되었습니다.',
      '6': '예약이 취소되었습니다.'
    };
    res.render('reservation_detail', {
      title: '예약 상세',
      reservation,
      engineer,
      state_colors,
      state_messages
    });
  } catch (err) {
    res.status(500).render('my_reservations', { title: '예약 내역', reservations: [], error: err.message });
  }
});

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
        state: 1
      });

    if (error) {
      return res.status(500).render('reservation', { title: '예약하기', user, error: error.message });
    }
    res.redirect('/reservation/complete');
  } catch (err) {
    res.status(500).render('reservation', { title: '예약하기', user, error: err.message });
  }
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