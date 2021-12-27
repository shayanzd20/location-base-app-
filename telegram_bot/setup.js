
require('dotenv')
const Telegraf = require('telegraf')
const fs = require('fs')

const bot = new Telegraf("800472780:AAELQ6Lq7tre1Awmkt73UIiT0TwdmSfw6is")

// TLS options
const tlsOptions = {
  key: fs.readFileSync('/etc/httpd/conf/ssl.key/server.key'),
  cert: fs.readFileSync('/etc/httpd/conf/ssl.crt/server.crt'),
  ca: [
    // This is necessary only if the client uses the self-signed certificate.
    fs.readFileSync('/etc/httpd/conf/ssl.crt/server.crt')
  ]
}

// Set telegram webhook
bot.telegram.setWebhook('https://velgardi-game.ir:8443', {
  source: '/etc/httpd/conf/ssl.crt/server.crt'
})

// Start https webhook
bot.startWebhook('/', tlsOptions, 8443)

// Http webhook, for nginx/heroku users.
// bot.startWebhook('/secret-path', null, 5000)