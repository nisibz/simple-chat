import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript!");
});

app.get("/chat", (_req: Request, res: Response) => {
  res.sendFile(__dirname + "/chat.html");
});

let roomMessages: {
  [key: string]: { sender: string; message: string; created: Date }[];
} = {};

let onlineUsers: number = 0;

io.on("connection", (socket: Socket) => {
  onlineUsers++;
  io.emit("online users", { count: onlineUsers });

  socket.on("join room", (room: string) => {
    socket.join(room);
    if (roomMessages[room]) {
      roomMessages[room].forEach((msg) => {
        socket.emit("chat message", msg);
      });
    }
    io.emit("room members", io.sockets.adapter.rooms.get(room)?.size || 0);
  });

  socket.on("leave room", (room) => {
    socket.leave(room);
    socket
      .to(room)
      .emit("room members", io.sockets.adapter.rooms.get(room)?.size || 0);
  });

  socket.on(
    "chat message",
    (msg: { sender: string; message: string; created: Date }, room: string) => {
      if (!roomMessages[room]) {
        roomMessages[room] = [];
      }
      roomMessages[room].push(msg);
      io.to(room).emit("chat message", msg);
    },
  );

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("online users", { count: onlineUsers });

    // Notify all rooms about the updated member count
    socket.rooms.forEach((room) => {
      socket
        .to(room)
        .emit("room members", io.sockets.adapter.rooms.get(room)?.size || 0);
    });
  });
});

server.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`);
});
