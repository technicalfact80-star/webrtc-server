const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

/* 🔑 Twilio Credentials */
const ACCOUNT_SID = "AC236b13ef6dd3d799efa267c900de2154";
const AUTH_TOKEN = "c613f86bfba2b5901eab1e163df1878a";

/* 🌍 TURN API */
app.get("/turn", (req, res) => {
  res.json({
    iceServers: [
      {
        urls: "stun:global.stun.twilio.com:3478"
      },
      {
        urls: "turn:global.turn.twilio.com:3478?transport=udp",
        username: ACCOUNT_SID,
        credential: AUTH_TOKEN
      }
    ]
  });
});

/* 🚀 HTTP server */
const server = app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server running");
});

/* 🔌 WebSocket signaling */
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on("connection", (ws) => {

  console.log("🔗 Client connected");

  ws.on("message", (message) => {

    try {
      const data = JSON.parse(message);

      /* REGISTER */
      if (data.type === "register") {
        ws.deviceId = data.id;
        clients[data.id] = ws;

        console.log("✅ Registered:", data.id);
        return;
      }

      /* FORWARD SIGNALS */
      if (data.target && clients[data.target]) {
        clients[data.target].send(JSON.stringify(data));

        console.log(`📡 ${data.type} ${data.from} → ${data.target}`);
      }

    } catch (e) {
      console.log("❌ Error:", e);
    }

  });

  ws.on("close", () => {
    console.log("❌ Disconnected:", ws.deviceId);

    if (ws.deviceId) {
      delete clients[ws.deviceId];
    }
  });

});
