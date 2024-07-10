require('dotenv').config();
const { Bot, InlineKeyboard, session } = require('grammy');
const express = require('express');
const knex = require('knex')(require('./knexfile').development);
const logger = require('./logger');
const i18n = require('./i18n');

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => ({ language: 'en' }) }));

const app = express();
app.use(express.json());

logger.info('Bot started');


async function addUser(ctx) {
    const user = ctx.from;
    try{
        await knex('users').insert({
            is_bot: user.is_bot,
            first_name: user.first_name,
            last_name: user.last_name,
            telegram_id: user.id, 
            created_ad: new Date(),
            country: null
        });
        logger.info('New user added: %s', user.id);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            logger.info('User already exists: %s'), user.id;
        } else {
            logger.error('Error adding user: %s', error.message);
        }
    }
}

bot.command('start', async (ctx) => {
    await addUser(ctx);
    const lng = ctx.session.language || 'en';
    i18n.changeLanguage(lng);
    await ctx.reply(i18n.t('welcome'));
  });


  bot.command('set-country', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('Russia', 'RU').row()
      .text('Ukraine', 'UA').row()
      .text('Belarus', 'BY').row()
      .text('Kazakhstan', 'KZ').row()
      .text('Armenia', 'AM').row()
      .text('Azerbaijan', 'AZ').row()
      .text('Georgia', 'GE').row()
      .text('Moldova', 'MD').row()
      .text('Turkmenistan', 'TM').row()
      .text('Uzbekistan', 'UZ').row()
      .text('Kyrgyzstan', 'KG').row()
      .text('Tajikistan', 'TK').row()
      .text('Turkey', 'TR');
  
    const lng = ctx.session.language || 'en';
    i18n.changeLanguage(lng);
    await ctx.reply(i18n.t('select_country'), { reply_markup: keyboard });
  });  


  