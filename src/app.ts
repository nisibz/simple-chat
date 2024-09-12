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

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("join room", (room: string) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
    if (roomMessages[room]) {
      roomMessages[room].forEach((msg) => {
        socket.emit("chat message", msg);
      });
    }
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
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
