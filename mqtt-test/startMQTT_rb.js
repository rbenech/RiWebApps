/*-----------------------------------------------------------------------------------------
  startMQTT.js.
  MQTT connection to RI Guru with Node.js for JS apps
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/
var clientID = Math.random().toString(16).substr(2, 8);
console.log('Unique Client ID is '+ clientID);

var mqtt    = require('mqtt');
var cbor	= require('cbor');
var options = {
	clientId: 'js' + clientID
	};

var client  = mqtt.connect('mqtt://localhost', options);

client.on('connect', function () {
 // client.subscribe(clientID+'//cellinfo/#');
 client.subscribe('admin/#');
 // client.subscribe(clientID +'/X0M17536/whiteboard/createSubscriber/1',{qos:2});
 // client2.subscribe(clientID +'/whiteboard/createSubscriber/1',{qos:2});
 // client.subscribe('////createSubscriber/1');
 // client.subscribe('///whiteboard/createSubscriber/1');
  //client.subscribe('updateGuru/#');
 //client.publish('admin/cell/cellinfo/info/1',cbor.encode('iadminInfofcellIdHX0M17536'));
  //console.log('publish message:'+ cbor.encode('iadminInfofcellIdHX0M17536'));
 // '+/+/whiteboard/#', QOS 2
 // '+/+/whiteboard/createSubscriber/1' --> first token to subscribe /8/subscribe
 // 'reply address / cell id / channel / api / messageID'... 'view=config'
//	'unique string made from me'
//	'cellid = ' subscribe ''
 // 'listed to messages that are objects'
 // 
});

client.on('error', function(err) {
	console.log("Error: " + err.toString());
});


client.on('message', function (topic, message) {
  // message is Buffer
  if (topic.toString()=="admin/cell/cellinfo/info/1") {
	var cellID = message.toString();
	cellID = cellID.substr(cellID.length - 8);
	client.subscribe(clientID+"/"+cellID + '/whiteboard/createSubscriber/1');
	console.log('Subscribed to '+ clientID+"/"+cellID + '/whiteboard/createSubscriber/1');
  }
  if (message.toString()=="end") {
	client.end();
  }
  console.log(topic.toString() + "\n" + message.toString());
});
