import { io } from "socket.io-client";
const socket = io("http://172.16.101.9:5000");
export default socket;
