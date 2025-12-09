import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import Pino from "pino"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session")
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: Pino({ level: "silent" })
    })

    sock.ev.on("creds.update", saveCreds)

    // ===== RANDOM DELAY =====
    function randDelay(min = 3000, max = 8000) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // ===== REPLY DENGAN DELAY + TYPING =====
    async function replyWithDelay(sock, msg, text) {
        const jid = msg.key.remoteJid

        // indikator mengetik
        await sock.sendPresenceUpdate("composing", jid)

        // delay random 1.5–3 detik
        await new Promise(res => setTimeout(res, randDelay()))

        // kirim balasan
        return sock.sendMessage(jid, { text }, { quoted: msg })
    }

    // ===== HANDLE PESAN MASUK =====
    sock.ev.on("messages.upsert", async m => {
        const msg = m.messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        const prefix = "."
        if (!body.startsWith(prefix)) return

        const args = body.slice(prefix.length).trim().split(/ +/)
        const cmd = args.shift()?.toLowerCase()

        // ===== SWITCH COMMAND =====
        switch (cmd) {

            case "ping":
                await replyWithDelay(sock, msg, "Pong! bot masih hidup kawan🥰")
                break

            case "tutup":
                await sock.groupSettingUpdate(from, "announcement")
                await replyWithDelay(sock, msg, "Grup sudah *ditutup*.")
                break

            case "buka":
                await sock.groupSettingUpdate(from, "not_announcement")
                await replyWithDelay(sock, msg, "Grup sudah *dibuka*.")
                break

            case "welcome":
                if (args[0] === "on") {
                    await replyWithDelay(sock, msg, "Welcome telah diaktifkan.")
                } else if (args[0] === "off") {
                    await replyWithDelay(sock, msg, "Welcome telah dimatikan.")
                } else {
                    await replyWithDelay(sock, msg, "Format salah. Gunakan: .welcome on/off")
                }
                break

            default:
                await replyWithDelay(sock, msg, `Perintah tidak dikenal: ${cmd}`)
        }
    })
}

startBot()
