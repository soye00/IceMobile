const express = require('express');
const router = express.Router();

// 결제 페이지
router.get('/checkout/:res_no', async function(req, res, next) {
    try {
      const supabase = req.supabase;
      const res_no = req.params.res_no;
  
      // reservation 테이블에서 예약 정보 조회
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservation')
        .select('*, user_email')
        .eq('res_no', res_no)
        .single();
  
      if (reservationError || !reservationData) {
        return res.status(404).send('예약 정보를 찾을 수 없습니다.');
      }
  
      // customer 테이블에서 고객 정보 조회
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .select('name, phone, email')
        .eq('email', reservationData.user_email)
        .single();
  
      if (customerError || !customerData) {
        return res.status(404).send('고객 정보를 찾을 수 없습니다.');
      }
  
      // 전화번호 하이픈 제거
      const customer = {
        ...customerData,
        phone: customerData.phone.replace(/-/g, ''),
      };
  
      // 예약 정보와 고객 정보를 결합
      const reservation = {
        ...reservationData,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      };
  
      // orderId 생성
      const orderId = `ORDER_${res_no}_${Date.now()}`; // 6자 이상 보장
  
      return res.render('pay/checkout.html', {
        title: '결제하기',
        res_no,
        orderId, 
        reservation,
      });
    } catch (err) {
      return next(err);
    }
  });
  
  // 결제 성공 페이지
  router.get('/success', async function(req, res, next) {
    try {
      const supabase = req.supabase;
      const orderId = req.query.orderId;
  
      // orderId에서 res_no 추출 
      const res_no = orderId.split('_')[1]; 
  
      // 예약 상태 업데이트
      const { error: updateError } = await supabase
        .from('reservation')
        .update({ state: 3 })
        .eq('res_no', res_no);
  
      if (updateError) {
        throw updateError;
      }
  
      // 예약 정보 조회
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservation')
        .select('*, user_email')
        .eq('res_no', res_no)
        .single();
  
      if (reservationError || !reservationData) {
        return res.status(404).send('예약 정보를 찾을 수 없습니다.');
      }
  
      // 고객 정보 조회
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .select('name, phone, email')
        .eq('email', reservationData.user_email)
        .single();
  
      if (customerError || !customerData) {
        return res.status(404).send('고객 정보를 찾을 수 없습니다.');
      }
  
      // 예약 정보와 고객 정보 결합
      const reservation = {
        ...reservationData,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
      };
  
      return res.render('pay/success', { reservation });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;