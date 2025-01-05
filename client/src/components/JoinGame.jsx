import React, { useState } from "react";
import { Input, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket/socket.js";
import "../styles/JoinGame.css";

export default function JoinGame() {
  const [player, setPlayer] = useState(null);
  const navigate = useNavigate();
  const { room } = useParams();

  const joinGame = () => {
    if (player) {
      socket.emit("joinRoom", { room: room, player: player });
      navigate(`/loading`);
    }
  };

  return (
    <div className="join-game">
      <img src={require("../img/title.png")} alt="" />
      <div className="opponent-name">
        <Input
          type="text"
          placeholder="Enter your name"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
        />
        <Button variant="contained" onClick={joinGame}>
          Join Game
        </Button>
      </div>
    </div>
  );
}
