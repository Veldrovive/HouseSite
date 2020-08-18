const PORT = 3006

import path from 'path';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import express from 'express';
import http from "http"
import Connection from './connection.js';
import Database from './db.js';
import WebSocket from "ws";
const { Server: WebSocketServer } = WebSocket;

async function main() {
    const app = express();
    const server = http.createServer(app);
    app.use(history());
    app.use(express.static("./dist"));
    app.use(express.json());
    app.use(cors());

    const db = await Database.setup();
    if (!db) {
        console.log("Failed to get database");
        return;
    }

    var wss = new WebSocketServer({server: server, path: "/api/ws"});

    server.listen(PORT);

    const registeredUsers = {};

    wss.on("connection", ws => {
        new Connection(ws, db, registeredUsers);
    })
}

main();