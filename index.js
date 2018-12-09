const discordjs = require('discord.js');
const client = new discordjs.Client();
const chrono = require('chrono-node');
const sqlite3 = require('sqlite3');
const eliza = new (require('elizanode'))();
const bot = require('./src/bot');

require('dotenv').load();
const TOKEN = process.env.DISCORD_TOKEN;

/** @type sqlite3.Database */
const db = new sqlite3.Database('./database.sqlite');

db.run(`CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelId TEXT,
  text TEXT,
  datetime INTEGER,
  reminded INTEGER DEFAULT 0
)`);

const {isReminder, storeReminder, handleDm} = bot(
  client,
  db,
  chrono,
  eliza
);

/**
 * @param {discordjs.Message} msg
 */
function handleMessage(msg) {
  if (msg.author.bot) {
    return;
  }
  if (isReminder(msg, client)) {
    storeReminder(msg, db, chrono);
  }

  if (msg.channel.type === 'dm') {
    handleDm(msg);
  }
}

/**
 * Send out reminders that are due.
 */
function sendOutReminders() {
  const query = `
SELECT id, channelId, text FROM reminders
WHERE datetime < ${(new Date()).getTime()} AND reminded = 0
`;
  db.all(query, (err, reminders) => {
    reminders.forEach(function(reminder) {
      console.log(reminder);
      client.channels.get(reminder.channelId).send(reminder.text);
      db.run('UPDATE reminders SET reminded = 1 WHERE id = ?', reminder.id);
    });
  });
}

client.on('message', handleMessage);
client.on('ready', () => console.log('Ready!'));

client.login(TOKEN);

setInterval(sendOutReminders, 10000);
