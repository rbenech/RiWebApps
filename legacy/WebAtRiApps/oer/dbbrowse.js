/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, nomen: true, plusplus: true, vars: true, white: true, windows: false */

  /*-------------------------
    dbbrowse.js: Part of the database browse web app.

    History: 
      8/19/11: initial release
     ---------------------------*/
  var _pollingIsAllowed=false; //true to allow polling to occur, false to completely disable all polling
  var _pollInterval=1000; //mS
  var _pollTimer; //timer used to trigger polling events
  var _pollingEnabled=true; //toggled automatically at runtime
  var _dbType=""; //dbType: 'sqliteguru', 'sqlite', 'postgres', 'db2'
  var cntr=1;
     
  /**Creates and returns XML HTTP Request object. Tries all known ways*/
  function getHttpReqObject() {
    "use strict"; //enable javascript strict mode
    if(typeof XMLHttpRequest !== 'undefined') { return new XMLHttpRequest(); } //for all but Internet Explorer
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } //IE has two ways, try them both.
    catch(e) { 
      try { return new ActiveXObject('Microsoft.XMLHTTP'); } 
      catch(ex) {}
    } 
    return false;
  }
  
  function formatQueryResult(result) {
    "use strict"; //enable javascript strict mode
    return 'This here is what we got ('+ (cntr++) +'): '+result; //TODO
  }
   
  /**Stops the polling timer*/
  function stopPolling() {
    "use strict"; //enable javascript strict mode
    _pollingEnabled = false; //when timer fires, if disabled then is simply ignored in pollIt function and not reset
  }

  function pollIt() {
    "use strict"; //enable javascript strict mode
    if(_pollingEnabled===false) { return; } //i.e. polling was turned off after timer had already been set. 
    var xhr = getHttpReqObject();
    var query = '/guru/sm?';
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          var resp = xhr.responseText;
          if(resp && resp.length > 0) { //if got something
            var result = JSON.parse(resp);
            document.getElementById("divResult").innerHTML = formatQueryResult(result);
          }
          if(_pollingEnabled) { setPollTimer(); } //reset timer for next iteration
        }
        else { //error occurred
          stopPolling();
          alert('Poll error: '+xhr.statusText); 
        } 
      }
    };
    xhr.send(null);
  }
  
  /**Continues the poll timer for the next iteration*/
  function setPollTimer() {
    "use strict"; //enable javascript strict mode
    if(_pollingIsAllowed) {
      _pollTimer = setTimeout(pollIt, _pollInterval); //call pollIt() function at regular intervals
  }
  }
  
  /**Starts the polling timer*/
  function startPolling() {
    "use strict"; //enable javascript strict mode
    if(_pollingIsAllowed) {
      _pollingEnabled = true;  
      setPollTimer();
    }
  }
   
  /**Take an SM reading and display the results*/
  function readSm() {
    "use strict"; //enable javascript strict mode
    var xhr = getHttpReqObject();
    var query = '/guru/sm?';
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          var resp = xhr.responseText;
          if(resp && resp.length > 0) { //if got something
            document.getElementById("divResult").innerHTML = resp;
          }
        }
        else { alert('Read error: '+xhr.statusText); } //error occurred 
      }
    };
    xhr.send(null);
  }
  
  function doSendRecSm(sendSm) {
    "use strict"; //enable javascript strict mode
    stopPolling();
    var xhr = getHttpReqObject();
    var query = '/guru/sm?'+sendSm;
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          //var result = eval(xhr.responseText);
          document.getElementById("divResult").innerHTML = xhr.responseText;
        }
        else { alert('Error performing connect: '+xhr.statusText); }
      }
    };
    xhr.send(null);
  }
  
  /**performs a query on the current database*/
  function doQuery(theQuery) {
    "use strict"; //enable javascript strict mode
    stopPolling();
    var xhr = getHttpReqObject();
    var query = '/guru/sm?'+theQuery;
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          //var result = eval(xhr.responseText);
          document.getElementById("divResult").innerHTML = formatQueryResult(xhr.responseText);
          startPolling();
        }
        else { alert('Error performing query: '+xhr.statusText); }
      }
    };
    xhr.send(null);
  }
  
  /**Returns the value of the radio button that is checked.
     Returns an empty string if none are checked, or there are no radio buttons
  */
  function getCheckedValue(radioObj) {
    "use strict"; //enable javascript strict mode
    var i;
    if(!radioObj) { return ""; }
    var radioLength = radioObj.length;
    if(radioLength === undefined) {
      if(radioObj.checked) { return radioObj.value; }
      return "";
    }
    for(i=0; i<radioLength; i++) {
      if(radioObj[i].checked) {
        return radioObj[i].value;
      }
    }
    return "";
  }
  
  /**Sets the radio button with the given value as being checked.
     Does nothing if there are no radio buttons.
     If the given value does not exist, all the radio buttons are reset to unchecked.
  */
  function setCheckedValue(radioObj, newValue) {
    "use strict"; //enable javascript strict mode
    var i;
    if(!radioObj) { return; }
    var radioLength = radioObj.length;
    if(radioLength===undefined) {
      radioObj.checked = (radioObj.value === newValue.toString());
      return;
    }
    for(i=0; i<radioLength; i++) {
      radioObj[i].checked = false;
      if(radioObj[i].value === newValue.toString()) {
        radioObj[i].checked = true;
      }
    }
  }

  /**Called when user clicks on dbType radio button to select displayed database type*/
  function setSelectedDbType() {
    "use strict"; //enable javascript strict mode
    _dbType = getCheckedValue(document.forms.radioForm.elements.dbTypeSel);
    pollIt();
  }
   
  /**Called on initial load to perform initial setup*/
  function doInit() {
    "use strict"; //enable javascript strict mode
    setCheckedValue(document.forms.radioForm.elements.dbTypeSel, _dbType); //select the radio button corresponding to the current databse type
    pollIt();
  }
  window.onload=doInit; //initial setup
