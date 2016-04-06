var express = require("express");
var app = express();
var server = require("http").Server(app);
var db = require("./db");
require("./websocket")(server);
require("./leader");

console.log("Starting Canary Microservice");

app.use(express.static("www"));

server.listen(8036);
