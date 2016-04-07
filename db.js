var r = require("fld-rethinkdb")([{host:"192.168.100.7"}]);
var bcrypt = require("bcrypt-nodejs");
var serverUUID = require("node-uuid")();

r.login = function(user, password, cb) {
  r.db("canary").table("accounts").filter({username: user}).run().then(function(res) {
    if (res[0]) {
      bcrypt.compare(password, res[0].password, function(err, match) {
        if (err) {
          cb(null, err);
        } else if (match == true) {
          cb(res[0]);
        } else {
          cb(null, "Wrong username or password");
        }
      });
    } else {
      bcrypt.hash(user, null, null, function(err, res) {
        if (err) {
          cb(null, err);
        } else {
          r.db("canary").table("accounts").insert({
            username: user,
            password: res
          }).run().then(function(res) {
            if (res.inserted == 1) {
              r.db("canary").table("accounts").get(res.generated_keys[0]).run().then(function(usr) {
                cb(usr);
              }).catch(function(err) {
                cb(null, err);
              });
            } else {
              cb(null, "Database error.");
            }
          }).catch(function(err) {
            cb(null, err);
          });
        }
      });
    }
  }).catch(function(err) {
    cb(null, err);
  });
};

r.getUserFromID = function(id, cb) {
  r.db("canary").table("accounts").get(id).run().then(function(usr) {
    cb(usr);
  }).catch(function(err) {
    cb(null, err);
  });
};

r.newRoom = function(cb) {
  r.db("canary").table("rooms").insert({
    created: r.now(),
    tier: 0
  }).then(function(res) {
    if (res.inserted == 1) {
      cb(res.generated_keys[0]);
    } else {
      cb(null, "Database Error");
    }
  }).catch(function(err) {
    cb(null, err);
  });
};

r.saveUser = function(user, cb) {
  r.db("canary").table("accounts").get(user.id).replace(user).run().then(function(res) {
    cb(true);
  }).catch(function(err) {
    cb(null, err)
  });
};

r.systemSendMessage = function(toRoom, msg, cb) {
  r.db("canary").table("messages").insert({
    from: "Canary-System",
    message: msg,
    created: r.now(),
    room: toRoom
  }).run().then(function(res) {
    if (res.inserted == 1) {
      cb(res.generated_keys[0]);
    } else {
      cb(null, "Database Error");
    }
  }).catch(function(err) {
    cb(null, err);
  });
};

r.sendMessage = function(user, msg, cb) {
  r.db("canary").table("messages").insert({
    from: user.username,
    fromID: user.id,
    message: msg,
    created: r.now(),
    room: user.currentRoom
  }).run().then(function(res) {
    if (res.inserted == 1) {
      cb(res.generated_keys[0]);
    } else {
      cb(null, "Database Error");
    }
  }).catch(function(err) {
    cb(null, err);
  });
};

r.events = new (require("events").EventEmitter)();
r.events.setMaxListeners(Infinity);

r.changesRecon(r.db("canary").table("messages").changes(), function(change) {
  if (change.new_val && !change.old_val) {
    r.events.emit("message", change.new_val);
  }
});


module.exports = r;
