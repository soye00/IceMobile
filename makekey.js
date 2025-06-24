const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);

// {
//     publicKey: 'BBAM2GOE13h59ZDNqToC23HdNafs2eypet_bh6sRh0wvxIbZknpiVijBqrSealSwYBkBLyTE_DTQmzmp8yTDCZE',
//     privateKey: 'MPrJJYxypgckCHa45ylTc_2z71QUfpy58NOMWf2E2OQ'
//   }