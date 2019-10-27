var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server); var os = require('os');
var path = require('path');
var Five = require('johnny-five');
var tesselIO = require('tessel-io');
var port = 80;

var av = require('tessel-av');
var camera = new av.Camera({
  fps: 60
});

var dgram = require('dgram');
var exec = require('child_process').execSync;

try {
  exec('route add -net 224.0.0.0/4 dev wlan0');
} catch (error) {
  console.error(error);
}

var PORT = 33333;
var MULTICAST_ADDRESS = '239.10.10.100';

var pub = dgram.createSocket('udp4');

pub.bind(PORT, () => {
  pub.setBroadcast(true);
  pub.setMulticastTTL(128);

  try {
    pub.addMembership(MULTICAST_ADDRESS);
  } catch (error) {
    console.error(error);
  }
});

/*
  Todo

 - add johnny-five controls for buttons to turn on the server and camera with led feedback
 - add LCD support for better visual feedback on status of the camera / server
 - maybe mount the camera on a servo to control the direction of the camera via toggle or buttons?
*/

app.use(express.static(path.join(__dirname, '/public')));
app.get('/stream', (request, response) => {
  response.redirect(camera.url);
});

server.listen(port, function () {
  console.log(`http://${os.hostname()}.local:${port}`);
});

io.on('connection', (socket) => {
  var data = JSON.stringify({
    action: "request",
    device: os.hostname(),
    event: "weather",
  });

  socket.on("weather", function() { 
    pub.send(new Buffer(data), 0, data.length, PORT, MULTICAST_ADDRESS);
  });

  pub.on('message', (message, remote) => {
    console.log('Message Received!');
    console.log(`From ${remote.address}:${remote.port}`);

    var data = JSON.parse(message);
    if (data.action === "response" && data.device !== os.hostname()) {
      console.log(data.content.reverse());
      socket.emit("response", data.content.reverse());
    }
  });
});

process.on("SIGINT", _ => server.close());
