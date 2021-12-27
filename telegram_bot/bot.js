const Telegraf = require('telegraf')
const express = require('express')
// read env
const dotenv = require('dotenv');
dotenv.config();
const expressApp = express()

const bot = new Telegraf("800472780:AAELQ6Lq7tre1Awmkt73UIiT0TwdmSfw6is")
// const bot = new Telegraf(process.env.BOT_TOKEN)
expressApp.use(bot.webhookCallback('/'))
bot.telegram.setWebhook('https://velgardi-game.ir:8443')

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(8443, () => {
  console.log('Example app listening on port 8443!')
})