var fs = require('fs');
var express = require('express')
var browserify = require('browserify-middleware')

require('dotenv').config();

var app = express();
var https = require('https')
//var http = require('http')

// var privateKey = fs.readFileSync(__dirname + '/certs/privkey.pem', 'utf8');
// var certificate = fs.readFileSync(__dirname + '/certs/fullchain.pem', 'utf8');
var privateKey = fs.readFileSync(__dirname + '/certs/localhost-key.pem', 'utf8');
var certificate = fs.readFileSync(__dirname + '/certs/localhost.pem', 'utf8');

var credentials = {
  key: privateKey,
  cert: certificate
}

var twilio = require('twilio')

if (process.env.TWILIO_SID) {
  var TWILIO_SID = process.env.TWILIO_SID;
  var TWILIO_AUTH = process.env.TWILIO_AUTH;

  var client = new twilio(TWILIO_SID, TWILIO_AUTH);
  var portNumber = process.env.PORT;

  //demo for testing streaming
  app.get('/multipeer.js', browserify(__dirname + '/public/lib/multipeer.js'));

  var httpsServer = https.createServer(credentials, app);
  var io = require('socket.io')(httpsServer);


  //crear un servidor en puerto 8000
  httpsServer.listen(portNumber, () => {
    //print the ip address on the console
    //console.log("server available in https://"+myip.getLocalIP4()+":8000")
    console.log("listening here at port " + portNumber);
  });



  //data structures for storing persistent user ids.
  //connected clients should use uuid (rather than socket id) for identifying a user

  //look up uuid by entiring socket id
  var userFromSocket = {}

  //lookup socket id by entering uuid
  var socketFromUser = {}


  //new connection to websocket server
  io.on('connection', function (socket) {
    console.log("new connection", socket.id)

    var thisRoom = null

    socket.on('join', function (room, _userData) {
      thisRoom = room

      console.log("user", JSON.stringify(_userData))
      if (_userData.uuid) {
        userFromSocket[socket.id] = _userData.uuid
        socketFromUser[_userData.uuid] = socket.id
      } else {
        console.log("no user data!")
      }
      // Get the list of peers in the room
      var peers = io.nsps['/'].adapter.rooms[room] ?
        Object.keys(io.nsps['/'].adapter.rooms[room].sockets) : []

      io.of('/').in(room).clients(function (error, clients) {
        if (error) throw error;
        console.log("clients error!")
        console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
      });

      var peerUuids = peers.map(function (socketId) {
        return userFromSocket[socketId]
      })
      // only use twilio if available
      //------twilio confusions
      //console.log(client)
      if (process.env.TWILIO_SID) {
        client.api.accounts(TWILIO_SID).tokens
          .create({})
          .then((token) => {
            // console.log(client)
            // console.log(token.iceServers)
            // socket.emit('servers', socket.id, token.iceServers)
            socket.emit('ready', socket.id, peerUuids, token.iceServers)


            // And then add the client to the room
            socket.join(room);

            //send updated list of peers to all clients in room
            // io.sockets.emit('peers', peerUuids);
            socket.to(thisRoom).emit('new peer', _userData.uuid)
          })
      } else {
        socket.emit('ready', socket.id, peerUuids)
        // And then add the client to the room
        socket.join(room);

        //send updated list of peers to all clients in room
        // io.sockets.emit('peers', peerUuids);
        socket.to(thisRoom).emit('new peer', _userData.uuid)
      }
      // -----------twilio confusions ends

      // Send them to the client
      //  socket.emit('ready', socket.id, peerUuids)


    });
    // client can request updated list of peers
    socket.on("getPeers", function (data) {
      var peers = io.nsps["/"].adapter.rooms[thisRoom] ?
        Object.keys(io.nsps["/"].adapter.rooms[thisRoom].sockets) : [];

      var peerUuids = peers.map(function (socketId) {
        return userFromSocket[socketId];
      });

      socket.emit("peers", peerUuids);
    });

    socket.on('broadcast', function (data) {
      // io.sockets.emit('broadcast', data)
      console.log("broadcasting", data, socket.room)
      //  io.sockets.in(socket.room).emit('broadcast', data)
      socket.to(thisRoom).emit('broadcast', data)

    });

    socket.on('signal', function (data) {
      //console.log("forwarding signal " + JSON.stringify(data))
      var client = io.sockets.connected[socketFromUser[data.id]];
      client && client.emit('signal', {
        id: userFromSocket[socket.id],
        label: socket.label,
        signal: data.signal,
      });
    });


  });


  app.use(express.static('public'))
};