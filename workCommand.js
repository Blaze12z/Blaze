const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: '!work',
  execute(message, balances, cooldowns) {
    const cooldownKey = `${message.author.id}-work`;
    const cooldownTime = 120_000; // 2 phút
    const lastUsed = cooldowns.get(cooldownKey);

    if (lastUsed && Date.now() - lastUsed < cooldownTime) {
      const remaining = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000);
      return message.reply(`⏳ Bạn cần chờ **${remaining}s** để làm việc tiếp.`);
    }

    const jobs = [
      { name: '🚕 Tài xế Taxi', reward: 50, msg: 'Bạn chở khách và nhận được tiền boa!' },
      { name: '🍜 Phục vụ Quán ăn', reward: 40, msg: 'Bạn phục vụ bàn và nhận được lương.' },
      { name: '💻 Lập trình viên', reward: 80, msg: 'Bạn hoàn thành dự án web cho khách hàng.' },
      { name: '🔨 Thợ xây', reward: 60, msg: 'Bạn làm việc nặng nhọc và nhận được tiền công.' },
      { name: '🎤 Ca sĩ đường phố', reward: 30, msg: 'Bạn hát trên phố và được khán giả thưởng.' },
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const currentBalance = balances.get(message.author.id) || 0;
    balances.set(message.author.id, currentBalance + job.reward);
    cooldowns.set(cooldownKey, Date.now());

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(`${job.name} - Hoàn thành công việc!`)
      .setDescription(`💼 ${job.msg}\n💰 Bạn kiếm được **${job.reward}** coin.`)
      .setFooter({ text: `Số dư hiện tại: ${balances.get(message.author.id)} 💰` });

    return message.channel.send({ embeds: [embed] });
  },
};