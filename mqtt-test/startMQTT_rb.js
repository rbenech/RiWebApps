/*-----------------------------------------------------------------------------------------
  startMQTT_rb.js.
  MQTT connection to RI Guru with Node.js for JS apps
  08/25/16 Ryan Benech
  ------------------------------------------------------------------------------------------
*/
var mqtt    = require('mqtt');
var cbor	= require('cbor');

var clientID = Math.random().toString(16).substr(2, 8);  //aka session ID
var cellID;  //set by the GuruServer connected to the MQTT broker
var mqttBroker = 'ws://192.168.1.113:8080';  // websocket port (ws)

var mqttConnectOptions = {
	clientId: 'js' + clientID //MQTT ID is "js" plus clientID
	//rejectUnauthorized: false	//false for self-signed certificates, true in production
	}; 
	

console.log('ClientID = '+ clientID + ' (Unique at each run!)');

var pubMsg = new Map();
var encodedMsg;
var adminChannel = 'admin/cell/cellinfo/info/1';

var client  = mqtt.connect(mqttBroker, mqttConnectOptions);

//Finding cellID
client.on('connect', function () {
	client.subscribe(adminChannel, {qos: 2});
	client.unsubscribe(adminChannel);
	client.subscribe('+/+/' + clientID + '/#', {qos: 2});
	});

//'walks object and calls function
function traverse(o,func) {
    for (var i in o) {
        if (typeof(o[i])=== "undefined") { func.apply(o[i]); }
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            traverse(o[i],func);
        }
    }
};

//Main MQTT Parsing loop
client.on('message', function (topic, message) {
	var cborMsg = cbor.decode(message);

	 if (adminChannel == topic) { //registering cellID
		cellID = cborMsg[3];  //cellID
		console.log('CellID: ', cellID);

		pubMsg.set('view', 'Browser');
		encodedMsg = cbor.encode(pubMsg);
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
