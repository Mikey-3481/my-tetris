import React from "react";
import { Input, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import GameListItem from "./GameListItem";
import socket from "../socket/socket.js";
import "../styles/GameLobby.css";

export default function GameLobby() {
  const [room, setRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const fetchRooms = () => {
    socket.emit("fetchRooms");
  };

  socket.on("rooms", (roomsToSend) => {
    setRooms(roomsToSend);
  });

  const createGame = () => {
    if (room && !rooms.includes(room)) {
      socket.emit("joinRoom", { room: room, player: room });
      navigate(`/loading`);
    } else if (rooms.includes(room)) {
      toast.warning("Game already exists!", {
        position: "bottom-center",
        className: "custom-toast",
        bodyClassName: "custom-toast-body",
        progressClassName: "custom-toast-progress",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchRooms();

    if (room) {
      socket.off("joinRoom");
    }
  }, [rooms]);

  return (
    <div className="game-lobby">
      <img src={require("../img/title.png")} alt="" />
      <div className="rooms-list">
        <h3>CURRENT GAMES</h3>
        <div className="rooms">
          {rooms.map((room, index) => (
            <GameListItem key={index} room={room} />
          ))}
        </div>
      </div>
      <div className="room-form">
        <Input
          type="text"
          placeholder="Enter your name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <Button variant="contained" onClick={createGame}>
          Create new Game
        </Button>
      </div>
      <ToastContainer />
    </div>
  );
}
