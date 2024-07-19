require('dotenv').config();
const { Bot, InlineKeyboard, session } = require('grammy');
const express = require('express');
const knex = require('knex')(require('./knexfile').development);
const logger = require('./logger');
const i18n = require('./i18n');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns'); // Добавляем библиотеку date-fns для форматирования даты

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => ({ language: 'en' }) }));

const app = express();
app.use(express.json());

logger.info('Bot started');

// Проверка наличия файлов локализации
const languages = ['en', 'uk', 'az', 'ru', 'by', 'kz', 'am', 'ge', 'md', 'tm', 'uz', 'kg', 'tj', 'tr'];
languages.forEach((lang) => {
  const filePath = path.join(__dirname, 'locales', `${lang}.json`);
  if (fs.existsSync(filePath)) {
    logger.info(`Localization file for ${lang} found: ${filePath}`);
  } else {
    logger.error(`Localization file for ${lang} not found: ${filePath}`);
  }
});

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
  const data = ctx.callbackQuery.data;

  if (data === 'about_me') {
    logger.info('Received /about-me callback query from user: %s', ctx.from.id);
    const user = await knex('users').where('telegram_id', ctx.from.id).first();
    const lng = ctx.session.language || 'en';
    i18n.changeLanguage(lng);

    if (user) {
      const formattedDate = format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss'); // Форматирование даты
      await ctx.reply(i18n.t('user_info', {
        first_name: user.first_name,
        last_name: user.last_name,
        telegram_id: user.telegram_id,
        created_at: formattedDate,
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
    return;
  }

  const country = data;
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

  logger.info('Sending confirmation message to user: %s for country: %s', ctx.from.id, country);

  try {
    await ctx.reply(i18n.t('selected_country', { country }));
    logger.info('Confirmation message sent to user: %s for country: %s', ctx.from.id, country);
  } catch (err) {
    logger.error('Error sending confirmation message: %s', err.message);
  }

  const keyboard = new InlineKeyboard().text('/about-me', 'about_me');
  await ctx.reply(i18n.t('about_me'), { reply_markup: keyboard }).catch(err => {
    logger.error('Error replying with about_me keyboard: %s', err.message);
  });

  await ctx.answerCallbackQuery().catch(err => {
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
    const formattedDate = format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss'); // Форматирование даты
    await ctx.reply(i18n.t('user_info', {
      first_name: user.first_name,
      last_name: user.last_name,
      telegram_id: user.telegram_id,
      created_at: formattedDate,
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
