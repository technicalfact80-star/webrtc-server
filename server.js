const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔥 PREMIUM TURN SERVERS FOR MOBILE DATA BYPASS
app.get("/turn", (req, res) => {
  res.json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp", // TCP bypasses Jio/Airtel Firewalls
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });
});

const server = app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 FlashGet Signaling Server Running!");
});

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
        console.log(`✅ Registered: ${data.id}`);
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
