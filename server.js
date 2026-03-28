const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());

/* 🔑 TWILIO */
const ACCOUNT_SID = "AC236b13ef6dd3d799efa267c900de2154";
const AUTH_TOKEN = "c613f86bfba2b5901eab1e163df1878a";
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

/* 🌍 TURN */
app.get("/turn", async (req, res) => {
  try {
    const token = await client.tokens.create();
    res.json({ iceServers: token.iceServers });
    console.log("✅ TURN Generated");
  } catch (error) {
    console.error("❌ TURN ERROR:", error.message);
    res.json({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });
  }
});

/* 🚀 SERVER */
const server = app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 SIGNALING SERVER RUNNING");
});

/* 🔌 WEBSOCKET */
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on("connection", (ws) => {
  console.log("🔌 NEW CLIENT CONNECTED");

  ws.on("message", (message) => {
    try {
      const msg = message.toString();
      const data = JSON.parse(msg);

      console.log("📩 RECEIVED:", data.type);

      // =====================
      // REGISTER
      // =====================
      if (data.type === "register") {
        ws.deviceId = data.id;
        clients[data.id] = ws;

        console.log("✅ REGISTERED:", data.id);
        console.log("👥 TOTAL CLIENTS:", Object.keys(clients).length);

        return;
      }

      // =====================
      // ROUTING FIX (MAIN FIX)
      // =====================
      const targetId = data.target || data.to;

      if (!targetId) {
        console.log("⚠ NO TARGET FOUND");
        return;
      }

      if (!clients[targetId]) {
        console.log("❌ TARGET NOT CONNECTED:", targetId);
        return;
      }

      console.log(`📤 FORWARD ${data.type} → ${targetId}`);

      clients[targetId].send(msg);

    } catch (e) {
      console.log("❌ ERROR:", e.message);
    }
  });

  ws.on("close", () => {
    if (ws.deviceId) {
      console.log("❌ DISCONNECTED:", ws.deviceId);
      delete clients[ws.deviceId];
    }
  });
});
