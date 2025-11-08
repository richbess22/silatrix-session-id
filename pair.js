const { giftedid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");

const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("baileys",);

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = giftedid();
    let num = req.query.number;
    
    async function GIFTED_PAIR_CODE() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./temp/' + id);
        
        try {
            let Gifted = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari")
            });

            if (!Gifted.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Gifted.requestPairingCode(num);
                console.log(`Your Code: ${code}`);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Gifted.ev.on('creds.update', saveCreds);
            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000);
                    
                    // Generate simple session ID
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let sessionId = 'Sila~';
                    for (let i = 0; i < 40; i++) {
                        sessionId += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    
                    console.log(`Session ID: ${sessionId}`);

                    // Send session ID to user
                    const session = await Gifted.sendMessage(Gifted.user.id, { 
                        text: sessionId 
                    });

                    const GIFTED_TEXT = `
*✅ SESSION ID GENERATED SUCCESSFULLY! ✅*
______________________________

*🎉 YOUR SESSION ID:*
\`\`\`
${sessionId}
\`\`\`

*💪 Empowering Your Experience with SILATRIX-MD Bot*

*🌟 Show your support by giving our repo a star! 🌟*
🔗 https://github.com/Silatrix2/silatrix-md

*💭 Need help? Join our support groups:*
📢 💬
https://whatsapp.com/channel/0029Vb6DeKwCHDygxt0RXh0L

*📚 Learn & Explore More with Tutorials:*
🪄 YouTube Channel: https://www.youtube.com/@silatrix22

*🥀 Powered by SILATRIX-MD Bot & Sila Tech Inc 🥀*
*Together, we build the future of automation! 🚀*
______________________________

Use your Session ID Above to Deploy your Bot.
Check on YouTube Channel for Deployment Procedure.
Don't Forget To Give Star⭐ To My Repo`;

                    await Gifted.sendMessage(Gifted.user.id, { 
                        text: GIFTED_TEXT 
                    }, { quoted: session });

                    await delay(100);
                    await Gifted.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    GIFTED_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    return await GIFTED_PAIR_CODE();
});

module.exports = router;
