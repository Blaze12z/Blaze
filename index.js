// ==================== Discord Kidnap Bot - Full Enhanced Version ====================
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Collection,
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ====== Data ======
const cooldowns = new Collection();
const kidnapped = new Collection(); // key: slaveId, value: ownerId
const owners = new Collection(); // key: ownerId, value: [slaves]
const shields = new Collection(); // key: userId, value: boolean
const balances = new Collection();

const getCooldownRemaining = (userId, command, timeMs) => {
  const lastUsed = cooldowns.get(`${userId}-${command}`);
  return lastUsed ? timeMs - (Date.now() - lastUsed) : 0;
};

// ====== Message Handler ======
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= HELP =================
  if (command === '!khelp') {
    const embed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('📖 Hướng dẫn chơi Bot Kidnap')
      .setDescription('Danh sách lệnh và chức năng trong bot:')
      .addFields(
        { name: '🎭 Roleplay', value: '`!batcoc`, `!giaicuu`, `!tratan`, `!thuongthuong`, `!chaytron`, `!traodoinole`, `!namtay`, `!om`' },
        { name: '💰 Kinh tế & Vật phẩm', value: '`!balance`, `!daily`, `!work`, `!buyshield`' },
        { name: '📊 Danh sách & Bảng xếp hạng', value: '`!danhsachnoled`, `!topnoled`, `!topmoney`' },
        { name: 'ℹ️ Lưu ý', value: '🔹 Khiên mất khi bị bắt thành công\n🔹 Cooldown: daily 24h, work 1h\n🔹 Nô lệ không thể bắt chủ của mình' }
      )
      .setThumbnail('https://media.tenor.com/GZG3zkRGbUAAAAAC/cute-help.gif')
      .setFooter({ text: 'Bot Kidnap – Chơi vui vẻ và tôn trọng mọi người ❤️' });
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !batcoc =================
  if (command === '!batcoc') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('🚫 Tag người để bắt cóc.');
    if (target.id === message.author.id) return message.reply('❌ Không thể bắt cóc chính mình.');
    if (target.bot) return message.reply('🤖 Không thể bắt bot.');

    if (kidnapped.get(message.author.id) === target.id) {
      return message.reply('⛔ Bạn đang là nô lệ của người này.');
    }

    if (shields.get(target.id)) {
      shields.delete(target.id);
      const shieldEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🛡️ Khiên bảo vệ!')
        .setDescription(`${target.username} dùng khiên né thành công bắt cóc.`)
        .setImage('https://media.tenor.com/U3G3Yeh5s10AAAAC/shield-anime.gif');
      return message.channel.send({ embeds: [shieldEmbed] });
    }

    // ======= TRA TẤN NÔ LỆ =======
if (command === '!tratan') {
  const slave = message.mentions.users.first();
  if (!slave) return message.reply('🚫 Bạn cần tag một nô lệ để tra tấn.');
  if (kidnapped.get(slave.id) !== message.author.id) 
    return message.reply('❌ Người này không phải nô lệ của bạn.');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('tratan_menu')
    .setPlaceholder('Chọn hình thức tra tấn')
    .addOptions([
      { label: '🔨 Đánh roi', value: 'roi' },
      { label: '🔥 Thiêu đốt', value: 'lua' },
      { label: '⚡ Giật điện', value: 'dien' },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  const embed = new EmbedBuilder()
    .setColor('DarkRed')
    .setTitle('⚔️ Tra tấn nô lệ')
    .setDescription(`Chọn cách tra tấn ${slave.username}:`);

  await message.channel.send({ embeds: [embed], components: [row] });
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'tratan_menu') return;
  const option = interaction.values[0];
  const gifs = {
    roi: 'https://media.tenor.com/ErkXXVt8h2IAAAAC/whip-anime.gif',
    lua: 'https://media.tenor.com/vmMNNk-NW1MAAAAC/fire-anime.gif',
    dien: 'https://media.tenor.com/t3kjKAc4HYUAAAAC/electric-shock.gif',
  };
  const text = {
    roi: 'đánh roi tới tấp',
    lua: 'thiêu đốt đau đớn',
    dien: 'giật điện tê tái',
  };
  await interaction.reply({ embeds: [
    new EmbedBuilder().setColor('Red')
    .setTitle('💥 Tra tấn bắt đầu!')
    .setDescription(`😈 ${interaction.user} đã ${text[option]} nô lệ của mình!`)
    .setImage(gifs[option])
  ]});
});


    const success = Math.random() < 0.5;
    if (!success) {
      const failEmbed = new EmbedBuilder()
        .setColor('Grey')
        .setTitle('❌ Thất bại!')
        .setDescription(`${message.author.username} bắt ${target.username} nhưng thất bại.`)
        .setImage('https://media.tenor.com/n0piz5zqXyoAAAAC/anime-fail.gif');
      return message.channel.send({ embeds: [failEmbed] });
    }

    kidnapped.set(target.id, message.author.id);
    if (!owners.has(message.author.id)) owners.set(message.author.id, []);
    owners.get(message.author.id).push(target.id);

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🎭 Bắt cóc thành công!')
      .setDescription(`${message.author.username} đã bắt cóc ${target.username} làm nô lệ.`)
      .setImage('https://media.tenor.com/MZgFeop_HKwAAAAC/kidnap-anime.gif');
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !giaicuu =================
  if (command === '!giaicuu') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('🚫 Tag người để giải cứu.');
    const ownerId = kidnapped.get(target.id);
    if (!ownerId) return message.reply('ℹ️ Người này không phải nô lệ.');

    if (target.id === message.author.id) return message.reply('❌ Không thể tự giải cứu.');

    const success = Math.random() < 0.4;
    if (success) {
      kidnapped.delete(target.id);
      let slaves = owners.get(ownerId) || [];
      slaves = slaves.filter(id => id !== target.id);
      owners.set(ownerId, slaves);

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🛡️ Giải cứu thành công!')
        .setDescription(`${message.author.username} đã giải cứu ${target.username}.`)
        .setImage('https://media.tenor.com/v3S16m3DpQoAAAAC/rescue-anime.gif');
      return message.channel.send({ embeds: [embed] });
    }

    const fail = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Giải cứu thất bại')
      .setDescription(`${message.author.username} giải cứu ${target.username} thất bại.`)
      .setImage('https://media.tenor.com/bW6snsyYYC4AAAAC/failed-save.gif');
    return message.channel.send({ embeds: [fail] });
  }

  // ================= !danhsachnoled =================
  if (command === '!danhsachnoled') {
    const slaves = owners.get(message.author.id) || [];
    if (slaves.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('Grey')
        .setTitle('📜 Danh sách nô lệ')
        .setDescription('Bạn chưa có nô lệ.')
        .setThumbnail('https://media.tenor.com/T3vB3CGyKnIAAAAC/anime-no.gif');
      return message.channel.send({ embeds: [embed] });
    }
    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setTitle(`📜 Nô lệ của ${message.author.username}`)
      .setDescription(slaves.map(id => `<@${id}>`).join('\n'))
      .setFooter({ text: `Tổng: ${slaves.length} nô lệ` });
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !topnoled =================
  if (command === '!topnoled') {
    if (owners.size === 0) {
      return message.reply('🚫 Chưa có chủ nào.');
    }
    const leaderboard = [...owners.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('🏆 Top Chủ Nhân')
      .setDescription(leaderboard.map(([ownerId, slaves], i) => `**${i + 1}.** <@${ownerId}> – ${slaves.length} nô lệ`).join('\n'))
      .setThumbnail('https://media.tenor.com/Uxk-8P-8h8AAAAAC/crown.gif');
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !balance =================
  if (command === '!balance' || command === '!bal') {
    const money = balances.get(message.author.id) || 0;
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('💰 Số tiền')
      .setDescription(`${message.author.username} có **${money}💰**`);
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !daily =================
  if (command === '!daily') {
    const cooldown = getCooldownRemaining(message.author.id, 'daily', 24 * 60 * 60 * 1000);
    if (cooldown > 0) return message.reply(`⏳ Chờ ${Math.ceil(cooldown / (1000 * 60 * 60))}h để nhận lại.`);

    cooldowns.set(`${message.author.id}-daily`, Date.now());
    const reward = 100;
    balances.set(message.author.id, (balances.get(message.author.id) || 0) + reward);
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🎁 Daily Reward')
      .setDescription(`Bạn nhận được **${reward}💰**`);
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !work =================
  function getCooldownRemaining(userId, commandName, cooldown) {
  const key = `${userId}-${commandName}`;
  const lastUsed = cooldowns.get(key);
  if (!lastUsed) return 0;
  const diff = Date.now() - lastUsed;
  return Math.max(0, cooldown - diff);
}
  if (command === '!work') {
    const cooldown = getCooldownRemaining(message.author.id, 'work', 60 * 60 * 1000);
    if (cooldown > 0) return message.reply(`⏳ Chờ ${Math.ceil(cooldown / (1000 * 60))} phút nữa.`);

    cooldowns.set(`${message.author.id}-work`, Date.now());
    const jobs = [
      { job: '🛠️ Thợ rèn', pay: 50 },
      { job: '🍳 Đầu bếp', pay: 70 },
      { job: '🚗 Tài xế', pay: 60 },
      { job: '📝 Nhà văn', pay: 80 },
      { job: '💻 Lập trình viên', pay: 100 },
    ];
    const work = jobs[Math.floor(Math.random() * jobs.length)];
    balances.set(message.author.id, (balances.get(message.author.id) || 0) + work.pay);
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('💼 Làm việc')
      .setDescription(`${message.author.username} làm ${work.job} và nhận ${work.pay}💰`);
    return message.channel.send({ embeds: [embed] });
  }

  // ================= !buyshield =================
  if (command === '!buyshield') {
    const price = 200;
    const money = balances.get(message.author.id) || 0;
    if (money < price) return message.reply('🚫 Không đủ tiền mua khiên.');
    balances.set(message.author.id, money - price);
    shields.set(message.author.id, true);
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🛡️ Khiên bảo vệ')
      .setDescription('Bạn đã mua khiên, chống lại 1 lần bắt cóc.');
    return message.channel.send({ embeds: [embed] });
  }
});

// ================= READY =================
client.once('ready', () => {
  console.log(`✅ Bot đã đăng nhập với tên ${client.user.tag}`);
});

client.login('Token');