//example-bot.js


const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const fetch = require('node-fetch')
const Composer = require('telegraf/composer')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')


const { reply } = Telegraf


// read env
const dotenv = require('dotenv');
dotenv.config();
//////////////////////////////////////////
//////////////////////////////////////////

// const bot = new Telegraf(process.env.BOT_TOKEN)
const bot = new Telegraf("800472780:AAELQ6Lq7tre1Awmkt73UIiT0TwdmSfw6is")

bot.use(Telegraf.log())
/*const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('شروع بازی', 'http://game.raaz.co/hextris/?chatid='+ctx.from.id+'&name='+ctx.from.first_name+'&messageid='+ctx.message.message_id),
  Markup.callbackButton('Delete', 'delete')
])*/
// bot.start((ctx) => ctx.reply('سلام به بازی سرویس ویزنو خوش آمدید',Extra.markup(keyboard)))
bot.start((ctx) => ctx.reply('سلام به بازی سرویس ویزنو خوش آمدید',Extra.markup(Markup.inlineKeyboard([
  Markup.urlButton('شروع بازی', 'http://game.raaz.co/hextris/?chatid='+ctx.from.id+'&name='+ctx.from.first_name+'&messageid='+(ctx.message.message_id +1)),
  Markup.callbackButton('Delete', 'delete')
]))))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => console.log("ctx:",ctx))
bot.hears('hi1', (ctx) => console.log("ctx:",ctx.chat))
bot.hears('hi2', (ctx) => console.log("ctx:",ctx.message.message_id))


// const gameShortName = 'your-game';
// bot.hears('شروع بازی', ({ replyWithGame }) => replyWithGame(gameShortName, markup))
// bot.hears('شروع بازی', ctx => ctx.replyWithHTML ('http://game.raaz.co/hextris/?chatid=71536363&name=alimhv'))
// bot.hears('شروع بازی', ctx => ctx.replyWithHTML('http://game.raaz.co/hextris/?chatid=71536363&name=alimhv')
// bot.hears('شروع بازی', ctx => ctx.replyWithHTML('http://game.raaz.co/hextris/?chatid=71536363&name=alimhv')
// bot.hears('شروع بازی', ctx => ctx.reply('http://game.raaz.co/hextris/?chatid=71536363&name=alimhv',Markup.urlButton('Telegraf help', 'http://telegraf.js.org')))
// bot.hears('شروع بازی', Markup.inlineKeyboard([
//   Markup.gameButton('🎮 Play now!'),
//   Markup.urlButton('Telegraf help', 'http://telegraf.js.org')
// ]).extra())

const gameShortName = 'your-game'
const gameUrl = 'https://your-game.tld'

const markup = Extra.markup(
  Markup.inlineKeyboard([
    Markup.gameButton('🎮 Play now!'),
    Markup.urlButton('Telegraf help', 'http://telegraf.js.org')
  ])
)
bot.command('foo1', ({ replyWithGame }) => replyWithGame(gameShortName, markup))

bot.launch()
/////////////////////////////////////////
/////////////////////////////////////////


bot.command('onetime', ({ reply }) =>
  reply('One time keyboard', Markup
    .keyboard(['/simple', '/inline', '/pyramid'])
    .oneTime()
    .resize()
    .extra()
  )
)

/////////////////////////////////////////
/////////////////////////////////////////

/*
const randomPhoto = 'https://picsum.photos/200/300/?random'
const sayYoMiddleware = ({ reply }, next) => reply('yo').then(() => next())

const bot = new Telegraf(process.env.BOT_TOKEN)
// bot.start(({ replyWithGame }) => replyWithGame(gameShortName))

// // Register session middleware
bot.use(session())

// Register logger middleware
bot.use((ctx, next) => {
    const start = new Date()
    return next().then(() => {
        const ms = new Date() - start
        console.log('response time %sms', ms)
    })
})

// Login widget events
bot.on('connected_website', ({ reply }) => reply('Website connected'))

// Telegram passport events
bot.on('passport_data', ({ reply }) => reply('Telegram password connected'))

// Random location on some text messages
bot.on('text', ({ replyWithLocation }, next) => {
    if (Math.random() > 0.2) {
        return next()
    }
    return Promise.all([
        replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90),
        next()
    ])
})

// Text messages handling

bot.hears('Hey', sayYoMiddleware, (ctx) => {
    ctx.session.heyCounter = ctx.session.heyCounter || 0
    ctx.session.heyCounter++
    return ctx.replyWithMarkdown(`_Hey counter:_ ${ctx.session.heyCounter}`)
})


// Command handling
bot.command('answer', sayYoMiddleware, (ctx) => {
    console.log(ctx.message)
    return ctx.reply('*42*', Extra.markdown())
})

bot.command('cat', ({ replyWithPhoto }) => replyWithPhoto(randomPhoto))

// Streaming photo, in case Telegram doesn't accept direct URL
bot.command('cat2', ({ replyWithPhoto }) => replyWithPhoto({ url: randomPhoto }))

// Look ma, reply middleware factory
bot.command('foo', reply('http://coub.com/view/9cjmt'))

///////////////////////
// Wow! RegEx
bot.hears(/reverse (.+)/, ({ match, reply }) => reply(match[1].split('').reverse().join('')))

// Launch bot
bot.launch()
*/

////////////////////////////
////////////////////////////
/*const gameShortName = 'your-game'
const gameUrl = 'https://your-game.tld'

const markup = Extra.markup(
    Markup.inlineKeyboard([
        Markup.gameButton('🎮 Play now!'),
        Markup.urlButton('Telegraf help', 'http://telegraf.js.org')
    ])
)
bot.command('foo1', ({ replyWithGame }) => replyWithGame(gameShortName, markup))*/

////////////////////
////////////////////
/*async function omdbSearch (query = '') {
    const apiUrl = `http://www.omdbapi.com/?s=${query}&apikey=9699cca`
    const response = await fetch(apiUrl)
    const json = await response.json()
    const posters = (json.Search && json.Search) || []
    return posters.filter(({ Poster }) => Poster && Poster.startsWith('https://')) || []
}
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    const posters = await omdbSearch(inlineQuery.query)
    const results = posters.map((poster) => ({
        type: 'photo',
        id: poster.imdbID,
        caption: poster.Title,
        description: poster.Title,
        thumb_url: poster.Poster,
        photo_url: poster.Poster
    }))
    return answerInlineQuery(results)
})

bot.launch()*/
////////////////////////////////////////////
////////////////////////////////////////////

// all keyboards



/*const bot = new Telegraf(process.env.BOT_TOKEN)

//
bot.use(Telegraf.log())

bot.command('onetime', ({ reply }) =>
    reply('One time keyboard', Markup
        .keyboard(['/simple', '/inline', '/pyramid'])
        .oneTime()
        .resize()
        .extra()
    )
)

bot.command('custom', ({ reply }) => {
    return reply('Custom buttons keyboard', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
            ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
            ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
        ])
        .oneTime()
        .resize()
        .extra()
    )
})

bot.hears('🔍 Search', ctx => ctx.reply('Yay!'))
bot.hears('📢 Ads', ctx => ctx.reply('Free hugs. Call now!'))

bot.command('special', (ctx) => {
    return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
        return markup.resize()
            .keyboard([
                markup.contactRequestButton('Send contact'),
                markup.locationRequestButton('Send location')
            ])
    }))
})

bot.command('pyramid', (ctx) => {
    return ctx.reply('Keyboard wrap', Extra.markup(
        Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
            wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
        })
    ))
})

bot.command('simple', (ctx) => {
    return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
        Markup.keyboard(['Coke', 'Pepsi'])
    ))
})

bot.command('inline', (ctx) => {
    return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
        m.inlineKeyboard([
            m.callbackButton('Coke', 'Coke'),
            m.callbackButton('Pepsi', 'Pepsi')
        ])))
})

bot.command('random', (ctx) => {
    return ctx.reply('random example',
        Markup.inlineKeyboard([
            Markup.callbackButton('Coke', 'Coke'),
            Markup.callbackButton('Dr Pepper', 'Dr Pepper', Math.random() > 0.5),
            Markup.callbackButton('Pepsi', 'Pepsi')
        ]).extra()
    )
})

bot.command('caption', (ctx) => {
    return ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' },
        Extra.load({ caption: 'Caption' })
            .markdown()
            .markup((m) =>
                m.inlineKeyboard([
                    m.callbackButton('Plain', 'plain'),
                    m.callbackButton('Italic', 'italic')
                ])
            )
    )
})

bot.hears(/\/wrap (\d+)/, (ctx) => {
    return ctx.reply('Keyboard wrap', Extra.markup(
        Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
            columns: parseInt(ctx.match[1])
        })
    ))
})

bot.action('Dr Pepper', (ctx, next) => {
    return ctx.reply('👍').then(() => next())
})

bot.action('plain', async (ctx) => {
    await ctx.answerCbQuery()
    ctx.editMessageCaption('Caption', Markup.inlineKeyboard([
        Markup.callbackButton('Plain', 'plain'),
        Markup.callbackButton('Italic', 'italic')
    ]))
})

bot.action('italic', async (ctx) => {
    await ctx.answerCbQuery()
    ctx.editMessageCaption('_Caption_', Extra.markdown().markup(Markup.inlineKeyboard([
        Markup.callbackButton('Plain', 'plain'),
        Markup.callbackButton('* Italic *', 'italic')
    ])))
})

bot.action(/.+/, (ctx) => {
    return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
})

bot.launch()*/

//////////////////////////////////////////
//////////////////////////////////////////
/*

const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
    ctx.reply('Step 2. Via inline button')
    return ctx.wizard.next()
})
stepHandler.command('next', (ctx) => {
    ctx.reply('Step 2. Via command')
    return ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'))

const superWizard = new WizardScene('super-wizard',
    (ctx) => {
        ctx.reply('Step 1', Markup.inlineKeyboard([
            Markup.urlButton('❤️', 'http://telegraf.js.org'),
            Markup.callbackButton('➡️ Next', 'next')
        ]).extra())
        return ctx.wizard.next()
    },
    stepHandler,
    (ctx) => {
        ctx.reply('Step 3')
        return ctx.wizard.next()
    },
    (ctx) => {
        ctx.reply('Step 4')
        return ctx.wizard.next()
    },
    (ctx) => {
        ctx.reply('Done')
        return ctx.scene.leave()
    }
)

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([superWizard], { default: 'super-wizard' })
bot.use(session())
bot.use(stage.middleware())
bot.launch()*/
