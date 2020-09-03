const PORT = 3006

import path from 'path';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import express from 'express';
import http from "http"
import Connection from './connection.mjs';
import Watcher from './dbWatcher.mjs';
import Database from './db.mjs';
import SocketIo from "socket.io";

async function main() {
    const app = express();
    const server = http.createServer(app);
    const io = SocketIo(server);
    app.use(history());
    app.use(express.static("./dist"));
    app.use(express.json());
    app.use(cors());

    const db = await Database.setup();
    if (!db) {
        console.log("Failed to get database");
        return;
    }

    server.listen(PORT);

    const registeredUsers = {};

    new Watcher(db, registeredUsers);
    io.on("connection", socket => {
        new Connection(socket, db, registeredUsers);
    })
}

main();