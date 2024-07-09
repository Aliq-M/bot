require('dotenv').config();
const { Bot, InlineKeyboard} = require('grammy'); 
const express = require('express');
const Knex = require('knex')(require('./knexfile').development);
const logger = require('./logger');

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);