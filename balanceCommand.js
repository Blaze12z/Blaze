const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: '!xemsodu',
  execute(message, balances) {
    const bal = balances.get(message.author.id) || 0;
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle(`💰 Số dư của ${message.author.username}`)
      .setDescription(`Bạn hiện có **${bal}** coin.`);

    return message.channel.send({ embeds: [embed] });
  },
};