var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


function onSockMsg(msg, user, sockID) {
    if (!user.authenticated) {
        io.sockets.connected[sockID].emit('error', '{ error: "not authenticated" }');
    } else {
        if (msg.type === "channel") {
            io.emit('chat message', user.name + " said: " + msg.content);
            console.log('message: ' + msg.content);
        }
    }
}



function onIOConnect(socket) {
  var user = { name: "Anonymous", authenticated: true };

  function onSockDisconnect() {
    console.log('user disconnected');
  }

  function onSockAuth(msg) {
    user.authenticated = true;
  }

  console.log('a user connected');
  socket.on('chat message', function(msg) { onSockMsg(msg, user, socket.id); });
  socket.on('authenticate', onSockAuth);
  socket.on('disconnect', onSockDisconnect);
}

io.on('connection', onIOConnect);

http.listen(3000, function() {
    console.log('listening on *:3000');
});
