const express = require('express');
const router = express.Router();
const webpush = require('web-push');

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
      .eq('phone', phone)
      .single();

    console.log(pushSub);
  try{
   // 3. 푸시 페이로드 구성
   const payload = JSON.stringify({
     title: "기사 배정 완료!",
     body: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일 기사배정이 완료되었습니다.`,
     url: `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${res_no}`,
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
     res.status(200).json({ message: 'success' });
    } catch (error) {
      res.status(500).json({ message: 'fail' });
    }
});



router.post('/price_change/:phone', async(req, res) => {
  console.log("price_change push 왔냐?");
    const { phone } = req.params;
    const { res_no, price } = req.body; 

    console.log(phone);
    console.log(res_no);

    const { data:pushSub, error } = await req.supabase
      .from('push_subscribe')
      .select('*')
      .eq('phone', phone)
      .single();

    console.log(pushSub);
  try{
   // 3. 푸시 페이로드 구성
   const payload = JSON.stringify({
     title: "예약하신 서비스의 결제금액이 확정되었습니다!",
     body: `결제금액 : ${price}원\n결제를 진행해 주시면 서비스가 확정됩니다.`,
     url: `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${res_no}`,
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
     res.status(200).json({ message: 'success' });
    } catch (error) {
      res.status(500).json({ message: 'fail' });
    }
});



router.post('/complete/:phone', async(req, res) => {
  console.log("complete push 왔냐?");
    const { phone } = req.params;
    const { res_no} = req.body;

    console.log(phone);
    console.log(res_no);

    const { data:pushSub, error } = await req.supabase
      .from('push_subscribe')
      .select('*')
      .eq('phone', phone)
      .single();

    console.log(pushSub);
  try{
   // 3. 푸시 페이로드 구성
   const payload = JSON.stringify({
     title: "고객님! 청소가 모두 끝났어요 🧽✨",
     body: `고객님께서 예약하신 청소가 성공적으로 완료되었습니다.\n이용해 주셔서 감사합니다 😊`,
     url: `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${res_no}`,
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
     res.status(200).json({ message: 'success' });
    } catch (error) {
      res.status(500).json({ message: 'fail' });
    }
});



module.exports = router;