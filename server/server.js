var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


var users = {};
var rooms = {};

function onSockMsg(msg, user, callback) {
    if (!'authenticated' in user) {
        if (callback) callback({status: "failed", message: "User not authenticated"});
        console.log("Trying to check authentication on an invalid user object.");
        return;
    }

    if (user.authenticated === false) {
        user.socket.emit('error', '{ error: "not authenticated" }');
    } else {
        if (msg.type === "channel") {
            io.sockets.emit('chat message', user.name + " said: " + msg.content);
            console.log('message: ' + msg.content);
        }
    }
}

function onSockDisconnect(socket, user) {
    if (user.name && user.name in users) {
        console.log(user.name + ' disconnected');
        delete users[user.name];
    } else {
        console.log('unauthenticated user disconnected');
    }
}

function getUserList() {
    var retArr = [];
    for (var name in users) {
        retArr.push(name);
    }
    return retArr;
}

function onSockAuth(socket, user, msg, callback) {
    var status = { status: "failed", message: "Unknown" };

    var name = "";
    var token = "";
    if (msg.name) name = msg.name;
    else {
        console.log("Name not provided");
        status.message = "Name not provided during authentication.";
        callback(status);
        return;
    }

    if (msg.token) token = msg.token;
    else {
        console.log("token not provided");
        status.message = "Authentication token not provided during authentication.";
        callback(status);
        return;
    }

    if (name in users) {
        status.status = failed;
        console.log("user already auth");
        status.message = "User already authenticated";
    } else {
        if(token === "password") {
            user.authenticated = true;
            user.socket = socket;
            user.name = msg.name;
            users[user.name] = user;
            status.status = true;
            status.message = "Authenication Successful";
            console.log("auth succ! users:" + getUserList());
        } else {
            status.message = "Invalid username or password";
            console.log("invalid user name/token " + name + " : " + token);
        }
    }
    if (callback) {
         callback(status);
    }
    return;
}


function onIOConnect(socket) {
  var user = { name: "", authenticated: false };

  console.log('user connected');
  socket.on('chat message', function(msg) { onSockMsg(msg, user, socket.id); });
  socket.on('authenticate', function(msg, cb) { onSockAuth(socket, user, msg, cb); } );
  socket.on('disconnect', function(msg) { onSockDisconnect(socket, user); }) ;
}

io.on('connection', onIOConnect);

http.listen(3000, function() {
    console.log('listening on *:3000');
});
