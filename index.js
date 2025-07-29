// ==================== Discord Kidnap Bot - Final Version ====================
require('dotenv').config();
const workCommand = require('./workCommand');
const balanceCommand = require('./balanceCommand.js');
const taixiuGame = require('./taixiuGame');
const blockedUsers = ['1141999542770868244']; // Danh sách ID bị chặn
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Collection,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const cooldowns = new Collection();
const kidnapped = new Collection();
const owners = new Collection();
const shields = new Collection();
const balances = new Collection();

const getCooldownRemaining = (userId, command, timeMs) => {
  const lastUsed = cooldowns.get(`${userId}-${command}`);
  return lastUsed ? timeMs - (Date.now() - lastUsed) : 0;
};

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
    // ====== TÀI XỈU ======
  taixiuGame.handleCommands(message, balances);

  // ====== KIẾM TIỀN ======
  if (command === '!work') return workCommand.execute(message, balances, cooldowns);

 
  // ====== XEM SỐ DƯ ======
  if (command === '!xemsodu') return balanceCommand.execute(message, balances);

  // ====== DAILY ======
  if (command === '!daily') {
    const cooldown = getCooldownRemaining(message.author.id, 'daily', 24 * 60 * 60 * 1000);
    if (cooldown > 0) {
      const hours = Math.floor(cooldown / 3600000);
      const minutes = Math.floor((cooldown % 3600000) / 60000);
      return message.reply(`⏳ Bạn đã nhận rồi! Thử lại sau **${hours}h ${minutes}m**.`);
    }
    const reward = 100;
    balances.set(message.author.id, (balances.get(message.author.id) || 0) + reward);
    cooldowns.set(`${message.author.id}-daily`, Date.now());

    const embed = new EmbedBuilder()
      .setColor('#00FF7F')
      .setTitle('🎁 Phần Thưởng Hằng Ngày')
      .setDescription(`Chúc mừng **${message.author.username}**!\nBạn nhận được **${reward}💰**.`)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2331/2331943.png')
      .setFooter({ text: 'Hãy quay lại mỗi ngày để nhận thưởng!' })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // ====== BẮT CÓC ======
  if (command === '!batcoc') {
    const target = message.mentions.users.first();
    if (!target || target.bot) return message.reply('❌ Tag một người để bắt cóc.');
    if (target.id === message.author.id) return message.reply('🚫 Không thể bắt cóc chính mình.');

    const ownerOfAttacker = kidnapped.get(message.author.id);
    if (ownerOfAttacker && ownerOfAttacker === target.id)
      return message.reply('🚫 Nô lệ không thể bắt lại chủ.');

    const cooldown = getCooldownRemaining(message.author.id, 'batcoc', 90_000);
    if (cooldown > 0)
      return message.reply(`⏳ Chờ ${Math.ceil(cooldown / 1000)}s để bắt tiếp.`);

    if (kidnapped.has(target.id))
      return message.reply('🚫 Người này đã bị bắt.');

    if (shields.get(target.id)) {
      shields.delete(target.id);
      return message.reply('🛡️ Khiên bảo vệ – bắt cóc thất bại.');
    }

    const success = Math.random() < 0.25;
    cooldowns.set(`${message.author.id}-batcoc`, Date.now());

    if (success) {
      kidnapped.set(target.id, message.author.id);
      const slaves = owners.get(message.author.id) || [];
      slaves.push({ id: target.id, time: new Date() });
      owners.set(message.author.id, slaves);
      balances.set(message.author.id, (balances.get(message.author.id) || 0) + 50);
      return message.channel.send(`🔐 ${message.author.username} bắt cóc thành công ${target.username} (+50💰)!`);
    } else {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Bắt Cóc Thất Bại')
        .setDescription(`**${message.author.username}** bắt cóc **${target.username}** nhưng thất bại!`)
        .setImage('https://media.giphy.com/media/ispEc1253326c/giphy.gif')
        .setFooter({ text: 'Cẩn thận hơn lần sau!' });
      return message.channel.send({ embeds: [embed] });
    }
  }

  // ====== GIẢI CỨU ======
  if (command === '!giaicuu') {
    const target = message.mentions.users.first();
    if (!target || target.id === message.author.id)
      return message.reply('❌ Hành động không hợp lệ.');
    if (!kidnapped.has(target.id))
      return message.reply('❌ Người này không bị bắt.');

    const cooldown = getCooldownRemaining(message.author.id, 'giaicuu', 300_000);
    if (cooldown > 0)
      return message.reply(`⏳ Chờ ${Math.ceil(cooldown / 1000)}s để giải cứu tiếp.`);

    const success = Math.random() < 0.1;
    cooldowns.set(`${message.author.id}-giaicuu`, Date.now());
    if (success) {
      const ownerId = kidnapped.get(target.id);
      kidnapped.delete(target.id);
      const list = owners.get(ownerId) || [];
      owners.set(ownerId, list.filter(x => x.id !== target.id));
      balances.set(message.author.id, (balances.get(message.author.id) || 0) + 30);
      return message.channel.send(`🕊️ ${message.author.username} giải cứu thành công ${target.username} (+30💰)!`);
    } else {
      return message.channel.send(`❌ Giải cứu thất bại.`);
    }
  }

  // ====== CHẠY TRỐN ======
  if (command === '!chaytron') {
    const cooldown = getCooldownRemaining(message.author.id, 'chaytron', 600_000);
    if (cooldown > 0)
      return message.reply(`⏳ Chờ ${Math.ceil(cooldown / 1000)}s để thử lại.`);
    if (!kidnapped.has(message.author.id))
      return message.reply('✅ Bạn không bị bắt.');

    if (shields.get(message.author.id)) {
      shields.delete(message.author.id);
      const ownerId = kidnapped.get(message.author.id);
      kidnapped.delete(message.author.id);
      const list = owners.get(ownerId) || [];
      owners.set(ownerId, list.filter(x => x.id !== message.author.id));
      return message.channel.send(`🛡️ ${message.author.username} dùng khiên trốn thoát!`);
    }

    const success = Math.random() < 0.1;
    cooldowns.set(`${message.author.id}-chaytron`, Date.now());
    if (success) {
      const ownerId = kidnapped.get(message.author.id);
      kidnapped.delete(message.author.id);
      const list = owners.get(ownerId) || [];
      owners.set(ownerId, list.filter(x => x.id !== message.author.id));
      return message.channel.send(`🚪 ${message.author.username} trốn thoát thành công!`);
    } else {
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('🚫 Trốn Thất Bại')
        .setDescription(`**${message.author.username}** cố chạy trốn nhưng bị bắt lại!`)
        .setImage('https://media.giphy.com/media/beFz7ODP7OD8Q/giphy.gif')
        .setFooter({ text: 'Thử lại sau 10 phút...' });
      return message.channel.send({ embeds: [embed] });
    }
  }

  // ====== TRA TẤN ======
  if (command === '!tratan') {
    const target = message.mentions.users.first();
    if (!target || kidnapped.get(target.id) !== message.author.id)
      return message.reply('🚫 Người này không phải nô lệ của bạn.');

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`chontratan-${message.author.id}-${target.id}`)
        .setPlaceholder('Chọn hình thức tra tấn')
        .addOptions([
          { label: '⚡ Chích điện', value: 'dien' },
          { label: '🔥 Đốt lửa', value: 'lua' },
          { label: '💧 Dội nước đá', value: 'nuoc' },
          { label: '🔩 Roi sắt', value: 'roi' },
          { label: '🔫 Tử hình', value: 'tuhinh' },
        ])
    );
    return message.reply({ content: `🔪 Chọn cách tra tấn ${target.username}:`, components: [row] });
  }

  // ====== TÌNH CẢM ======
  if (command === '!thuongthuong') {
    const target = message.mentions.users.first();
    if (!target || kidnapped.get(target.id) !== message.author.id)
      return message.reply('🚫 Người này không phải nô lệ của bạn.');

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('chonthuongthuong')
        .setPlaceholder('Chọn hành động tình cảm')
        .addOptions([
          { label: '🤝 Nắm tay', value: 'namtay' },
          { label: '😘 Hôn má', value: 'honma' },
          { label: '😚 Hôn trán', value: 'hontran' },
          { label: '💋 Hôn môi', value: 'honmoi' },
        ])
    );
    return message.reply({ content: `💞 Hành động với ${target.username}:`, components: [row] });
  }

  // ====== ÔM ======
if (command === '!om') {
    const blockedUsers = ['1141999542770868244'];
  if (blockedUsers.includes(message.author.id)) {
    return message.reply('🚫 Thằng này đéo có quyền dùng lệnh.');
  }

  const target = message.mentions.users.first();
  if (!target) return message.reply('❌ Tag một người để ôm.');
  if (target.id === message.author.id) return message.reply('🤗 Bạn không thể tự ôm chính mình.');

  // 🖼️ Danh sách nhiều GIF
  const gifLinks = [
    'https://media.tenor.com/m/qZ5UWbLAEBAAAAAC/val-ally-anime.gif',
    'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGs4MmRiaTNlcG96YmY2enZsbjlwaDFpNGh0M3cxOHQzNzdpdGFudSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GMFUrC8E8aWoo/giphy.gif',
  ];

  // 👉 Chọn ngẫu nhiên 1 GIF
  const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];

  const embed = new EmbedBuilder()
    .setColor('#FFC0CB')
    .setTitle('🤗 Ôm Ấm Áp')
    .setDescription(`**${message.author.username}** đã ôm **${target.username}** thật chặt ❤️`)
    .setImage(randomGif) // ✅ Dùng GIF ngẫu nhiên
    .setFooter({ text: 'Một cái ôm làm tan biến mọi muộn phiền!' })
    .setTimestamp();

  return message.channel.send({ embeds: [embed] });
}

  // ====== HÔN ======
  if (command === '!hon') {
      const blockedUsers = ['1141999542770868244'];
  if (blockedUsers.includes(message.author.id)) {
    return message.reply('🚫 Bạn không được dùng lệnh này.');
  }
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Tag một người để hôn.');
    if (target.id === message.author.id) return message.reply('😘 Bạn không thể tự hôn chính mình.');

    const gifLinks = [
      'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
      'https://media.giphy.com/media/KH1CTZtw1iP3W/giphy.gif',
      'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif'
    ];
    const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('💋 Nụ Hôn Ngọt Ngào')
      .setDescription(`**${message.author.username}** đã trao nụ hôn nồng cháy cho **${target.username}** 😘💞`)
      .setImage(randomGif)
      .setFooter({ text: 'Tình yêu thật đẹp!' })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // ====== DANH SÁCH NÔ LỆ ======
  if (command === '!danhsachnoled') {
    const list = owners.get(message.author.id);
    if (!list || list.length === 0) return message.reply('😢 Bạn chưa có nô lệ nào.');

    const embed = new EmbedBuilder()
      .setTitle(`📜 Danh Sách Nô Lệ của ${message.author.username}`)
      .setColor('Purple')
      .setDescription(list.map(x => `<@${x.id}> - ${x.time.toLocaleString('vi-VN')}`).join('\n'));

    return message.channel.send({ embeds: [embed] });
  }

  // ====== MUA KHIÊN ======
  if (command === '!buyshield') {
    const target = message.mentions.users.first() || message.author;
    const isForSelf = target.id === message.author.id;
    const cost = 100;
    const bal = balances.get(message.author.id) || 0;
    if (bal < cost) return message.reply(`💰 Cần ${cost}, bạn có ${bal}.`);

    if (isForSelf || kidnapped.get(target.id) === message.author.id) {
      shields.set(target.id, true);
      balances.set(message.author.id, bal - cost);
      return message.reply(`🛡️ Mua khiên thành công cho ${isForSelf ? 'bản thân' : target.username}.`);
    } else {
      return message.reply('🚫 Chỉ mua cho bản thân hoặc nô lệ của bạn.');
    }
  }

  // ====== TOP CHỦ NÔ ======
  if (command === '!topnoled') {
    const sorted = [...owners.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 Chủ Nô')
      .setColor('Gold')
      .setDescription(
        sorted.map(([id, list], i) => `#${i + 1} <@${id}> - ${list.length} nô lệ`).join('\n')
      );
    return message.channel.send({ embeds: [embed] });
  }

  // ====== HƯỚNG DẪN ======
if (command === '!khelp') {
  const embed = new EmbedBuilder()
    .setTitle('📘 Hướng Dẫn Kidnap Bot')
    .setColor('#1E90FF')
    .addFields(
      { name: '🔹 !batcoc @user', value: 'Bắt cóc (25% tỉ lệ, 90s hồi chiêu)' },
      { name: '🔹 !giaicuu @user', value: 'Giải cứu (10% tỉ lệ, 5 phút hồi chiêu)' },
      { name: '🔹 !chaytron', value: 'Trốn thoát (10% tỉ lệ, 10 phút hồi chiêu)' },
      { name: '🔹 !tratan @no', value: 'Tra tấn nô lệ bằng các hình thức khác nhau' },
      { name: '🔹 !thuongthuong @no', value: 'Thể hiện tình cảm với nô lệ (nắm tay, hôn...)' },
      { name: '🔹 !danhsachnoled', value: 'Xem danh sách nô lệ hiện có' },
      { name: '🔹 !buyshield', value: 'Mua khiên bảo vệ bản thân hoặc nô lệ' },
      { name: '🔹 !topnoled', value: 'Xem bảng xếp hạng chủ nô' },
      { name: '🔹 !work', value: 'Làm việc để kiếm thêm tiền' },
      { name: '🔹 !daily', value: 'Nhận thưởng tiền mỗi ngày' },
      { 
  name: '🎲 !starttaixiu / !cuoc <tài|xỉu> <tiền cược>', 
  value: 'Bắt đầu trò chơi và đặt cược Tài/Xỉu.\n- Sau mỗi ván sẽ có kết quả xúc xắc\n- Cooldown 30s trước khi bắt đầu ván mới' 
},
      { name: '🔹 !xemsodu', value: 'Xem số dư hiện tại' },
      { name: '🔹 !om @user', value: 'Ôm người khác một cách ấm áp' },
      { name: '🔹 !hon @user', value: 'Hôn người khác một cách ngọt ngào' },
    )
    .setFooter({ text: 'Kidnap Bot – Game Roleplay Giải Trí' })
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/4334/4334050.png')
    .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
});

// ====== MENU TƯƠNG TÁC ======
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  // Xử lý tra tấn
  if (interaction.customId.startsWith('chontratan')) {
    const [, masterId, slaveId] = interaction.customId.split('-');
    if (interaction.user.id !== masterId)
      return interaction.reply({ content: '🚫 Bạn không phải chủ nhân!', ephemeral: true });

    const action = interaction.values[0];
    const actions = {
      dien: { text: '⚡ Chích điện', gif: 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif' },
      lua: { text: '🔥 Đốt lửa', gif: 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif' },
      nuoc: { text: '💧 Dội nước đá', gif: 'https://media.giphy.com/media/kdHXzLZy1jDZe/giphy.gif' },
      roi: { text: '🔩 Roi sắt', gif: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif' },
      tuhinh: { text: '🔫 Tử hình', gif: 'https://media.giphy.com/media/13gvXfEVlxQjDO/giphy.gif' },
    };
    const { text, gif } = actions[action];

    const embed = new EmbedBuilder()
      .setColor('#DC143C')
      .setTitle('🔪 Tra Tấn Nô Lệ')
      .setDescription(`**<@${masterId}>** đã thực hiện hành động **${text}** với **<@${slaveId}>**! 😈`)
      .setImage(gif)
      .setFooter({ text: 'Mọi người đều thấy cảnh này!' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // Xử lý tình cảm
  if (interaction.customId === 'chonthuongthuong') {
    const action = interaction.values[0];
    const actions = {
      namtay: { text: '🤝 Nắm tay', gif: 'https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif' },
      honma: { text: '😘 Hôn má', gif: 'https://media.giphy.com/media/KH1CTZtw1iP3W/giphy.gif' },
      hontran: { text: '😚 Hôn trán', gif: 'https://media.giphy.com/media/XpgOZHuDfIkoM/giphy.gif' },
      honmoi: { text: '💋 Hôn môi', gif: 'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif' },
      vodit: {text: '💀 Vỗ đít'}
    };
    const { text, gif } = actions[action];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('💞 Hành Động Tình Cảm')
      .setDescription(`**${interaction.user.username}** đã **${text}** với người nô lệ của mình ❤️`)
      .setImage(gif)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
});
// ==================== BOT SẴN SÀNG ====================
client.once('ready', () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
});


client.login(process.env.TOKEN);