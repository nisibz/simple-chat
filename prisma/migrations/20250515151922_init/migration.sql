-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "message" TEXT,
    "fileUrl" TEXT,
    "originalFileName" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
