import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { Prisma } from "@prisma/client";
import multer from "multer";
import log from "./middlewares/Log";
import logger from "./utils/Winston";
import { uploadFileToS3 } from "./utils/s3";

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
app.use(log.checkTraffic);

const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const data = await uploadFileToS3(req.file);
    const fileUrl = data.Location;

    return res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading file", error });
  }
};

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.single("file"), uploadFile);

type MessagePayload = Omit<
  Prisma.MessageCreateManyInput,
  "id" | "created_at"
> & {
  id?: string;
  created?: Date;
};

let onlineUsers: number = 0;

const formatMessage = (msg: any) => {
  return {
    ...msg,
    created: msg.created_at,
  };
};

const updateRoomMembers = (room: string) => {
  io.to(room).emit(
    "room members",
    io.sockets.adapter.rooms.get(room)?.size || 0,
  );
};

const handleJoinRoom = (socket: Socket) => async (room: string) => {
  logger.info(`User ${socket.id} joined room: ${room}`);
  socket.join(room);
  try {
    const messages = await prisma.message.findMany({
      where: { room },
      orderBy: { created_at: "asc" },
    });

    messages.forEach((msg) => {
      socket.emit("chat message", formatMessage(msg));
    });
  } catch (error) {
    logger.error("Error loading messages:", error);
  }
  updateRoomMembers(room);
};

const handleLeaveRoom = (socket: Socket) => (room: string) => {
  logger.info(`User ${socket.id} left room: ${room}`);
  socket.leave(room);
  updateRoomMembers(room);
};

const handleChatMessage =
  (socket: Socket) => async (msg: MessagePayload, room: string) => {
    logger.info(
      `Message received from ${msg.sender}(${socket.id}) in room: ${room} : ${msg.message || msg.fileUrl}`,
    );
    try {
      const savedMessage = await prisma.message.create({
        data: {
          room,
          sender: msg.sender,
          message: msg.message,
          fileUrl: msg.fileUrl,
          originalFileName: msg.originalFileName,
        },
      });

      io.to(room).emit("chat message", formatMessage(savedMessage));
    } catch (error) {
      logger.error("Error saving message:", error);
    }
  };

const handleClearChat = (socket: Socket) => async (room: string) => {
  logger.info(`Chat cleared from ${socket.id} in room: ${room}`);
  try {
    await prisma.message.deleteMany({
      where: { room },
    });
    io.to(room).emit("chat cleared");
  } catch (error) {
    logger.error("Error clearing chat:", error);
  }
};

io.on("connection", (socket: Socket) => {
  logger.info(`User connected: ${socket.id}`);
  onlineUsers++;
  io.emit("online users", { count: onlineUsers });

  const handleDisconnect = () => {
    logger.info(`User disconnected: ${socket.id}`);
    onlineUsers--;
    io.emit("online users", { count: onlineUsers });
    socket.rooms.forEach((room) => updateRoomMembers(room));
  };

  socket.on("join room", handleJoinRoom(socket));
  socket.on("leave room", handleLeaveRoom(socket));
  socket.on("chat message", handleChatMessage(socket));
  socket.on("clear chat", handleClearChat(socket));
  socket.on("disconnect", handleDisconnect);
});

server.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`);
});
