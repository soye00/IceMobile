const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// 내정보 메인 화면
router.get('/', async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  try {
    // 현재 세션의 사용자 정보로 최신 데이터 조회
    const { data: customer, error } = await req.supabase
      .from('customer')
      .select('email, name, phone, addr, image_url')
      .eq('email', req.session.user.email)
      .single();

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      return res.status(500).render('error', { message: '사용자 정보를 불러오는데 실패했습니다.' });
    }

    // 주소 정보 파싱 (postcode, address, address_detail)
    let postcode = '', address = '', address_detail = '';
    if (customer.addr) {
      const addrParts = customer.addr.split(', ');
      if (addrParts.length >= 3) {
        postcode = addrParts[0];
        address = addrParts[1];
        address_detail = addrParts.slice(2).join(', ');
      } else if (addrParts.length === 2) {
        postcode = addrParts[0];
        address = addrParts[1];
      } else {
        address = customer.addr;
      }
    }

    res.render('mypage', { 
      user: {
        ...customer,
        postcode,
        address,
        address_detail
      },
      message: req.query.message || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('내정보 오류:', err);
    res.status(500).render('error', { message: '서버 오류가 발생했습니다.' });
  }
});

// 전화번호 중복체크 (자신의 전화번호는 제외)
router.get('/check-phone', async function(req, res, next) {
  const { phone } = req.query;
  const currentEmail = req.session.user?.email;

  if (!phone) {
    return res.status(400).json({ error: '전화번호를 입력해주세요.' });
  }

  try {
    const { data, error } = await req.supabase
      .from('customer')
      .select('phone')
      .eq('phone', phone)
      .neq('email', currentEmail) // 현재 사용자의 이메일과 다른 경우만 체크
      .single();

    if (error && error.code !== 'PGRST116') { 
      console.error('전화번호 중복체크 오류:', error);
      return res.status(500).json({ error: '중복체크 중 오류가 발생했습니다.' });
    }

    const isDuplicate = data !== null;
    res.json({ isDuplicate, message: isDuplicate ? '이미 사용 중인 전화번호입니다.' : '사용 가능한 전화번호입니다.' });

  } catch (err) {
    console.error('전화번호 중복체크 예외:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 정보 수정
router.post('/update-profile', async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const { name, phone, postcode, address, address_detail } = req.body;

  // 입력 검증
  if (!name || !phone || !postcode || !address) {
    return res.status(400).json({ error: '모든 필수 필드를 입력해주세요.' });
  }

  // 연락처 검증
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '연락처는 010-1234-5678 형식으로 입력해주세요.' });
  }

  try {
    // 주소 필드 join
    const addr = [postcode, address, address_detail].filter(Boolean).join(', ');

    // 슈퍼베이스에서 사용자 정보 업데이트
    const { error } = await req.supabase
      .from('customer')
      .update({ name, phone, addr })
      .eq('email', req.session.user.email);

    if (error) {
      console.error('사용자 정보 업데이트 오류:', error);
      return res.status(500).json({ error: '정보 수정에 실패했습니다.' });
    }

    // 세션 정보도 업데이트
    req.session.user.name = name;
    req.session.user.phone = phone;
    req.session.user.addr = addr;

    res.status(200).json({ message: '정보가 성공적으로 수정되었습니다.' });
  } catch (err) {
    console.error('프로필 업데이트 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 변경
router.post('/change-password', async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 입력 검증
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: '새 비밀번호가 일치하지 않습니다.' });
  }

  // 비밀번호 복잡성 검증 (signup과 동일)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()])[a-zA-Z\d!@#$%^&*()]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ error: '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*())를 포함해 8자 이상이어야 합니다.' });
  }

  try {
    // 현재 비밀번호 확인
    const { data: customer, error: fetchError } = await req.supabase
      .from('customer')
      .select('password')
      .eq('email', req.session.user.email)
      .single();

    if (fetchError || !customer) {
      return res.status(500).json({ error: '사용자 정보를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    const { error: updateError } = await req.supabase
      .from('customer')
      .update({ password: hashedNewPassword })
      .eq('email', req.session.user.email);

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError);
      return res.status(500).json({ error: '비밀번호 변경에 실패했습니다.' });
    }

    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;