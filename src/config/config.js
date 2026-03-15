require('dotenv').config();

module.exports = {
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || 'test_token',
    from: process.env.WHATSAPP_PHONE_ID || 'test_phone_id',
  }
};
