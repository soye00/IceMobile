const express = require("express");
const router = express.Router();
const webpush = require("web-push");

// 예약 완료 페이지
router.get("/complete", (req, res) => {
  res.render("reservation_complete", { title: "예약 완료" });
});

// 예약 상세 페이지
router.get("/:res_no", async function (req, res, next) {
  const res_no = req.params.res_no;
  const user = req.session?.user;
  if (!user) return res.redirect("/");
  try {
    // 예약 정보 가져오기
    const { data: reservation, error } = await req.supabase
      .from("reservation")
      .select("*")
      .eq("res_no", res_no)
      .single();
    if (error || !reservation)
      throw error || new Error("예약 정보를 찾을 수 없습니다.");

    // 기사 정보 (state>=4일 때 모두)
    let engineer = null;
    if (reservation.state >= 4) {
      const { data: engineers, error: engErr } = await req.supabase
        .from("member")
        .select("file_url, nm, tel")
        .eq("auth", 2)
        .limit(1);
      if (!engErr && engineers && engineers.length > 0) {
        engineer = engineers[0];
      }
    }
    // 상태별 텍스트, 컬러, 멘트
    const state_colors = {
      1: { text: "신규예약", color: "#4CAF50" },
      2: { text: "결제대기", color: "#FF9800" },
      3: { text: "결제완료", color: "#2196F3" },
      4: { text: "기사배정", color: "#9C27B0" },
      5: { text: "청소완료", color: "#607D8B" },
      6: { text: "예약취소", color: "#F44336" },
    };
    const state_messages = {
      1: "신규 예약이 등록되었습니다.",
      2: "아래 금액을 확인 후 결제를 완료해 주세요.",
      3: "결제가 완료되었습니다.",
      4: "기사 배정이 확정되었습니다.",
      5: "청소가 완료되었습니다.",
      6: "예약이 취소되었습니다.",
    };
    res.render("reservation_detail", {
      title: "예약 상세",
      reservation,
      engineer,
      state_colors,
      state_messages,
    });
  } catch (err) {
    res
      .status(500)
      .render("my_reservations", {
        title: "예약 내역",
        reservations: [],
        error: err.message,
      });
  }
});

// 예약 폼 페이지
router.get("/", async function (req, res, next) {
  const user = req.session?.user || {};
  // addr 분리
  let postcode = "",
    address = "",
    address_detail = "";
  if (user.addr) {
    [postcode, address, address_detail] = user.addr
      .split(",")
      .map((s) => s.trim());
  }
  res.render("reservation", {
    title: "예약하기",
    user: {
      ...user,
      postcode,
      address,
      address_detail,
    },
  });
});

// 예약 정보 저장
router.post('/', async function (req, res, next) {
  const { date, time, addr, model, remark, agree } = req.body;
  const user = req.session?.user || {};
  const user_email = user.email;
  const gisa_email = null;

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
        state: 1,
      })
      .select('res_no')
      .single();

    if (error) {
      return res.status(500).render('reservation', {
        title: '예약하기',
        user,
        error: error.message,
      });
    }

    const res_no = data.res_no;

    // 푸시 구독 정보 가져오기
    const { data: pushSubs, error: pushError } = await req.supabase
      .from('push_subscribe')
      .select('*')
      .eq('user_role', 'admin');
      console.log("여기오냐ㅏ아아아");
      console.log('pushSubs = ', pushSubs);

    if (pushSubs && pushSubs.length > 0) {
      const payload = JSON.stringify({
        title: '예약 완료!',
        body: `예약번호: ${res_no}, ${date} ${time} 예약이 정상적으로 접수되었습니다.`,
        url: `https://mini-project06-ice-admin.vercel.app/reservation/${res_no}`,
      });

      for (const pushSub of pushSubs) {
        const subscription = {
          endpoint: pushSub.endpoint,
          keys: {
            p256dh: pushSub.p256dh,
            auth: pushSub.auth,
          },
        };
        webpush
          .sendNotification(subscription, payload)
          .then((response) => {
            console.log('푸시 전송 성공:', response.statusCode);
          })
          .catch((err) => {
            console.error('푸시 전송 실패:', err);
          });
      }
    }

    res.redirect(`/reservation/${res_no}`);
  } catch (err) {
    res.status(500).render('reservation', {
      title: '예약하기',
      user,
      error: err.message,
    });
  }
});

// 예약 취소
router.post('/cancel/:res_no', async function (req, res, next) {
  const res_no = req.params.res_no;
  const user = req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });

  try {
    const { data: reservation, error } = await req.supabase
      .from('reservation')
      .select('*')
      .eq('res_no', res_no)
      .eq('user_email', user.email)
      .single();
    if (error || !reservation) {
      return res.status(404).json({ success: false, error: '예약 정보를 찾을 수 없습니다.' });
    }
    if (reservation.state > 3) {
      return res.status(400).json({ success: false, error: '이 예약은 취소할 수 없습니다.' });
    }

    // 예약 상태 업데이트 state 6(예약취소)으로 변경
    const { error: updateError } = await req.supabase
      .from('reservation')
      .update({ state: 6 })
      .eq('res_no', res_no)
      .eq('user_email', user.email);
    if (updateError) {
      return res.status(500).json({ success: false, error: '예약 취소에 실패했습니다.' });
    }

    // 푸시 구독 정보 가져오기
    const { data: pushSubs, error: pushError } = await req.supabase
      .from('push_subscribe')
      .select('*')
      .eq('user_role', 'admin');

    if (pushSubs && pushSubs.length > 0) {
      const payload = JSON.stringify({
        title: '예약 취소 발생!',
        body: `예약번호: ${res_no}, ${user.email}님 예약 취소건이 접수되었습니다.`,
        url: `https://mini-project06-ice-admin.vercel.app/reservation`,
      });

      for (const pushSub of pushSubs) {
        const subscription = {
          endpoint: pushSub.endpoint,
          keys: {
            p256dh: pushSub.p256dh,
            auth: pushSub.auth,
          },
        };
        console.log('subscription = ', subscription);
        
        webpush
          .sendNotification(subscription, payload)
          .then((response) => {
            console.log('푸시 전송 성공:', response.statusCode);
          })
          .catch((err) => {
            console.error('푸시 전송 실패:', err);
          });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
