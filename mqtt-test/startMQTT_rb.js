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
pubMsg.set('view', 'Browser');
encodedMsg = cbor.encode(pubMsg);

var options = {
	clientId: 'js' + clientID
	};
 
var client  = mqtt.connect('mqtt://192.168.1.159:8080', options);

client.on('connect', function () {
 client.subscribe('+/+/' + clientID + '/#');
 client.publish(clientID + '/X007E0X2/GURUBROWSER/subscribe/1', encodedMsg);
});
console.log(clientID + '/X007E0X2/GURUBROWSER/subscribe/1', encodedMsg)
client.on('error', function(err) {
	console.log("Error: " + err.toString());
});

client.on('message', function (topic, message) {
  // message is Buffer
  var flag = topic.toString();
  flag = flag.substr(flag.length - 30);
  if (flag=="/whiteboard/createSubscriber/1") {
	cellID = topic.toString();
	cellID = cellID.substr(9,8);
	topic = clientID+"/"+cellID + '/whiteboard/createSubscriber/1';
	console.log('Publish to '+ clientID+"/"+cellID + '/whiteboard/createSubscriber/1');
	client.publish(topic,cbor.encode('@dviewJTranscript'),{qos:2});
  }
  if (topic.toString()=="admin/cell/cellinfo/info/1") {
	cellID = message.toString();
	cellID = cellID.substr(cellID.length - 8);
	topic = clientID+"/"+cellID + '/whiteboard/createSubscriber/1';
	client.subscribe(topic);
	console.log('NOW Subscribed to '+ clientID+"/"+cellID + '/whiteboard/createSubscriber/1');
	client.publish(cbor.encode('@dviewJTranscript'));
  }
  if (message.toString()=="end") {
	client.end();
  }
  console.log(topic.toString() + "\n" + message.toString());
});
