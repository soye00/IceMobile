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
          console.log('푸시 구독 정보 저장 성공 - phone:', phone);
        }
      }
    
    res.status(201).json({});
});

module.exports = router;