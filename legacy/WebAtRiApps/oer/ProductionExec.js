/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo*/ //for jslint

/**-----------------------------------------------------------------------------------------
  ProductionExec.js 
  This is the main functionality for the production test executive (ProducionExec) application. 
  
  5/17/2012 oer, rjb
  ------------------------------------------------------------------------------------------
*/

var ri = ri || {};    //namespace for the ri module

/**module definition*/
ri.prodexec = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //------------------------
  var emitStatus = riutil.emitStatus;
  
  //Closure local variables:
  //------------------------
  var smChannel=null;
  var webSkt=null;
  
  //Closure method definitions:
  //---------------------------

  /**Called when html button is pressed*/
  var doStartLot = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doBeginStep = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doPause = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doEndStep = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doPrint = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doCloseLot = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doFirstTest = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doRetest = function(which) {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doQaTest = function() {
    //TODO
  };
  
  /**Called when html button is pressed*/
  var doQaRetest = function() {
    //TODO
  };

  /**private: Called for each SM, given the value for sm.MSGS*/
  var handleSmMsg = function(msgs) {
    //TODO  
  };
  
  /**private: Called upon to process each sm that is received*/
  var receiveAnSm = function(sm) {
    if(!sm) { return; } //nothing to do
    if(sm.CHANNEL !== smChannel) { return; } //skip messages not directed to this application
    if(!sm.MSGS) { return; } //nothing to do
    handleSmMsg(sm.MSGS);
  };
  
  /**Act on received message. It may be a single SM or a whole list of them. 
   * This is the function called when a message comes in via websocket
   * */
  var receiveMessages = function(msgs) {
    var ndx, val; //local vars
    if(!msgs) { return; } //nothing to do
    val = riri.convertSmToObject(msgs); //returns a javascript object whether the given message is json or raw sm
    if(val instanceof Array) { //is a list of sm
      //for(ndx in val) {
      var len = val.length;
      for(ndx=0; ndx<len; ndx++) {
        receiveAnSm(val[ndx]);
      }
    }
    else { receiveAnSm(val); } //is a single sm
  };
  
  /**Called to update the monitored SM channel.
   * If given a value for the channel it uses that, 
   * otherwise looks for an html element called 'mySmChannel' and uses that*/
  var setSmChannel = function(mySmChannel) {
    if(!mySmChannel) {
      var elem = document.getElementById('mySmChannel');
      if(elem) { mySmChannel=elem.value; }
    }
    smChannel = mySmChannel;
    emitStatus('SM channel set to "'+smChannel+'"');
  };
  
  /**private: Finalize (close down) this module.*/
  var doFinalize = function() {
    if(typeof ri.websocket.open !== 'undefined') { //if function exists, then close down web sockets
      if(typeof webSkt !== 'undefined' && !webSkt) {
        webSkt = ri.websocket.close(webSkt); //close any open web sockets
        webSkt = null;
      }
    }
  };

  /**Initialize module. Mainly communications: Websockets*/
  var doInit = function() {
    var smChannelDiv;  //local vars

    smChannel = 'pe_'+riutil.getGuruTimenow(true); //make up a unique SM channel name 
    //smChannel = 'aaa'; //DEBUG
  
    doFinalize(); //close down any previous in case this is a re-init
  
    //Initialize the SM channel display (debug). This is so that user can change the SM channel:
    smChannelDiv = document.getElementById('mySmChannel');
    if(smChannelDiv) {
      smChannelDiv.value=smChannel;
    }
    
    if(typeof ri.websocket.open !== 'undefined') { //if function exists, then init for web sockets
      //webSkt = ri.websocket.open('ws://localhost:7501/guru/rawsm', receiveMessages); //open and set up the websocket (raw SM messages)
      webSkt = ri.websocket.open('ws://localhost:7501/guru/sm', receiveMessages); //open and set up the websocket (SM as json)
      
      if(webSkt) { emitStatus('Websockets enabled'); } //debug
    }
    
    if(!webSkt) {
      emitStatus('This app is disabled because Websockets are not available.'); //debug
    }
  };
  
  //Accessors:
  var getSmChannel = function() { return smChannel; };
  var getWebSkt = function() { return webSkt; };
  

  /*---------------
   *closure return:
   *---------------*/
  return {

    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    //button presses:
    doStartLot: doStartLot,
    doBeginStep: doBeginStep,
    doPause: doPause,
    doEndStep: doEndStep,
    doPrint: doPrint,
    doCloseLot: doCloseLot,
    doFirstTest: doFirstTest,
    doRetest: doRetest,
    doQaTest: doQaTest,
    doQaRetest: doQaRetest,
    
    getSmChannel: getSmChannel,
    getWebSkt: getWebSkt, 
    
    setSmChannel: setSmChannel,
    receiveMessages: receiveMessages,
    doInit: doInit
  }; //closure return
  
}()); //namespace smparse

/**ON LOAD*/
window.onload=ri.prodexec.doInit; 
