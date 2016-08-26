/*-----------------------------------------------------------------------------------------
  startMQTT.js.
  MQTT connection to RI Guru with Node.js for JS apps
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/

var mqtt    = require('mqtt');
var cbor		= require('cbor');
var options = {
	clientId: 'js' + Math.random().toString(16).substr(2, 8)
	};

var client  = mqtt.connect('mqtt://localhost', options);

client.on('connect', function () {
  client.subscribe('admin/cell/#');
  console.log('subscribe to admin/cell/#');
  client.publish('admin/cell/cellinfo/info/1',cbor.encode('iadminInfofcellIdHX0M17536'));
  console.log('publish message:'+ cbor.encode('iadminInfofcellIdHX0M17536'));
});

client.on('error', function(err) {
	console.log("Error: " + err.toString());
});

client.on('message', function (topic, message) {
  // message is Buffer
  if (message.toString()=="end") {
	client.end();
  }
  console.log(message.toString());
});
