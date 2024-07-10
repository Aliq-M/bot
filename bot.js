require('dotenv').config();
const { Bot, InlineKeyboard} = require('grammy'); 
const express = require('express');
const Knex = require('knex')(require('./knexfile').development);
const logger = require('./logger');
const knex = require('knex');

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const app = express();
app.use(express.json());

logger.info('started');


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