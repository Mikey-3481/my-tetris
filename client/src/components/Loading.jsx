import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import socket from "../socket/socket";
import "../styles/Loading.css";

export default function Loading() {
  const [room, setRoom] = useState([]);
  const navigate = useNavigate();

  socket.on("roomUpdate", ({ players }) => {
    setRoom(players);
  });

  const startGame = () => {
    socket.emit("get into the game");
  };

  socket.on("game start", (roomName) => {
    console.log(roomName);
    navigate(`/tetris/${roomName}`);
    socket.emit("game started", roomName);
  });

  return (
    <div className="loading">
      <img src={require("../img/title.png")} alt="" />
      {room.length === 1 ? (
        <div className="loading-text">
          <h1>Waiting for player to join</h1>
          <div className="loader"></div>
        </div>
      ) : (
        <div>
          <Button variant="contained" onClick={startGame}>
            click here to start
          </Button>
        </div>
      )}
    </div>
  );
}
