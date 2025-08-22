const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const Message = require("./models/Message");
const messagesRoutes = require("./routes/messages");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3001" },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3001" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/messages", messagesRoutes);
connectDB();

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("userStatus", { userId, status: "online" });
  });

  socket.on("sendMessage", async ({ sender, receiver, content }) => {
    const message = new Message({ sender, receiver, content });
    await message.save();
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }
    io.to(onlineUsers.get(sender)).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("userStatus", { userId, status: "offline" });
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
