const discordjs = require('discord.js');
const client = new discordjs.Client();
const chrono = require('chrono-node');
const sqlite3 = require('sqlite3');

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

/**
 * @param {discordjs.Message} msg
 */
function handleMessage(msg) {
  if (msg.author.bot) {
    return;
  }
  const content = msg.content;
  if (content.indexOf(client.user.toString()) === -1) {
    return;
  }

  /** @type {Date} */
  const reminderDate = chrono.parseDate(
    content,
    msg.createdAt,
    {futureDate: true}
  );

  if (!reminderDate) {
    msg.react('👎');
    return;
  }

  const channelId = msg.channel.id;
  const reminder = `${msg.author}, "${content}"`;

  db.run(
    'INSERT INTO reminders (channelId, text, datetime) VALUES (?, ?, ?)',
    channelId,
    reminder,
    reminderDate.getTime()
  );

  msg.react('👍');
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
      client.channels.get(reminder.channelId).send(reminder.text);
      db.run('UPDATE reminders SET reminded = 1 WHERE id = ?', reminder.id);
    });
  });
}

client.on('message', handleMessage);
client.on('ready', () => console.log('Ready!'));

client.login(TOKEN);

setInterval(sendOutReminders, 10000);
