/*-----------------------------------------------------------------------------------------
  startMQTT_rb.js.
  MQTT connection to RI Guru with Node.js for JS apps
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/

var clientID = Math.random().toString(16).substr(2, 8);
var cellID;

console.log('Unique Client ID is '+ clientID);

var mqtt    = require('mqtt');
var cbor	= require('cbor');

var pubMsg = new Map();
var encodedMsg;
var adminChannel = 'admin/cell/cellinfo/info/1';

var options = {
	clientId: 'js' + clientID
};
 
var client  = mqtt.connect('mqtt://localhost:8080', options);

client.on('connect', function () {
	
//Finding cellID	
 client.subscribe(adminChannel, {qos: 2});
 client.unsubscribe(adminChannel);
 
 client.subscribe('+/+/' + clientID + '/#', {qos: 2});
 
});

client.on('message', function (topic, message) {
	var cborMsg = cbor.decode(message);
	 if (adminChannel == topic) { //registering cellID
		cellID = cborMsg.toString().substr(cborMsg.toString().length - 8);
		console.log('CellID: ', cellID);
		
		pubMsg.set('view', 'Browser');
		var encodedMsg = cbor.encode(pubMsg);
		client.publish(clientID + '/' + cellID + '/GURUBROWSER/subscribe/1', encodedMsg);
	} else {
		console.log(cbor.decodeAllSync(message));
	};
  if (message.toString()=="end") {
	 client.unsubscribe('+/+/' + clientID + '/#');
	client.end();
  }
  console.log(topic.toString() + "\n" + 'Cbor decode: ', cborMsg);
});

client.on('error', function(err) {
	console.log("Error: " + err.toString());
});
