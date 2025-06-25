const express = require('express');
const router = express.Router();


router.get('/', async function(req, res, next) {
  const user = req.session?.user;
  if (!user) return res.redirect('/');
  const state = req.query.state;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    let query = req.supabase
      .from('reservation')
      .select('*', { count: 'exact' })
      .eq('user_email', user.email)
      .order('date', { ascending: false })
      .range(from, to);
    if (state && state !== 'all') {
      query = query.eq('state', parseInt(state));
    }
    const { data: reservations, error, count } = await query;
    if (error) throw error;
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    res.render('my_reservations', {
      title: '예약 내역',
      reservations,
      total,
      totalPages,
      page,
      state: state || 'all',
    });
  } catch (err) {
    res.status(500).render('my_reservations', { title: '예약 내역', reservations: [], error: err.message, total: 0, totalPages: 1, page: 1, state: 'all' });
  }
});

module.exports = router;
