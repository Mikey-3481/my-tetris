import React from "react";
import Tetris from "./components/Tetris";
import GameLobby from "./components/GameLobby";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Loading from "./components/Loading";
import JoinGame from "./components/JoinGame";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/tetris/:room" Component={Tetris} />
          <Route path="/" Component={GameLobby} />
          <Route path="/loading" Component={Loading} />
          <Route path="/join-game/:room" Component={JoinGame} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
