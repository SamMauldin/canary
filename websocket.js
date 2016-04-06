var validator = require("validator");
var r = require("./db");

module.exports = function(server) {
  var io = require("socket.io")(server);
  io.on("connection", function(socket) {
    var user = null;
    var event = false;
    var connected = true;

    socket.on("login", function(username, pass) {
      r.login(username, pass, function(res, err) {
        if (err) {
          socket.emit("err", err);
        } else {
          user = res;
          socket.emit("login", res.id, res.username, res.currentRoom);
          registerEvent();
        }
      });
    });

    socket.on("verify", function(id) {
      r.getUserFromID(id, function(res, err) {
        if (err) {
          console.log(err);
          socket.emit("err", err);
        } else {
          if (res) {
            user = res;
            socket.emit("verify", res.id, res.username, res.currentRoom);
            registerEvent();
          } else {
            socket.emit("verify", null);
          }
        }
      });
    })

    socket.on("abandon", function() {
      if (user) {
        user.currentRoom = null;
        r.saveUser(user, function(res, err) {
          if (err) {
            socket.emit("err", err);
          } else {
            socket.emit("newRoom", null);
          }
        });
      }
    });

    socket.on("newRoom", function() {
      if (user && !user.currentRoom) {
        r.newRoom(function(room, err) {
          if (err) {
            socket.emit("err", err);
          } else {
            user.currentRoom = room;
            r.saveUser(user, function(res, err) {
              if (err) {
                socket.emit("err", err);
              } else {
                socket.emit("newRoom", room);
                registerEvent();
              }
            });
          }
        });
      }
    });

    socket.on("chat", function(msg) {
      if (user && user.currentRoom) {
        r.sendMessage(user, msg, function(res, err) {
          if (err) {
            socket.emit("err", err);
          }
        });
      }
    });

    var registerEvent = function() {
      if (connected && !event && user.currentRoom) {
        event = true;
        r.events.once("message", function(msg) {
          event = false;
          registerEvent();
          if (msg.room == user.currentRoom) {
            socket.emit("chat", msg.from, msg.message);
          }
        });
      }
    };

    socket.on("disconnect", function() {
      connected = false;
    });

  });
};
