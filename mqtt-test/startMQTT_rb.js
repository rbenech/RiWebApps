/*-----------------------------------------------------------------------------------------
  startMQTT_rb.js.
  MQTT connection to RI Guru with Node.js for JS rTalkApps
  Supported Apps: GURUBROWSER
  Joseph Theberge & Ryan Benech
  08/25/16 early alpha
  3/6/16 cbor tagging
  ------------------------------------------------------------------------------------------
*/
const mqtt    = require('mqtt');
const cbor	= require('borc');
var assert  = require('assert');

const decoder = new cbor.Decoder({
	tags: {
	  19: (val) => val
	}
})

//identifications
const clientID = "JS" + Math.random().toString(16).substr(2, 6);  //aka mqtt session ID, Return Address (ra)
const ra = clientID; //set return adress to client ID
var cellID;  //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)
const mqttBroker = 'ws://localhost:8080';  // websocket port (ws) (init by rTalkDistribution/moquette/bin/moquette.sh)
//
//class omapCbor_createSub {
//	constructor () {
//		this.fun = 'createSubscriber';
//		this.msgkey = 'className';
//		this.msgval = 'RiRmtViewGuru';
//	}
//	encodeCBOR (encoder) {
//		const cbor_createSub = new Tagged(211, [this.fun, this.msgkey, this.msgval]);
//		const cbor_viewDef = new Tagged(211, ['viewDef', 'view', 'Browser']);
//		var buffer;
//		buffer = encoder.pushAny(cbor_createSub);
//		buffer = encoder.pushAny(cbor_viewDef);
//		return buffer;
//	}
//};

//var createSubMsgTagged = new omapCbor_createSub();

const mqttConnectOptions = {
	clientId: "mqtt-" + clientID //MQTT ID is "mqtt-" plus clientID
	//rejectUnauthorized: false	//false for self-signed certificates, true in production
	}; 

console.info('Client ID: '+ clientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

const adminTopic = 'admin/+/cellinfo/info/#';  //only used to discover cellID
var appSubscribeTopic = 'GURUBROWSER/' + ra + '/createSubscriber/1';  //vars updated after cellID discovered
var GURUBROWSER_App_Topics = ['GURUBROWSER/' + ra + '/whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
var appWbTopic = clientID + '/GURUBROWSER/subscribe/1';
/*
//Maps to cbor
var createSubMap = new Map();
createSubMap.set('createSubscriber',null);
createSubMap.set('className','RiRmtViewGuru');
var viewDefMap = new Map();
viewDefMap.set('viewDef',null);
viewDefMap.set('view','Browser');
const createSubscriberMsg = cbor.encode(new cbor.Tagged(211,[createSubMap,viewDefMap]));
const viewDefMsg = cbor.encode(new cbor.Tagged(211,viewDefMap)); //decimal 211 = 0xD3 (Omap cbor tag)
*/


/*
//buffer to cbor
var buffer = new Buffer();
cont createSubAction = cbor.encode(new cbor.Tagged(19,'createSubscriber'));
const createSubBody = cbor.encode(['className','RiRmtViewGuru']);
Buffer.from(createSubscriberMsg)
Buffer.from(createSubscriberMsg)
const createSubscriberMsg
const viewDefMsg = cbor.encode(new cbor.Tagged(211,'viewDef','view','Browser')); //decimal 211 = 0xD3 (Omap cbor tag)
*/

//array to cbor
const createSubscriberMsg = cbor.encode([new cbor.Tagged(19,'createSubscriber'),'className','RiRmtViewGuru',new cbor.Tagged(19,'viewDef'),'view','Browser']);
const viewDefMsg = cbor.encode([new cbor.Tagged(19,'viewDef'),'view','Browser']); //decimal 211 = 0xD3 (Omap cbor tag)

var store = {};  //react JSON
const client  = mqtt.connect(mqttBroker, mqttConnectOptions);
var storeMap = new Map();

function storeMsg(store, decodedCbor) {
	var msgObj = {};
	
	//Assigns keys and values through arrays passed in decodedCbor
	for (var array = 0; array < decodedCbor.length; array++) {
		for (var i = 2; i < decodedCbor[array].length; i=i+2) {
			msgObj[decodedCbor[array][1]] = decodedCbor[array][1]; //toppane, subpane, etc.
			msgObj[decodedCbor[array][i]] = decodedCbor[array][i+1];
		}
		if (store[decodedCbor[array][1]] != decodedCbor[array][1]) {
			store[decodedCbor[array][1]] = msgObj;
		}
		//else store[array] = 
		store[array] = msgObj;
		msgObj = {};
		//console.log("Continuing to new array, msgObj so far: ", msgObj);
	}
	console.log("Store: ", store); //Note: Chrome inspector sorts elements alphabetically when viewing console, not by order received							
}

// MQTT Connect sequence - adminTopic - appTopic
client.on('connect', function () {
	console.log('Subscribing to admin topic: '+ adminTopic);
	client.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive cellID then UNSUBSCRIBE
});


//Main MQTT Parsing loop
client.on('message', function (topic, message) {
	var cborMsg;
	try {
		cborMsg = decoder.decodeAll(message); //decode = cbor with custom tag support;
		}
	catch(err) {
	  console.error("Error CBOR Decoding message:", err);
	}
	console.info('Message Received - \nTopic: ' + topic.toString() + '\n' + 'CBOR Decoded Message: ', cborMsg);
	//console.log('RAW CBOR Message: ', message);
	
	//cell registration
	if (topic.includes("admin/") && (cborMsg !== null) ) {
		//REGISTERING CELLID
		if ( cborMsg[0][1] == "cellId") {
			//multiple admin messages could be received
			cellID = cborMsg[0][2];
			console.info('CellID: ', cellID);
			//UNSUBSCRIBE
			console.log('Unsubscribing from: ' +adminTopic);
			client.unsubscribe(adminTopic);
			//SUBSCRIBE
			GURUBROWSER_App_Topics = ['#','GURUBROWSER/' + cellID + '/whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
			console.log('Subscribing to GURUBROWSER Topics: ', GURUBROWSER_App_Topics);
			client.subscribe(GURUBROWSER_App_Topics, {qos: 2});
			//PUBLISH to App createSubscriber
			appSubscribeTopic = 'whiteboard/'+cellID +'/rtalk/app/1';
			console.log('Publishing createSubscriber: ' + cbor.decodeAll(createSubscriberMsg) + '\n'+'To Topic: ' + appSubscribeTopic);		
			client.publish(appSubscribeTopic,createSubscriberMsg);  //send createSubMsg to register this JS_App
			console.log("createSub cbor:" + createSubscriberMsg);
			console.log("createSub decoded:" + cbor.decode(createSubscriberMsg));
			}
		
		//UNSUBSCRIBE
		//console.log('Unsubscribing to: GURUBROWSER/' + clientID + '/createSubscriber/1');
		//client.unsubscribe('GURUBROWSER/' + clientID + '/createSubscriber/1');
	
	//app registration
	} else if (topic == GURUBROWSER_App_Topics[0]) {
		// rTalk message ^viewDef+view=Browser on 'GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1'
		// task: open new whiteboard (this) and send registration message ^viewDef+view=Browser to GURUBROWSER/whiteboard/createSubscriber/1
		console.log('Looking for "viewDef" message: ' + message + '\nTo Topic: ' + GURUBROWSER_App_Topics[0]);		
		if (cborMsg[0][1] == 'viewDef') {
			// echo message to 
			console.log('Forwarding subscription requiest: ' + message + '\nTo Topic: ' + GURUBROWSER_App_Topics[1]);		
			client.publish(GURUBROWSER_App_Topics[1], message);
			console.log('Compare! Valid CBOR:' + cbor.decodeAll(message) + '\nCreated CBOR: ' + cbor.decodeAll(viewDefMsg));		
		}
				
	} else if (topic.includes(clientID)) {
			console.log("Storing Message: ", storeMsg);
			storeMsg(store, cborMsg);
	}

  if (message.toString()=="end") {
	 client.unsubscribe('+/+/' + clientID + '/#');
	client.end();
  }
	
});

client.on('error', function(err) {
	console.error("Error MQTT Cleint: " + err.toString());
});

