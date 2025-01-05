import React, { useState, useEffect, useCallback, forwardRef } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Slide,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import "../styles/ErrorMessage.css";

const Transition = forwardRef((props, ref) => (
  <Slide direction="down" ref={ref} {...props} />
));

export default function ErrorMessage({
  message,
  room,
  clearMessage,
  over = false,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  useEffect(() => {
    const closeModalHandler = () => handleClose();
    const returnHomeHandler = () => navigate(`/`);

    socket.on("close modal", closeModalHandler);
    socket.on("return home", returnHomeHandler);

    return () => {
      socket.off("close modal", closeModalHandler);
      socket.off("return home", returnHomeHandler);
    };
  }, [navigate]);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearMessage();
  }, [clearMessage]);

  const quitGame = useCallback(() => {
    handleClose();
    socket.emit("quit game", room);
  }, [handleClose, room]);

  const returnGame = useCallback(() => {
    socket.emit("game stopped", room);
    socket.emit("close modal", room);
  }, [room]);

  const nextGame = useCallback(() => {
    socket.emit("next game", room);
    socket.emit("close modal", room);
  }, [room]);

  return (
    <Dialog
      open={!!message && open}
      TransitionComponent={Transition}
      keepMounted
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
    >
      <DialogTitle id="error-dialog-title">{message}</DialogTitle>
      <DialogActions>
        <Button onClick={quitGame} color="error" variant="contained" aria-label="Quit Game" id="error-btn">
          Quit
        </Button>
        {over ? (
          <Button onClick={nextGame} color="success" aria-label="Next Game" variant="contained">
            Continue
          </Button>
        ) : (
          <Button onClick={returnGame} color="success" aria-label="Return Game" variant="contained">
            Return
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
