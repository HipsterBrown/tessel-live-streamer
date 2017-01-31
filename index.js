var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var os = require('os');
var path = require('path');
var Five = require('johnny-five');
var tesselIO = require('tessel-io');
var port = 8080;

var av = require('tessel-av');


/*
  Todo

 - add johnny-five controls for buttons to turn on the server and camera with led feedback
 - add LCD support for better visual feedback on status of the camera / server
 - maybe mount the camera on a servo to control the direction of the camera via toggle or buttons?
*/

server.listen(port, function () {
  console.log(`http://${os.hostname()}.local:${port}`);
});

app.use(express.static(path.join(__dirname, '/public')));

io.on('connection', (socket) => {
  var camera = new av.Camera({
    width: 640,
    height: 480
  });

  socket.on('ready', () => camera.stream());
  camera.on('data', (data) => {
    socket.emit('image', data.toString('base64'));
  });
});

process.on("SIGINT", _ => server.close());
