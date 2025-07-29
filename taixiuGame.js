const { EmbedBuilder } = require('discord.js');

let taixiuBets = {};       
let taixiuPot = 0;
let taixiuRound = 1;
let taixiuTimeLeft = 60;   // 60 giây đặt cược
let taixiuChannel = null;
let taixiuInterval = null;
let balancesRef = null;    
let taixiuStatusMessage = null;
let isGameStopped = false; // Để kiểm tra khi dừng game

function startTaixiuGame(channel, balances) {
  taixiuChannel = channel;
  balancesRef = balances;

  if (taixiuInterval) clearInterval(taixiuInterval);
  taixiuTimeLeft = 60;
  taixiuBets = {};
  taixiuPot = 0;
  isGameStopped = false;

  sendTaixiuStatus(true);

  taixiuInterval = setInterval(() => {
    taixiuTimeLeft--;
    if (taixiuTimeLeft <= 0) {
      clearInterval(taixiuInterval);
      taixiuInterval = null;
      endTaixiuRound();
    } else {
      sendTaixiuStatus(false);
    }
  }, 1000);
}

// ====== Cập nhật bảng ======
function sendTaixiuStatus(initial = false) {
  if (!taixiuChannel) return;

  const participants = Object.entries(taixiuBets)
    .map(([uid, info]) => `<@${uid}>: ${info.choice.toUpperCase()} (${info.bet}💰)`)
    .join('\n') || '⛔ Chưa có người chơi';

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎲 Ván Tài Xỉu #${taixiuRound}`)
    .setDescription(
      `⌛ **Thời gian còn:** ${taixiuTimeLeft}s\n` +
      `💰 **Tổng tiền cược:** ${taixiuPot}💰\n` +
      `👥 **Người tham gia:**\n${participants}`
    )
    .setFooter({ text: 'Dùng !cuoc <tài/xỉu> <số tiền> để cược' })
    .setTimestamp();

  if (initial || !taixiuStatusMessage) {
    taixiuChannel.send({ embeds: [embed] }).then(msg => taixiuStatusMessage = msg);
  } else {
    taixiuStatusMessage.edit({ embeds: [embed] }).catch(() => {});
  }
}

// ====== Kết thúc ván ======
function endTaixiuRound() {
  const dice = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
  const total = dice.reduce((a, b) => a + b);
  const result = total >= 11 ? 'tài' : 'xỉu';

  let winners = [];
  let losers = [];

  for (const [userId, betInfo] of Object.entries(taixiuBets)) {
    const userBal = balancesRef.get(userId) || 0;

    if (betInfo.choice === result) {
      balancesRef.set(userId, userBal + betInfo.bet);
      winners.push({ userId, bet: betInfo.bet });
    } else {
      balancesRef.set(userId, userBal - betInfo.bet);
      losers.push({ userId, bet: betInfo.bet });
    }
  }

  const embed = new EmbedBuilder()
    .setColor(result === 'tài' ? '#FF4500' : '#1E90FF')
    .setTitle(`📢 Kết Quả Ván #${taixiuRound}`)
    .setDescription(
      `🎲 Xúc xắc: [${dice.join('] [')}]\n` +
      `🔔 **Tổng:** ${total} → **${result.toUpperCase()}**\n\n` +
      (winners.length
        ? `🏆 **Thắng:**\n${winners.map(w => `<@${w.userId}> +${w.bet}💰`).join('\n')}`
        : '😢 Không ai thắng!') +
      (losers.length
        ? `\n💸 **Thua:**\n${losers.map(l => `<@${l.userId}> -${l.bet}💰`).join('\n')}`
        : '')
    )
    .setFooter({ text: isGameStopped ? 'Game đã dừng' : 'Bắt đầu ván mới sau 30 giây...' })
    .setTimestamp();

  taixiuChannel.send({ embeds: [embed] });

  taixiuRound++;

  // Nếu không bị dừng thì tự động tiếp tục
  if (!isGameStopped) {
    setTimeout(() => {
      startTaixiuGame(taixiuChannel, balancesRef);
    }, 30 * 1000);
  }
}

// ====== Xử lý lệnh ======
function handleCommands(message, balances) {
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '!starttaixiu') {
    if (taixiuInterval) return message.reply('⚠️ Trò chơi đang diễn ra!');
    startTaixiuGame(message.channel, balances);
    return message.reply('🎲 Đã bắt đầu trò chơi Tài Xỉu!');
  }

  if (command === '!stoptaixiu') {
    if (!taixiuInterval && isGameStopped) 
      return message.reply('❌ Không có trò chơi nào để dừng.');
    isGameStopped = true;
    if (taixiuInterval) {
      clearInterval(taixiuInterval);
      taixiuInterval = null;
    }
    return message.reply('🛑 Trò chơi Tài Xỉu đã được dừng. Sẽ không có ván mới sau khi kết thúc.');
  }

  if (command === '!cuoc') {
    const choice = args[0]?.toLowerCase();
    const bet = parseInt(args[1]);

    if (!taixiuInterval) return message.reply('❌ Chưa có ván nào! Dùng `!starttaixiu` để bắt đầu.');
    if (!choice || !['tài', 'tai', 'xỉu', 'xiu'].includes(choice))
      return message.reply('❌ Chọn **tài** hoặc **xỉu**.');
    if (isNaN(bet) || bet <= 0)
      return message.reply('💰 Nhập số tiền cược hợp lệ.');

    const bal = balances.get(message.author.id) || 0;
    if (bal < bet)
      return message.reply(`💰 Bạn không đủ tiền. Số dư: ${bal}💰`);

    taixiuBets[message.author.id] = {
      choice: choice.startsWith('t') ? 'tài' : 'xỉu',
      bet
    };
    taixiuPot += bet;

    return message.reply(`✅ Đặt cược **${bet}💰** vào **${choice.toUpperCase()}** thành công!`);
  }
}

module.exports = { handleCommands };