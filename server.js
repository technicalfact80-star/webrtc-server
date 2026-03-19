const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());

/* 🔑 TWILIO CREDENTIALS */
const ACCOUNT_SID = "AC236b13ef6dd3d799efa267c900de2154";
const AUTH_TOKEN = "c613f86bfba2b5901eab1e163df1878a";
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

/* 🌍 DYNAMIC TURN API (For Hotspot/Mobile Data Support) */
app.get("/turn", async (req, res) => {
  try {
    const token = await client.tokens.create();
    res.json({ iceServers: token.iceServers });
    console.log("✅ Twilio TURN Token Generated");
  } catch (error) {
    console.error("❌ Twilio Error:", error.message);
    res.json({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
      ]
    });
  }
});

/* 🚀 HTTP server */
const server = app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Production Signaling Server running");
});

/* 🔌 WebSocket signaling (Buffer Crash Fixed) */
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const msgString = message.toString();
      const data = JSON.parse(msgString);

      if (data.type === "register") {
        ws.deviceId = data.id;
        clients[data.id] = ws;
        console.log("✅ Registered:", data.id);
        return;
      }

      if (data.target && clients[data.target]) {
        clients[data.target].send(msgString);
      }
    } catch (e) {
      console.log("❌ Error:", e.message);
    }
  });

  ws.on("close", () => {
    if (ws.deviceId) delete clients[ws.deviceId];
  });
});
