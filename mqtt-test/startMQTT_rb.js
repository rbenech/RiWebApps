/*-----------------------------------------------------------------------------------------
  startMQTT.js.
  MQTT connection to RI Guru with Node.js for JS apps
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/
var clientID = Math.random().toString(16).substr(2, 8);
var cellID;

console.log('Unique Client ID is '+ clientID);

var mqtt    = require('mqtt');
var cbor	= require('cbor');
var options = {
	clientId: 'js' + clientID
	};

var client  = mqtt.connect('mqtt://localhost:1883', options);

client.on('connect', function () {
 // client.subscribe(clientID+'//cellinfo/#');
 client.subscribe('+/+/whiteboard/#');
 //client.subscribe('admin/#'); //hacky way
 // client.subscribe(clientID +'/X0M17536/whiteboard/createSubscriber/1',{qos:2});
 // client.subscribe(clientID +'/whiteboard/createSubscriber/1',{qos:2});
 // client.subscribe('////createSubscriber/1');
 // client.subscribe('///whiteboard/createSubscriber/1');
  //client.subscribe('updateGuru/#');
 //client.publish('admin/cell/cellinfo/info/1',cbor.encode('iadminInfofcellIdHX0M17536'));
  //console.log('publish message:'+ cbor.encode('iadminInfofcellIdHX0M17536'));
 // '+/+/whiteboard/#', QOS 2
 // '%CliendID%/%CellID%/whiteboard/createSubscriber/1' --> first token to subscribe
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
  var flag = topic.toString();
  flag = flag.substr(flag.length - 30);
  if (flag=="/whiteboard/createSubscriber/1") {
	cellID = topic.toString();
	cellID = cellID.substr(9,8);
	topic = clientID+"/"+cellID + '/whiteboard/createSubscriber/1';
	client.subscribe(topic);
	console.log('NOW Subscribed to '+ clientID+"/"+cellID + '/whiteboard/createSubscriber/1');
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
