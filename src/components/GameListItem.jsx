import { Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GameListItem.css";

export default function GameListItem({ room }) {
  const navigate = useNavigate();

  const joinGame = () => {
    navigate(`/join-game/${room}`);
  };

  return (
    <>
    <div className="game-list-item">
      <h4 className="title">{`${room}'s game`}</h4>
      <Button className="btn" variant="contained" color="success" onClick={joinGame}>
        join
      </Button>
    </div>
    <u className="underline"></u>
    </>
  );
}
