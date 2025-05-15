import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import multer from "multer";
import path from "path";
// import log from "./middlewares/Log";
// import logger from "./utils/Winston";
import { uploadFileToS3 } from "./utils/s3";
import dotenv from "dotenv";

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

dotenv.config();
// app.use(log.checkTraffic);

const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const data = await uploadFileToS3(req.file);
    const fileUrl = data.Location; // Get the file URL from S3 response

    return res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading file", error });
  }
};

// Multer configuration for memory storage (for S3 uploads)
const storage = multer.memoryStorage(); // Use memory storage for S3 uploads

// Multer middleware to handle file upload
const upload = multer({ storage: storage });

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(__dirname + "/index.html");
});

// Route for uploading any file
app.post("/upload", upload.single("file"), uploadFile);

app.get("/uploads/:file", (req: Request, res: Response) => {
  const fileName = req.params.file;
  res.sendFile(path.join(__dirname, "../uploads", fileName));
});

interface Message {
  sender: string;
  message?: string;
  fileUrl?: string;
  originalFileName?: string;
  created: Date;
}

let roomMessages: { [key: string]: Message[] } = {};

let onlineUsers: number = 0;

io.on("connection", (socket: Socket) => {
  // logger.info(`A user ${socket.id} connected`);
  onlineUsers++;
  io.emit("online users", { count: onlineUsers });

  socket.on("join room", (room: string) => {
    // logger.info(`User ${socket.id} joined room: ${room}`);
    socket.join(room);
    if (!roomMessages[room]) {
      roomMessages[room] = [];
    }
    roomMessages[room].forEach((msg) => {
      socket.emit("chat message", msg);
    });
    io.emit("room members", io.sockets.adapter.rooms.get(room)?.size || 0);
  });

  socket.on("leave room", (room) => {
    // logger.info(`User ${socket.id} left room: ${room}`);
    socket.leave(room);
    socket
      .to(room)
      .emit("room members", io.sockets.adapter.rooms.get(room)?.size || 0);
  });

  socket.on("chat message", (msg: Message, room: string) => {
    // logger.info(
    //   `Message received from ${msg.sender}(${socket.id}) in room: ${room} : ${msg.message || msg.fileUrl}`,
    // );
    msg.created = new Date();
    if (!roomMessages[room]) {
      roomMessages[room] = [];
    }
    roomMessages[room].push(msg);
    io.to(room).emit("chat message", msg);
  });

  socket.on("clear chat", (room: string) => {
    // logger.info(`Chat cleared from ${socket.id} in room: ${room}`);
    if (roomMessages[room]) {
      delete roomMessages[room];
      io.to(room).emit("chat cleared");
    }
  });

  socket.on("disconnect", () => {
    // logger.info(`A user ${socket.id} disconnected`);
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
