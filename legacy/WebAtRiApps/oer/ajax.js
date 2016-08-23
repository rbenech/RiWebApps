/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, nomen: true, plusplus: true, vars: true, white: true, windows: false */
/*globals ri*/ //for jslint

/**-----------------------------------------------------------------------------------------
  ajax.js. 
  These are functions related to fetching data using Ajax (i.e. polling instead of websockets)
  10/1/2011 oer
  ------------------------------------------------------------------------------------------
*/


/**module definition*/
var riAjax = (function () {
  "use strict"; //enable javascript strict mode

  //Dependencies:
  //-------------
  
  //Closure local variables:
  //------------------------
  var _xhr=null;                 //xml http request (ajax) browser object
  var _pollingIsAllowed=false;   //true to allow polling to occur, false to completely disable all polling
  var _pollInterval=1000;        //mS 
  var _pollTimer=null;           //timer used to trigger polling events
  var _pollingEnabled=false;     //toggled automatically at runtime
  var _pollReceiveFunction=null; //the function to call with any received data
  
  //Closure method definitions:
  //---------------------------
    
  /**Continues the poll timer for the next iteration*/
  var setPollTimer = function() {
    if(_pollingIsAllowed) {
      _pollTimer = setTimeout(riAjax.pollIt, _pollInterval);
    }
  };
  
  /**Turns on (enables) ajax/polling mechanism*/
  var enablePolling = function(on) {
    if(on) { _pollingIsAllowed=true;  }
    else   { _pollingIsAllowed=false; }
  };
  
  /**Sets the Ajax polling interval*/
  var setPollingInterval = function(mSec) {
    _pollInterval = mSec;
  };
  
  /**Starts the polling timer*/
  var startPolling = function() {
    if(_pollingIsAllowed) {
      _pollingEnabled = true;  
      setPollTimer(); 
    }
  };
  
  
  /**This sets the function that gets called whenever polling data comes in. 
   * It also enables and starts the polling*/
  var initializeForPolling = function(receiveFunction) {
    _pollReceiveFunction = receiveFunction;
    enablePolling(true); 
    startPolling(); 
  };
  
  /**Stops the polling timer*/
  var stopPolling = function() {
    _pollingEnabled = false; //when timer fires, if disabled then is simply ignored in pollIt function and not reset
    clearTimeout(_pollTimer); //disable the timer
  };
  
  /**Creates and returns XML HTTP Request object. Tries all known ways*/
  var getHttpReqObject = function() {
    try { return new XMLHttpRequest(); } catch(e1) {} //for all but older Internet Explorer (pre IE7)
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e2) {} //IE has two ways, try them both.
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e3) {} //legacy IE
    console.log('Unable to set up for ajax polling (browser too old?)');
    return null; //ajax not supported
  };
  
  /**Perform a poll for sm packets. If given an sm, sends it out*/
  var smPoll = function(smMsg) {
    if(!_xhr) { _xhr = getHttpReqObject(); }
    if(smMsg) { //send message (if any) and do a poll
      _xhr.open('GET', '/guru/sm?'+smMsg, true);
    }
    else { //just do poll, no msg to send
      _xhr.open('GET', '/guru/sm?', true);
    }
    
    _xhr.setRequestHeader('Accept', 'application/json'); //request response in JSON format
    //_xhr.setRequestHeader('Accept', 'application/xml'); //request response in XML format
    //_xhr.setRequestHeader('Accept', 'application/octet-stream'); //request response in Binary format
    _xhr.onreadystatechange = function() {
      if(_xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(_xhr.status===200) {  //received ok
          var resp = _xhr.responseText;
          if(resp && resp.length > 0) { //if got something
            _pollReceiveFunction(resp); //call the function that was specified when polling was set up 
          }
          if(_pollingEnabled) { 
            setPollTimer(); //reset timer for next iteration 
          } 
        }
        else { console.log('riAjax polling error: '+_xhr.status+': '+_xhr.statusText); } //error occurred
      }
    };
    _xhr.send(null);
  };
  
  /**Called at regular intervals by the timer*/
  var pollIt = function() {
    if(_pollingEnabled===false) { return; } //i.e. polling was turned off after timer had already been set.
    smPoll(null); 
  };
  
  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    enablePolling: enablePolling,
    setPollingInterval: setPollingInterval,
    startPolling: startPolling,
    initializeForPolling: initializeForPolling,
    stopPolling: stopPolling,
    getHttpReqObject: getHttpReqObject,
    smPoll: smPoll,
    pollIt: pollIt
  }; //closure return
  
}()); //namespace riAjax
