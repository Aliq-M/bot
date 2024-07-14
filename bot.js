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
  try {
    await knex('users').insert({
      is_bot: user.is_bot,
      first_name: user.first_name,
      last_name: user.last_name,
      telegram_id: user.id,
      created_at: new Date(),
      country: null
    });
    logger.info('New user added: %s', user.id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      logger.info('User already exists: %s', user.id);
    } else {
      logger.error('Error adding user: %s', error.message);
    }
  }
}

bot.command('start', async (ctx) => {
  logger.info('Received /start command from user: %s', ctx.from.id);
  await addUser(ctx);
  const lng = ctx.session.language || 'en';
  i18n.changeLanguage(lng);
  logger.info('Language set to: %s for user: %s', lng, ctx.from.id);
  await ctx.reply(i18n.t('welcome')).catch(err => {
    logger.error('Error replying to /start command: %s', err.message);
  });

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
    .text('Tajikistan', 'TJ').row()
    .text('Turkey', 'TR').row();

  await ctx.reply(i18n.t('select_country'), { reply_markup: keyboard }).catch(err => {
    logger.error('Error replying with country selection keyboard: %s', err.message);
  });
});

bot.callbackQuery(/.+/, async (ctx) => {
  const country = ctx.callbackQuery.data;
  logger.info('Received callback query with country: %s from user: %s', country, ctx.from.id);
  await knex('users')
    .where('telegram_id', ctx.from.id)
    .update({ country });

  const languageMap = {
    'RU': 'ru',
    'UA': 'uk',
    'BY': 'by',
    'KZ': 'kz',
    'AM': 'am',
    'AZ': 'az',
    'GE': 'ge',
    'MD': 'md',
    'TM': 'tm',
    'UZ': 'uz',
    'KG': 'kg',
    'TJ': 'tj',
    'TR': 'tr'
  };
  ctx.session.language = languageMap[country] || 'en';

  const lng = ctx.session.language;
  i18n.changeLanguage(lng);
  await ctx.answerCallbackQuery(i18n.t('selected_country', { country })).catch(err => {
    logger.error('Error answering callback query: %s', err.message);
  });
  logger.info('User %s selected country %s and language %s', ctx.from.id, country, lng);
});

bot.command('about-me', async (ctx) => {
  logger.info('Received /about-me command from user: %s', ctx.from.id);
  const user = await knex('users').where('telegram_id', ctx.from.id).first();
  const lng = ctx.session.language || 'en';
  i18n.changeLanguage(lng);

  if (user) {
    await ctx.reply(i18n.t('user_info', {
      first_name: user.first_name,
      last_name: user.last_name,
      telegram_id: user.telegram_id,
      created_at: user.created_at,
      country: user.country
    })).catch(err => {
      logger.error('Error replying to /about-me command: %s', err.message);
    });
  } else {
    await ctx.reply(i18n.t('user_not_found')).catch(err => {
      logger.error('Error replying to /about-me command: %s', err.message);
    });
    logger.info('User not found for /about-me command: %s', ctx.from.id);
  }
});

bot.start();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
