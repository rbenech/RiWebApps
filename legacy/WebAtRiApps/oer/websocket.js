/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */

/**-----------------------------------------------------------------------------------------
  websocket.js. 
  This is the websocket related functionality.
  11/12/2011 oer
  ------------------------------------------------------------------------------------------
*/

var ri = ri || {}; //namespace for the ri module

/**module definition*/
ri.websocket = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //-------------
  
  //Closure local variables:
  //------------------------
  var isOpen=false; //true when the web socket is currently open
  
  //Closure method definitions:
  //---------------------------

  /**Returns true if the browser supports web sockets*/
  var isWebsocketSupported = function() {
    if(window.WebSocket) { return true; }
    riutil.emitStatus('Websockets not supported'); //debug
    return false;
  };

  /**Send given message over the specified websocket*/
  var send = function(w, msg) {
    //TODO: consider caching items 'sent' immediately after a call to 'open' but before 'isOpen' becomes valid. That would eliminate the need for 'initialMsg' arg in 'open(initialMsg)' 
    if(w && isOpen) { w.send(msg); }
    else {
      riutil.emitStatus('WebSocket not open'); //debug 
      throw "WebSocket not open";
    } 
  };
  
  /**Close the given websocket*/
  var close = function(w) {
    if(!w) { return w; }
    riutil.emitStatus('Closing Websocket...'); //debug
    w.close();
    w=null;
    return w;
  };

  /**Opens a websocket at the specified url. Returns the opened webSocket.
   * receiveFunction is for received messages
   * Optional: 'initialMsg' is a message sent out after the connection has been made*/
  var open = function(url, receiveFunction, initialMsg) {
    var w;
    riutil.emitStatus('Opening Websocket...'); //debug
    if(!isWebsocketSupported()) { return null; } //web sockets not available 

    //Set up the web socket:
    w = new WebSocket(url);
    w.onopen = function()  { //called when websocket is succesfully opened
      isOpen=true; 
      riutil.emitStatus('Websocket Opened'); //debug
      if(initialMsg) {
        send(w, initialMsg);
        initialMsg=null;
      }
    }; 
    w.onmessage = function(e) { //called when data comes in over websocket, send it to the specified function 
      receiveFunction(e.data); 
    };        
    w.onclose   = function()  { //called when websocket closes
      isOpen=false;
      riutil.emitStatus('Websocket Closed'); //debug 
    };
    w.onerror = function(e) { //called when a websocket error occurs
      riutil.emitStatus('Websocket Error: '+e.data); //debug 
    }; 
    return w;
  };
  
  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    isWebsocketSupported: isWebsocketSupported,
    open: open,
    send: send,
    close: close
  }; //closure return
  
}()); //namespace ri.websocket
