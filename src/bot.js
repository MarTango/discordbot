/**
 * @param {import('discordjs').Client} client
 * @param {import('sqlite3').Database} db
 */
module.exports = function(client, db, chrono, eliza) {
  /**
   * @param {import('discordjs').Message} msg
   * @return {bool}
   */
  function isReminder(msg) {
    return (
      msg.content.indexOf(client.user.toString()) !== -1
    );
  }

  /**
   * @param {import('discordjs').Message} msg
   * @return {void}
   */
  function storeReminder(msg) {
    /** @type {Date} */
    const reminderDate = chrono.parseDate(
      msg.content,
      msg.createdAt,
      {futureDate: true}
    );

    if (!reminderDate) {
      msg.react('👎');
      return;
    }

    const channelId = msg.channel.id;
    const reminder = `${msg.author}, "${msg.content}"`;

    db.run(
      'INSERT INTO reminders (channelId, text, datetime) VALUES (?, ?, ?)',
      channelId,
      reminder,
      reminderDate.getTime()
    );

    msg.react('👍');
  };

  /**
   */
  function handleDm(msg) {
    return msg.channel.send(eliza.transform(msg.content));
  }

  return {isReminder, storeReminder, handleDm};
};
