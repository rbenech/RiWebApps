/**-----------------------------------------------------------------------------------------
  startMQTT.js. 
  RI JS apps using MQTT connection to Guru (vs SM) with NodeJS
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/

var GuruServer = '192.168.1.143';

var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt:'+ GuruServer);
 
client.on('connect', function () {
  client.subscribe('presence');
  client.publish('presence', 'Hello mqtt');
});
 
client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString());
  client.end();
});