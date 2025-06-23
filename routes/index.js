var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');

router.get('/', function(req, res, next) {
  if(req.session.user) {
    res.redirect('/home');
  }

  res.render('index', { title: 'ICECARE' });
});

/* POST: 로그인 처리 */
router.post('/login', async function(req, res, next) {
  const { email, password, remember } = req.body;

  // 입력 검증
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    // Supabase에서 사용자 조회
    const { data, error } = await req.supabase
      .from('customer')
      .select('email, password, name, phone, addr')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error('로그인 오류: 사용자 없음 또는 Supabase 오류', error);
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 세션에 사용자 정보 저장
    req.session.user = {
      email: data.email,
      name: data.name,
      phone: data.phone,
      addr: data.addr
    };

    // 로그인 유지 설정
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24시간
    }

    console.log('req.session.user', req.session.user);

    // 로그인 성공 응답
    res.status(200).json({ message: '로그인 성공', redirect: '/home' });
  } catch (err) {
    console.error('로그인 처리 중 오류:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/* POST: 로그아웃 처리 */
router.post('/logout', function(req, res, next) {
  req.session.destroy(err => {
    if (err) {
      console.error('세션 종료 오류:', err);
      return res.status(500).json({ error: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.status(200).json({ message: '로그아웃 성공', redirect: '/' });
  });
});



module.exports = router;
