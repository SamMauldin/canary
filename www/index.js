var canaryApp = angular.module("canaryApp", ["ngAnimate"]);

var socket = io.connect();

canaryApp.controller("CanaryController", function($scope) {
  $scope.currentPage = "init";

  $scope.user = {
    username: "",
    password: "",
    room: null
  };

  $scope.user.login = function() {
    socket.emit("login", $scope.user.username, $scope.user.password);
  };

  $scope.user.formValid = function() {
    return !($scope.user.username && $scope.user.password);
  };

  $scope.pressIt = function() {
    $scope.currentPage = "joinWait";
    socket.emit("newRoom");
  };

  $scope.getTitle = function() {
    if ($scope.user.room) {
      return "Canary | " + $scope.user.room.substring(0, 8);
    } else {
      return "Canary | The New Robin";
    }
  };

  $scope.abandon = function() {
    socket.emit("abandon");
  };

  $scope.chat = {
    messages: [],
    message: ""
  };

  for (var i = 0; i < 1000; i++) {
    $scope.chat.messages.push(i);
  }

  $scope.chat.formValid = function() {
    return $scope.chat.message.length < 1;
  }

  $scope.chat.sendMessage = function() {
    socket.emit("chat", $scope.chat.message);
    $scope.chat.message = "";
  };

  function loggedIn(name, room) {
    $scope.user.room = room;
    $scope.currentPage = room ? "chat" : "button";
    $scope.$apply();
  }

  socket.on("err", function(err) {
    console.log(err);
    UIkit.modal.alert(err);
  });

  socket.on("login", function(id, name, room) {
    localStorage["user"] = id;
    loggedIn(name, room);
  });

  socket.on("newRoom", function(room) {
    $scope.user.room = room;
    $scope.currentPage = room ? "chat" : "button";
    $scope.$apply();
  });

  socket.on("connect", function() {
    if ($scope.currentPage == "init") {
      if (localStorage["user"]) {
        socket.emit("verify", localStorage["user"]);
      } else {
        $scope.currentPage = "account";
        $scope.$apply();
      }
    } else {
      socket.emit("verify", localStorage["user"]);
    }
  });

  socket.on("verify", function(id, name, room) {
    if (id) {
        loggedIn(name, room);
    } else {
      delete localStorage["user"];
      $scope.currentPage = "account";
      $scope.$apply();
    }
  });

  socket.on("disconnect", function() {
    $scope.currentPage = "disconnected";
    $scope.$apply();
  });
});
