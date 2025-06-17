const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('signup', { title: '회원가입' });
});

router.post('/', async function(req, res, next) {
  const { name, phone, email, password, postcode, address, address_detail, company_no} = req.body;

  const supabase = req.supabase;
  console.log(req.body);

  const addr = [postcode, address, address_detail].filter(Boolean).join(', ');


  const { data, error } = await supabase.from('customer').insert({
    name,
    phone,
    email,
    password,
    addr,
    company_no,
  });
  
});

module.exports = router;