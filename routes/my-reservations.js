const express = require('express');
const router = express.Router();


router.get('/', async function(req, res, next) {
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
