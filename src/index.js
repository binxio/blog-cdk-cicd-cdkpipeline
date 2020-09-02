'use strict';

const express = require('express');
const { createHttpTerminator } = require('http-terminator');

// Constants
const PORT = process.env.PORT || 8080;

// App
const app = express();
app.get('/', (req, res) => {
    console.log(`received request.`);
    res.send('Hello World');
});

app.get('/_health', (req, res) => {
    console.log(`received health check.`);
    res.sendStatus(200);
})

const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

// Graceful app shutdown
const serverTerminator = createHttpTerminator({
    server: server,
});

const shutdown = async (signal) => {
    console.log(`Closing server by ${signal}`);
    await serverTerminator.terminate();
};

process.on('SIGHUP', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);