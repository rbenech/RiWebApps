/*-----------------------------------------------------------------------------------------
  startMQTT.js. 
  RI JS apps using MQTT connection to Guru (vs SM) with NodeJS
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/


var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://localhost:1883');

//Emit error if can't connect
client.on('error', function(error) {
  console.log('Client not connected.');
});

// Create a client connection
client.on('connect', function () {
  client.subscribe('admin');
});


// subscribe to a topic

client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString());
  client.end();
});