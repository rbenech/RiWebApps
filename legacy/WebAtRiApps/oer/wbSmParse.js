/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo*/ //for jslint

/**-----------------------------------------------------------------------------------------
  wbSmParse.js 
  This handles SM parsing and message distribution for the whiteboard application.
  
  2/3/14 oer: added check for blocked pop ups (in doRtalkSubscribe)
  created 11/16/2011 oer
    ------------------------------------------------------------------------------------------
*/


/**module definition*/
var smparse = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //------------------------

  
  //Closure local variables:
  //------------------------
  
  var smChannel = 'noChannelName'; //SM channel monitored by this application
  var webSkt=null;                 //web socket used to communicate with the web server

  var initialWindowPos = { //initial position for newly created windows
      left: 10, top: 10,   
      increment: function() { //increments (and wraps) the settings
        this.left += 50;
        if(this.left > 600) { this.left=10; }
        this.top += 50;
        if(this.top > 500) { this.top=10; }
      }
  }; 
    

  
  //Closure method definitions:
  //---------------------------
    
  /**Returns a unique (time-based) sm cahnnel name*/
  var makeUpAChannelName = function() {
    return 'wb'+riutil.getGuruTimenow(true); 
  }; //function

  
  
  /**Called to open a new application and have it subscribe to the named model (e.g. transcript, code, tester, Worksheet, etc.)
   * Example initiate subscribe request for a transcript window:
   *   subscribeTo: 'view=transcript'
   *   subscribeChannel: 'transcript'
   * Example subscribe request received over SM:
   *   subscribeTo: 'view=browser'
   *   subscribeChannel: 'BP5NQ900'
   * 
   * */
  var doRtalkSubscribe = function(subscribeTo, subscribeChannel) {
    var elem, msg; //local vars

    if(!subscribeTo) { //if no value passed in then fetch it from the web page
      elem = document.getElementById('subscribeTo');
      if(elem) { subscribeTo=elem.value; } //get value from html node
    }
    else { //use the passed in value
      elem = document.getElementById('subscribeTo');
      //if(elem) { elem.value=subscribeTo; } //update html to match value used
    }

    if(!subscribeChannel) {  //if no value passed in then fetch it from the web page
      elem = document.getElementById('subscribeChannel');
      if(elem) { subscribeChannel = elem.value; } //get value from html node
    }
    else { //use the passed in value
      elem = document.getElementById('subscribeChannel');
      //if(elem) { elem.value=subscribeChannel; } //update html to match value used
    }
    
    var newSmChannel = makeUpAChannelName(); //make a channel name for the new whiteboard
    var newRootDiv = subscribeChannel+':'+subscribeTo+':'+(Math.floor(Math.random()*1000)); //make up a name for the rootDiv (traditionally 'topPane')

    //Open a new browser window (or tab):
    var newWindow;
    var features = 'toolbar=0,location=0,directories=0,status=1,menubar=0,scrollbars=0,resizable=1'; //note: turning off scrollbars forces the individual components to handle their own scrolling
    var positionNewWindows = document.getElementById('setPositionAndSize');
    
    //TODO: pass this sequence as a function into the sendSm() below, that does the above Window create. 
    //      That way it can use the info in the initial response to size the window etc before creating it (instead of 600x400).
    //      Also, eliminate 'positionNewWindows', that should just be the one true way.
    // -----------------------
    if(positionNewWindows && positionNewWindows.checked) { //if true then new browser windows are positioned and sized. If false they go where they go. 
      features += ',width=600,height=400,left='+initialWindowPos.left+',top='+initialWindowPos.top+',screenX='+initialWindowPos.left+',screenY='+initialWindowPos.top; //add in the size and position features. note: screenX/Y helps makes it work on some older browsers
      initialWindowPos.increment();
      newWindow = window.open(''/*+self.location*/, newRootDiv, features);
    }
    else { //don't set size or position
      newWindow = window.open(''/*+self.location*/, newRootDiv/*, features*/); //not setting any features helps it open as a tab instead of a window
    }
    
    if(!newWindow) { //just in case the new window was not created
      alert("Error unable to create a new Window. Are pop-ups blocked?");
      return;
    }

    var newHtml = '<html><head>'+
      '<meta charset="utf-8">'+
      '<title>Loading...</title>'+
      '<?xml version="1.0"?>'+
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">'+
      '<link type="text/css" rel="stylesheet" href="wb.css">'+
      '<link type="text/css" rel="stylesheet" href="ristring.css">'+
      '<link type="text/css" rel="stylesheet" href="css/ridojo.css">'+
      '<style type="text/css"> @import "http://ajax.googleapis.com/ajax/libs/dojo/1.6/dijit/themes/claro/claro.css"; </style>'+
      '</head><body style="claro"><div id="'+newRootDiv+'"></div></body></html>'
      ;
    
    newWindow.document.write(newHtml); //set up the new window with its root div for RtWidgets to be built on
    //newWindow.document.write('<html><head></head><body style="claro"><div id="'+newRootDiv+'"></div></body></html>'); //set up the new window with its root div for RtWidgets to be built on

    //TODO: change to dojo.publish(...add whiteboard...)
    wb.addWhiteboard(newSmChannel, newRootDiv, newWindow.document, newWindow); //add a new whiteboard monitoring the given SM channel, using the given html root DIV, and painting in the given browser document

    //newWindow.resizeTo(800, 600);
    //newWindow.moveTo(200,100);
    newWindow.focus(); //set focus on the newly created window or tab
    // -----------------------

    //Get some content for the new window by subscribing to a model:
    msg = [ 'subscribe', subscribeTo, newSmChannel ]; //note: ^subscribe ^view=transcript ^transcript
    riri.sendSm(webSkt, null, null, subscribeChannel, riri.toRiri(msg, 1)); //convert message to RIRI at separator level 1, then send
    
  }; //function doRtalkSubscribe
  
  
  /*Notes on window.open: (from: http://www.javascripter.net/faq/openinga.htm)
   * Example: myRef = window.open(''+self.location,'mywin', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0');
    
    The general syntax of the window.open() method is:
    winRef = window.open( sURL, sName [ , sFeatures [, bReplace ] ] )
      The return value, stored in the variable winRef, is the reference to your new window. You can use this reference later, for example, 
      to close this window (winRef.close()), give focus to the window (winRef.focus()) or perform other window manipulations.
      
    The parameters sURL, sName, sFeatures, bReplace have the following meaning:
      sURL:  String specifying the location of the Web page to be displayed in the new window. If you do not want to specify the location, 
             pass an empty string in sURL (this may be the case when you write some script-generated content to your new window).
      sName: String specifying the name of the new window. This name can be used in the same constructions as the frame name provided in the 
             frame tag within a frameset <FRAME NAME=sName ...>. For example, you can use hyperlinks of the form <a target=sName href="page.htm">, 
             and the hyperlink destination page will be displayed in your new window.
             If a window with this name already exists, then window.open() will display the new content in that existing window, rather than 
             creating a new one.
      
      sFeatures: An optional string parameter specifying the features of the new window. The sFeatures string may contain one or 
                 more feature=value pairs separated by commas.
      bReplace:  An optional boolean parameter. If true, the new location will replace the current page in the browser's navigation history. 
                 Note that some browsers will simply ignore this parameter.
                 
    The following features (set in the sFeatures parameter) are available in most browsers:
      toolbar=0|1     whether to display the standard browser toolbar, with buttons such as Back and Forward.
      location=0|1    whether to display the URL address line.
      directories=0|1 whether to display the directory buttons (e.g. What's New, What's Cool).
      status=0|1      whether to display the browser status bar (at the bottom of the window).
      menubar=0|1     whether to display the browser menu bar.
      scrollbars=0|1  whether the new window should have scrollbars.
      resizable=0|1   whether the new window is resizable by user.
      width=pixels    width of the new window.
      height=pixels   height of the new window (example: height='350').
      left=pixels     X coordinate of the top left corner of the new window.
      top=pixels      Y coordinate of the top left corner of the new window.
   */
  

  /**Makes a map from the given a list of "key=val" entries*/
  var makeMapFrom = function(list) {
  	var cmd, val, ndx;
  	var map = {}; //convert given list to a map
  	for(ndx in list) {
  	  if(!list.hasOwnProperty(ndx)) continue; //eliminates jslint warning
        var s = list[ndx];
        if(!s) continue; //nothing there, skip it
        if(s.indexOf) { //if has 'indexOf' then assume is a string
          var pos = s.indexOf('='); //extract either 'cmd=val' or else 'cmd': 
          if(pos<0) { cmd=s; val = null; }
          else {
            cmd = s.substring(0, pos);
            val = s.substring(pos+1);
          }
          map[cmd]=val;
        }
  	}
  	return map;
  }

  
  /**private: Called for each SM, given the value for sm.MSGS*/
  var handleSmMsg = function(smChannel, msgs) {
    //Local vars:
    var cmd, cmdType, commandName, dialogResponse, dialogSettings, msg, msgsNdx, pos, ndx, 
        rtClassName, s, settings, subMsgCnt, subscribeChannel, subscribeTo, val, wname; 

    for(msgsNdx in msgs) { //process each message within the SM
      if(msgs.hasOwnProperty(msgsNdx)) { //eliminates jslint warning
        msg = msgs[msgsNdx];
        if(!msg) { continue; } //empty message
        //if(ri.verboseDebug) { console.log(' msg>>'+msg); } //debug. show messages being handled ####
        subMsgCnt = msg.length; //number of sub msgs in this msg
        if(subMsgCnt===0) { continue; } //nothing to do
        
        //TODO: convert to just use msg (no settings): anyway not using the map aspect at all, and array would allow parsing via msg.shift() (i.e. read and pop msg[0])
      
        settings = {}; //convert given msg to a map (is this actually useful in javaScript? Don't seem to be using the map aspect...)
        rtClassName=null; //name of class of widget to be created: ListPane, TextPane, GroupPane, Button, etc. 
        for(ndx in msg) {
          if(msg.hasOwnProperty(ndx)) { //eliminates jslint warning
            s = msg[ndx];
            if(!s) { continue; } //nothing there, skip it
            if(s===msg[0]) { continue; } //skip the first message (handled separately)
            
            if(s.indexOf) { //if has 'indexOf' then assume is a string

              //extract either 'cmd=val' or else 'cmd':
              pos = s.indexOf('='); 
              if(pos<0) { cmd=s; val = null; }
              else {
                cmd = s.substring(0, pos);
                val = s.substring(pos+1);
              }
              
              if(cmd && cmd==='class') { rtClassName = val; } //Two things: 1) can't put in an entry called class (reserved) and 2) don't need to because going to use it right away 
              else { settings[cmd]=val; }
            }
            else if(s.contents) { //bit of a hack here. Need to finish this, make it generic ###
              settings.contents=s;
            }
            else {                //bit of a hack here. Need to finish this, make it generic (and do it correctly) ###
              for(var theCmd in s) {
                if(s.hasOwnProperty(theCmd)) {
                  var theValue = s[theCmd];
                  if(theValue) //nothing there, skip it
                    settings[theCmd]=theValue;
                }
              }
            }
          }
        }

        wname = riutil.getKeyFor(msg[0]); //non-lowercased version in case is a widget name instead of a command
        cmdType = wname.toLowerCase(); //lowercased version for use as a command
      
        switch(cmdType) {
          case 'toppane': 
          case 'menu':
            dojo.publish('wbCreate', [[wname, settings]]); //'create' event. Note: this goes to correct whiteboard because current Whiteboard is set at the start of this sm 
            continue;
          case 'subpane': 
            dojo.publish('wbCreate', [[rtClassName, settings]]); //'create' event. rtClassName is defined above. Note: this goes to correct whiteboard because current Whiteboard is set at the start of this sm
            continue;
          case 'command': 
            commandName = riutil.getValFor(msg[0]);
            dojo.publish('wbCmd', [[commandName, settings]]); //'command' event. Note: this goes to correct whiteboard because current Whiteboard is set at the start of this sm
            continue;
          case 'createsubscriber': //opens a new whiteboard and subscribes it to the specified application.  
            subscribeChannel = msgs[++msgsNdx]; //1
            subscribeTo = msgs[++msgsNdx];      //2
            doRtalkSubscribe(subscribeTo, subscribeChannel);
            //return; //finished with this SM message (assumes that no other commands are included in a 'createSubscriber' message)
            continue;
          case 'dialog': //pop up a dialog. Types: prompt, menu, confirm, list
            dialogSettings = makeMapFrom(msgs[++msgsNdx]); //OrderedMap
            dialogResponse = msgs[++msgsNdx]; //String
            dojo.publish('wbCreate', [['dialog', dialogSettings, dialogResponse]]); //'create' event
            break;
          default: //message to an indexed widget
            dojo.publish('wbWdgt_'+smChannel+'_'+wname, [settings]); //'widget' command event. Publish message to widget on: "wbWdgt_SmChannel_WidgetId"
            continue;  
        }
      }
    }
  }; //function handleSmMsg
  
  
  /**private: Called upon to process each sm that is received*/
  var receiveAnSm = function(sm) {
    if(!sm) { return; } //nothing to do
    if(!sm.MSGS) { return; } //nothing to do
    //if(ri.verboseDebug) { riutil.emitStatus('GOT SM channel=>'+sm.CHANNEL); } //DEBUG###

    //TODO: change to dojo.publish(...select whiteboard...):
    wb.selectWhiteboard(sm.CHANNEL); //select the whiteboard relevant to the incoming sm.
    if(ri.verboseDebug) { console.log('WB RECVD:'+riutil.getSmAsString(sm)); } //debug
    
    handleSmMsg(sm.CHANNEL, sm.MSGS);
  }; //function
  
  
  /**Act on received message. It may be a single SM or a whole list of them. 
   * This is called when a message comes in via websocket or ajax
   * */
  var receiveMessages = function(msgs) {
    var ndx, val, len; //local vars
    if(!msgs) { return; } //nothing to do
    val = riri.convertSmToObject(msgs); //returns a javascript object whether the given message is json or raw sm
    //val = eval(msgs); //for json. Note: this causes an error when recv a single json object {}: Unexpected token ':'
    //val = eval('['+msgs+']')[0]; //for json. Hack to fix above issue with single {} received
    
    if(val instanceof Array) { //is a list of sm
      len = val.length;
      for(ndx=0; ndx<len; ndx++) {
        receiveAnSm(val[ndx]);
      }
    }
    else { receiveAnSm(val); } //is a single sm
  }; //function
  
  
  /**Called by html button to update the monitored SM channel.
   * Looks for an html element called 'mySmChannel' and uses that to set the channel*/
  var setSmChannel = function() {
    var elem = document.getElementById('mySmChannel');
    if(elem) { 
      this.smChannel=elem.value; 
      if(ri.verboseDebug) { riutil.emitStatus('SM channel set to "'+this.smChannel+'"'); }
    }
  }; //function
  
  
  /**Establishes communications (over web sockets or ajax). 
   * If 'initialMsg' is specified then that is sent out after the socket communication is established
   * */
  var openComms = function(initialMsg) {
    //Close down any pre-existing connection:
    if(typeof ri.websocket.open !== 'undefined') { //if function exists, then close down web sockets
      if(typeof webSkt !== 'undefined' && !webSkt) {
        webSkt = ri.websocket.close(webSkt); //close any open web sockets
        webSkt = null;
      }
    }
    if(typeof riAjax.enablePolling !== 'undefined') { //if ajax module is loaded, stop any polling going on there
      riAjax.enablePolling(false);
    }

    //Open up new connection:
    if(typeof ri.websocket.open !== 'undefined') { //if function exists, then init for web sockets
      
      var websocketUrl;
      websocketUrl = 'ws://localhost:7501/rtalk/sm'; //use SM servlet
      //websocketUrl = 'ws:///rtalk/sm'; //use SM servlet
      
      webSkt = ri.websocket.open(websocketUrl, receiveMessages, initialMsg); //open and set up the websocket
      if(webSkt) { riutil.emitStatus('Websockets enabled'); } //debug
    }
    
    if(!webSkt && (typeof riAjax.enablePolling !== 'undefined') ) { //since that didn't work, switch to ajax (if ri ajax library is available)
      riAjax.initializeForPolling(receiveMessages);
      riutil.emitStatus('Polling enabled'); //debug
      webSkt = {}; //define a fake websocket to intercept for ajax
      webSkt.send = function(msg) { riAjax.smPoll(msg); };
      webSkt.close = function(msg) { riAjax.enablePolling(false); };
    }
    if(!webSkt && !riAjax.enablePolling) {
      riutil.emitStatus('This app is disabled because: Websockets not available and Ajax not enabled.'); //debug
    }
  };
  
  
  /**Initialize wbSmParse module. Mainly communications: Websockets or Ajax*/
  var doInit = function() {
    var smChannelDiv;  //local vars
    //var getGuruTimenow = ri.namespace('util').getGuruTimenow; //riutil.getGuruTimenow

    this.smChannel = makeUpAChannelName(); //make up a unique SM channel name 
    //smChannel = 'aaa'; //DEBUG

    //Initialize the SM channel display (debug). This is so that user can change the SM channel:
    smChannelDiv = document.getElementById('mySmChannel');
    if(smChannelDiv) {
      smChannelDiv.value = this.smChannel;
    }
    
    //TODO: change to dojo.publish(...add whiteboard...):
    wb.addWhiteboard(this.smChannel, 'topPane', document, null); //get things started by installing the default (starting) browser window. It can act as a whiteboard but really nothing will be talking to it (except maybe for debug).
  
    openComms(); //set up lines of communication with the server (web socket or ajax)
    
  }; //function doInit
  
  
  /**Accessor*/
  var getSmChannel = function() { return this.smChannel; };

  
  /**Accessor*/
  var getWebSkt = function() { return webSkt; };
  

  /*---------------
   *closure return:
   *---------------*/
  return {

    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    getSmChannel: getSmChannel,
    getWebSkt: getWebSkt, 
    setSmChannel: setSmChannel,
    doRtalkSubscribe: doRtalkSubscribe,
    receiveMessages: receiveMessages,
    openComms: openComms,
    doInit: doInit
  }; //closure return
  
}()); //namespace smparse
