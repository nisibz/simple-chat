# Simple Chat Application

## Overview

This project is a real-time chat application built using Socket.IO, Express, and Prisma. The primary goal of this project is to study and understand the core concepts of Socket.IO, including real-time communication, event handling, and message broadcasting.

## Features

- **Real-time Messaging**: Users can send and receive messages instantly without refreshing the page.
- **File Uploads**: Users can upload files (images, videos, etc.) and share them in the chat.
- **Room Management**: Users can join specific chat rooms and see the number of online users in each room.
- **Clear Chat**: Users can clear the chat history in a room with confirmation.
- **Logging**: The application logs incoming requests and responses for monitoring and debugging.
- **Docker Support**: The application can be easily run in a Docker container.

## Technologies Used

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma
- **Real-time Communication**: Socket.IO
- **File Storage**: AWS S3
- **Logging**: Winston
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js
- Docker and Docker Compose
- AWS account (for file uploads)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nisibz/simple-chat.git
   cd simple-chat
   ```

2. Create a `.env` file based on the `.env.example` file and fill in the required values for your database and AWS credentials.

3. Build and run the application using Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. Open your browser and navigate to `http://localhost:3000`.

### Running Locally (Without Docker)

If you prefer to run the application locally without Docker, follow these steps:

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Run the Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

3. Start the application:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Usage

- Enter your name and the room you want to join, then click "Join Room".
- Start chatting with other users in real-time.
- Upload files to share with others in the chat.
- Use the "Clear Chat" button to remove all messages in the current room.

## Logging

The application uses Winston for logging incoming requests and responses. Logs are stored in the `logs` directory.

## Acknowledgments

- [Socket.IO Documentation](https://socket.io/docs/)
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
