const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/', function(req, res, next) {
  res.render('signup', { title: '회원가입' });
});

// 전화번호 중복체크
router.get('/check-phone', async function(req, res, next) {
  const { phone } = req.query;

  console.log('phone',phone);

  if (!phone) {
    return res.status(400).json({ error: '전화번호를 입력해주세요.' });
  }

  try {
    const { data, error } = await req.supabase
      .from('customer')
      .select('phone')
      .eq('phone', phone)
      .single();
      console.log('중복체크 결과:',{data,error});

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

router.get('/check-email', async function(req, res, next) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: '이메일을 입력해주세요.' });
  }

  try {
    const { data, error } = await req.supabase
      .from('customer')
      .select('email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116는 결과가 없을 때
      console.error('이메일 중복체크 오류:', error);
      return res.status(500).json({ error: '중복체크 중 오류가 발생했습니다.' });
    }

    const isDuplicate = data !== null;
    res.json({ isDuplicate, message: isDuplicate ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.' });
  } catch (err) {
    console.error('이메일 중복체크 예외:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});




router.post('/', async function(req, res, next) {
  console.log('회원가입 요청 시작');
  const { name, phone, email, password, password_confirm, postcode, address, address_detail } = req.body;

  const supabase = req.supabase;
  console.log('요청 데이터:', req.body);

  // 입력 검증
  if (!name || !phone || !email || !password || !postcode || !address ) {
    console.log('입력 검증 실패');
    return res.status(400).json({ error: '모든 필수 필드를 입력해주세요.' });
  }


  // 연락처 검증
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    console.log('입력 검증 실패: 연락처 형식이 잘못됨');
    return res.status(400).json({ error: '연락처는 010-1234-5678 형식으로 입력해주세요.' });
  }

  // 이메일 검증
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    console.log('입력 검증 실패: 이메일 형식이 잘못됨');
    return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요.' });
  }

  // 비밀번호 복잡성 검증
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()])[a-zA-Z\d!@#$%^&*()]{8,}$/;
  if (!passwordRegex.test(password)) {
    console.log('입력 검증 실패: 비밀번호 형식이 잘못됨');
    return res.status(400).json({ error: '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*())를 포함해 8자 이상이어야 합니다.' });
  }


  console.log('입력 검증 통과');

  // 주소 필드 join
  const addr = [postcode, address, address_detail].filter(Boolean).join(', ');

  // 비밀번호 해시 처리
  let hashedPassword;
  try {
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);
    // console.log('해시된 비밀번호:', hashedPassword);
    // console.log('비밀번호 해시 처리 완료');
  } catch (err) {
    console.error('bcrypt 해시 처리 오류:', err);
    return res.status(500).json({ error: '비밀번호 암호화 중 오류가 발생했습니다.' });
  }

  // supabase insert
  try {
    console.log('Supabase insert 시작');
    const { data, error } = await supabase.from('customer').insert({
      name,
      phone,
      email,
      password:hashedPassword,
      addr,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      if (error.code === '23505') { 
        return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
      }
      return res.status(500).json({ error: `회원가입 중 오류: ${error.message}` });
    }

    console.log('Supabase insert 성공');
    console.log('회원가입 성공:', { message: '회원가입 성공', data });
    console.log('응답 전송 시작');
    res.status(200).json({ message: '회원가입 성공', data });
    console.log('응답 전송 완료');

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;