const WebSocket = require("ws");
const http = require("http");

// Render gives dynamic port
const PORT = process.env.PORT || 3000;

// Create HTTP server (IMPORTANT)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC signaling server running");
});

// Attach WebSocket to HTTP server
const wss = new WebSocket.Server({ server });

const clients = {};

wss.on("connection", (ws) => {

  console.log("🔗 Client connected");

  ws.on("message", (message) => {

    const data = JSON.parse(message);

    if (data.type === "register") {
      clients[data.id] = ws;
      console.log("✅ Registered:", data.id);
      return;
    }

    if (data.target && clients[data.target]) {
      console.log(`📡 ${data.type} ${data.from} → ${data.target}`);
      clients[data.target].send(JSON.stringify(data));
    }

  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });

});

// Start server (IMPORTANT)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});