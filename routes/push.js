const express = require('express');
const router = express.Router();

router.post('/subscribe', async(req, res) => {
    console.log(req.body);
    const {endpoint, keys: { p256dh, auth}} = req.body;
    const subscription = {endpoint, p256dh, auth};
    console.log(subscription);
    if (endpoint && p256dh && auth) {
        const { error: upsertError } = await req.supabase
          .from('push_subscribe')
          .upsert([
            {
              phone :"admin",
              endpoint,
              p256dh,
              auth,
              updated_at: new Date()
            }
          ], { onConflict: ['phone'] });
    
        if (upsertError) {
          console.error('푸시 구독 정보 저장 실패:', upsertError);
        } else {
          console.log('푸시 구독 정보 저장 성공 - phone:', "admin이 구독함");
        }
      }
    
    res.status(201).json({});
});


router.post('/send/:phone', async(req, res) => {
  console.log("send push 왔냐?");
    const { phone } = req.params;
    const { res_no } = req.body;

    console.log(phone);
    console.log(res_no);

    const { data:pushSub, error } = await req.supabase
      .from('push_subscribe')
      .select('*')
      .eq('phone', phone);

    console.log(data);

   // 3. 푸시 페이로드 구성
   const payload = JSON.stringify({
     title: "기사 배정 완료!",
     body: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일 기사배정이 완료되었습니다.`,
     url: `https://mini-project06-ice-admin.vercel.app/reservation/${res_no}`,
   });

   // 4. 푸시 구독 정보 구조 맞추기
   const subscription = {
     endpoint: pushSub.endpoint,
     keys: {
       p256dh: pushSub.p256dh,
       auth: pushSub.auth,
     },
   };

   // 5. 푸시 전송
   await webpush
     .sendNotification(subscription, payload)
     .then((response) => {
       console.log("푸시 전송 성공:", response.statusCode);
     })
     .catch((err) => {
       console.error("푸시 전송 실패:", err);
     });
});

module.exports = router;