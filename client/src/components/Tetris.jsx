import React, { useState, useEffect } from "react";
import { ROWS, COLS, TETROMINOES } from "../constants.js";
import "../styles/Tetris.css";
import { useParams } from "react-router-dom";
import socket from "../socket/socket.js";
import ErrorMessage from "./ErrorMessage.jsx";

const Tetris = () => {
  const { room } = useParams();
  const createGrid = () =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  const pieces = Object.keys(TETROMINOES);
  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
  const initialPosition = { x: Math.floor(COLS / 2) - 1, y: 0 };

  const [nextPiece, setNextPiece] = useState(TETROMINOES[randomPiece]);
  const [grid, setGrid] = useState(createGrid());
  const [currentPiece, setCurrentPiece] = useState(TETROMINOES[randomPiece]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [pendingDrop, setPendingDrop] = useState(false);
  const [opponentGrid, setOpponentGrid] = useState(createGrid());
  const [opponentPiece, setOpponentPiece] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentPosition, setOpponentPosition] = useState({ x: 4, y: 0 });
  const [message, setMessage] = useState(null);
  const [scoreBall, setScoreBall] = useState(0);
  const [opponentScoreBall, setOpponentScoreball] = useState(0);
  const [player, setPlayer] = useState(null);
  const [opponent, setOpponent] = useState(null);

  socket.emit("updatePiece", { room, piece: currentPiece });

  const spawnTetromino = (grid) => {
    const newPiece = nextPiece;
    const newPosition = initialPosition;

    if (checkCollision(newPiece, newPosition, grid)) {
      socket.emit("gameOver", room);
      return;
    }
    setCurrentPiece(newPiece);
    socket.emit("updatePiece", { room, piece: newPiece });
    setNextPiece(
      TETROMINOES[pieces[Math.floor(Math.random() * pieces.length)]]
    );
    setPosition(newPosition);
    socket.emit("updatePosition", { room, position: newPosition });
  };

  const checkCollision = (piece, pos, grid) => {
    let collision = false;
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (
          piece[y][x] !== 0 &&
          (grid[pos.y + y] === undefined ||
            grid[pos.y + y][pos.x + x] === undefined ||
            grid[pos.y + y][pos.x + x] !== 0)
        ) {
          collision = true;
          break;
        }
      }
      if (collision) break;
    }
    return collision;
  };

  const lockPiece = () => {
    const newGrid = grid.map((row) => [...row]);
    currentPiece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newGrid[position.y + y][position.x + x] = value;
        }
      });
    });
    const clearedRows = clearRows(newGrid);
    setScore((prev) => prev + clearedRows * 10);
    socket.emit("linesToSend", { room, lines: clearedRows });

    spawnTetromino(newGrid);
  };

  const clearRows = (newGrid) => {
    const remainingRows = newGrid.filter((row) =>
      row.some((cell) => cell === 0)
    );
    const rowsCleared = ROWS - remainingRows.length;
    const emptyRows = Array.from({ length: rowsCleared }, () =>
      Array(COLS).fill(0)
    );
    setGrid([...emptyRows, ...remainingRows]);
    return rowsCleared;
  };

  const addRows = (lines, targetGrid, setGridFunction) => {
    const gridToAdd = Array.from({ length: lines }, () => {
      const arr = Array(10).fill(randomPiece);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.random() < 0.3 ? 0 : randomPiece;
      }
      return arr;
    });

    const newGrid = [...targetGrid.slice(lines), ...gridToAdd];
    setGridFunction(newGrid);
  };

  const addSentRows = (lines) => {
    addRows(lines, opponentGrid, setOpponentGrid);
  };

  const addReceivedRows = (lines) => {
    addRows(lines, grid, setGrid);
  };

  const dropPiece = () => {
    const newPosition = { x: position.x, y: position.y + 1 };

    if (checkCollision(currentPiece, newPosition, grid)) {
      lockPiece();
    } else {
      setPosition(newPosition);
      socket.emit("updatePosition", { room, position: newPosition });
    }
  };

  const stopGame = () => {
    socket.emit("game stopped", room);
  };

  const hardDrop = () => {
    let newY = position.y;
    while (
      !checkCollision(currentPiece, { x: position.x, y: newY + 1 }, grid)
    ) {
      newY += 1;
    }
    setPosition({ x: position.x, y: newY });
    socket.emit("updatePosition", {
      room,
      position: { x: position.x, y: newY },
    });
    setPendingDrop(true);
  };

  const clearMessage = () => {
    setMessage(null);
  };

  useEffect(() => {
    if (pendingDrop) {
      lockPiece();
      setPendingDrop(false);
    }
  }, [position, pendingDrop]);

  const movePiece = (dx) => {
    const newPosition = { x: position.x + dx, y: position.y };

    if (!checkCollision(currentPiece, newPosition, grid)) {
      setPosition(newPosition);
      socket.emit("updatePosition", { room, position: newPosition });
    }
  };

  const rotatePiece = () => {
    const rotatedPiece = currentPiece[0].map((_, i) =>
      currentPiece.map((row) => row[i]).reverse()
    );

    if (!checkCollision(rotatedPiece, position, grid)) {
      setCurrentPiece(rotatedPiece);
      socket.emit("updatePiece", { room, piece: rotatedPiece });
    }
  };

  useEffect(() => {
    if (gameOver || gameStarted === false) return;

    const interval = setInterval(() => {
      dropPiece();
      socket.emit("dorp piece", room);
    }, 300);

    return () => clearInterval(interval);
  }, [position, gameOver, gameStarted]);

  useEffect(() => {
    socket.on("drop piece", () => {
      dropPiece();
    });
  }, []);

  useEffect(() => {
    socket.emit("updateGrid", { room, grid: grid });

    socket.on("opponentGrid", ({ grid }) => {
      setOpponentGrid(grid);
    });

    socket.on("rowsToFill", ({ lines, id }) => {
      if (id === socket.id) {
        addSentRows(lines);
      } else {
        addReceivedRows(lines);
      }
    });

    socket.on("opponentPiece", ({ piece }) => {
      setOpponentPiece(piece);
    });

    socket.on("opponentPosition", ({ position }) => {
      setOpponentPosition(position);
    });

    socket.on("game started", ({ players }) => {
      setGameStarted(true);
      if (socket.id === Object.keys(players)[0]) {
        setPlayer(players[socket.id]);
        setOpponent(players[Object.keys(players)[1]]);
      } else {
        setPlayer(players[socket.id]);
        setOpponent(players[Object.keys(players)[0]]);
      }
    });

    socket.on("game stopped", ({ id }) => {
      setGameStarted(!gameStarted);
      if (id === socket.id) {
        setMessage("Are you sure you want to quit?");
      } else {
        setMessage("Game stopped");
      }
    });

    socket.on("game ended", () => {
      setGameOver(true);
    });

    socket.on("gameOver", ({ winner }) => {
      setGameOver(true);
      if (winner === socket.id) {
        setMessage("Game over! You lost.");
        setOpponentScoreball((prev) => prev + 1);
      } else {
        setMessage("You won!");
        setScoreBall((prev) => prev + 1);
      }
    });

    socket.on("next game", () => {
      setGrid(createGrid());
      setPosition({ x: 4, y: 0 });
      setOpponentPosition({ x: 4, y: 0 });
      setScore(0);
      setGameOver(false);
      setGameStarted(true);
    });

    return () => {
      socket.off("game started");
      socket.off("opponentGrid");
      socket.off("opponentPiece");
      socket.off("opponentPosition");
      socket.off("gameOver");
      socket.off("rowsToFill");
    };
  }, [grid, currentPiece, gameStarted, score]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") movePiece(-1);
      if (e.key === "ArrowRight") movePiece(1);
      if (e.key === "ArrowDown") dropPiece();
      if (e.key === "ArrowUp") rotatePiece();
      if (e.key === "Escape") stopGame();
      if (e.key === " ") hardDrop();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [room, currentPiece, position, grid, gameOver]);

  const overlayPieceOnGrid = (piece, pos, grid) => {
    const displayGrid = grid.map((row) => [...row]);

    piece?.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (
            displayGrid[pos.y + y] &&
            displayGrid[pos.y + y][pos.x + x] !== undefined
          ) {
            displayGrid[pos.y + y][pos.x + x] = value;
          }
        }
      });
    });

    return displayGrid;
  };

  const renderGrid = () => {
    const displayGrid = overlayPieceOnGrid(currentPiece, position, grid);

    return displayGrid.map((row, y) => (
      <div className="row" key={y}>
        {row.map((cell, x) => (
          <div
            className={`cell ${cell} ${cell !== 0 ? "filled" : ""}`}
            key={x}
          ></div>
        ))}
      </div>
    ));
  };

  const renderOpponentGrid = () => {
    const displayGrid = overlayPieceOnGrid(
      opponentPiece,
      opponentPosition,
      opponentGrid
    );

    return displayGrid.map((row, y) => (
      <div className="row" key={y}>
        {row.map((cell, x) => (
          <div
            className={`cell ${cell} ${cell !== 0 ? "filled" : ""}`}
            key={x}
          ></div>
        ))}
      </div>
    ));
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;

    return nextPiece.map((row, y) => (
      <div className="row" key={y}>
        {row.map((cell, x) => (
          <div
            className={`cell ${cell} ${cell !== 0 ? "filled" : ""}`}
            key={x}
          ></div>
        ))}
      </div>
    ));
  };

  const renderScoreBall = () => {
    const balls = Array(scoreBall).fill("ball");

    return (
      <>
        {balls.map((ball, index) => (
          <div className={ball} key={index}></div>
        ))}
      </>
    );
  };

  const renderOpponentScoreBall = () => {
    const balls = Array(opponentScoreBall).fill("ball");

    return (
      <>
        {balls.map((ball, index) => (
          <div className={ball} key={index}></div>
        ))}
      </>
    );
  };

  return (
    <>
      <div className="Tetris">
        <ErrorMessage
          message={message}
          room={room}
          clearMessage={clearMessage}
          over={gameOver}
        />
        <h2 className="score">
          {player}: {score}
        </h2>
        <div className="tetris-container">{renderGrid()}</div>
        <div className="game-balls">{renderScoreBall()}</div>
        <div className="next-block">{renderNextPiece()}</div>
        <h2 className="opponent-title">{opponent}</h2>
        <div className="opponent-container">{renderOpponentGrid()}</div>
        <div className="opponentGame-balls">{renderOpponentScoreBall()}</div>
      </div>
    </>
  );
};

export default Tetris;
