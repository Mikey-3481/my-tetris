import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("fetchRooms", () => {
    const roomsToSend = Object.keys(rooms).filter(
      (room) => Object.keys(rooms[room].players).length === 1
    );

    socket.emit("rooms", roomsToSend);
  });

  socket.on("joinRoom", ({ room, player }) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: {},
        gameState: {},
        score: {},
      };
    }

    if (rooms[room].players[socket.id]) {
      return;
    }

    socket.join(room);
    rooms[room].players[socket.id] = player;
    console.log(`User ${socket.id} joined room: ${room}`);
    io.to(room).emit("roomUpdate", {
      players: Object.keys(rooms[room].players),
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      if (rooms[room]) {
        delete rooms[room].players[socket.id];

        if (Object.keys(rooms[room].players).length === 0) {
          delete rooms[room];
        } else {
          io.to(room).emit("roomUpdate", {
            players: Object.keys(rooms[room].players),
          });
        }
      }
    });
  });

  socket.on("get into the game", () => {
    const roomsOfSocket = Array.from(socket.rooms).filter(
      (r) => r !== socket.id
    );
    if (roomsOfSocket.length > 0) {
      const roomName = roomsOfSocket[0];
      io.to(roomName).emit("game start", roomName);
    }
  });

  socket.on("game started", (roomName) => {
    io.to(roomName).emit("game started", { players: rooms[roomName].players });
  });

  socket.on("drop piece", (room) => {
    io.ro(room).emit("drop piece");
  });

  socket.on("game stopped", (room) => {
    io.to(room).emit("game stopped", { id: socket.id });
  });

  socket.on("updateGrid", ({ room, grid }) => {
    if (!rooms[room]) return;
    rooms[room].gameState[socket.id] = { grid };

    socket.to(room).emit("opponentGrid", { grid });
  });

  socket.on("updatePiece", ({ room, piece }) => {
    socket.to(room).emit("opponentPiece", { piece });
  });

  socket.on("updatePosition", ({ room, position }) => {
    socket.to(room).emit("opponentPosition", { position });
  });

  socket.on("gameOver", (room) => {
    console.log(`gameOver event emitted for room: ${room}`);
    io.to(room).emit("gameOver", { winner: socket.id });
  });

  socket.on("linesToSend", ({ room, lines }) => {
    io.to(room).emit("rowsToFill", { lines, id: socket.id });
  });

  socket.on("quit game", (room) => {
    if (rooms[room]) {
      delete rooms[room];
    }
    io.to(room).emit("return home");
    socket.leave(room);
  });

  socket.on("close modal", (room) => {
    io.to(room).emit("close modal");
  });

  socket.on("next game", (room) => {
    io.to(room).emit("next game");
  });
});

server.listen(4000, () => {
  console.log("Server is running on http://172.16.101.9:4000");
});
