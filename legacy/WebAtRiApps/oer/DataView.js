/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, nomen: true, plusplus: true, vars: true, white: true, windows: false */

/*-------------------------
  Dataview: worksheet data viewer application
  History: 
    5/26/11: initial release
   ---------------------------*/

var _pollingIsAllowed=true; //true to allow polling to occur, false to completely disable all polling
var _pollInterval=750; //mS
var _pollTimer; //timer used to trigger polling events
var _pollingEnabled=false; //toggled automatically at runtime
var testNamesHeader = ''; //names for the top of each column
var dataList = []; //list of data being currently displayed
var maxDataListLen=40; //max number of data entries to keep around at any one time

/*Creates and returns the XML HTTP Request object. Tries all known ways*/
function getHttpReqObject() {
  "use strict"; //enable javascript strict mode
  if(typeof XMLHttpRequest !== 'undefined') { return new XMLHttpRequest(); } //for all but older Internet Explorer
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } //Internet Explorer has two different ways. Try them both.
  catch(e1) { 
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } 
    catch(e2) {}
  } 
  return false; 
}

/*Display SM worksheet data in tabular form*/
function formatSmDataList(smData, adiv) {
  "use strict"; //enable javascript strict mode
  var i, j, k, sm, msgs, msgsCnt, submsg, subCnt, cmd;
  var color, anEntry, a, ndx;
  var len = smData.length;
  
  for(i=0; i<len; i++) { //for each SM
    sm = smData[i];

    if(sm.CHANNEL!=='Worksheet') { break; } //only deal with data for this sm channel

    msgs = sm.MSGS; //array of messages, each has an array of sub messages
    msgsCnt = msgs.length;
    for(j=0; j<msgsCnt; j++) { //for each entry (e.g. data,val1,val1,...)
      submsg = msgs[j]; 
      subCnt = submsg.length;
      if(subCnt < 1) { break; } //nothing to do on this one
      cmd = submsg[0]; //e.g. clear, cleardata, testnames, units, data
      switch(cmd) {
        case 'clear': //clear data and headers
          testNamesHeader='';
          while(dataList.length > 0) { dataList.pop(); } //clear out the array
          break;
        
        case 'cleardata': //clear data only
          while(dataList.length > 0) { dataList.pop(); } //clear out the array
          break;
          
        case 'testnames': //set the header values
          testNamesHeader = '<tr>';
          for(k=1; k<subCnt; k++) { //for each sub-msg (not including cmd)
            testNamesHeader += ('<td>' + submsg[k] + '</td>'); 
          }
          testNamesHeader += '</tr>';
          break;
        
        case 'units': //set the test data units
          //TODO
          break;
        
        case 'data': //set received data
          color='#0033FF'; //blue data color
          anEntry='<tr>';
          for(k=1; k<subCnt; k++) { //for each sub-msg (not including cmd)
            anEntry+='<td>';
            if(k===0) { anEntry+='<strong>'; }
            anEntry+=submsg[k];
            if(k===0) { anEntry+='</strong>'; }
            anEntry+='</td>';
          }
          anEntry+='</tr>';
          dataList.push('<span style="color:'+color+'">'+anEntry+'</span>'); //add it to the list
          while(dataList.length > maxDataListLen) { dataList.shift(); } //remove all the oldest data entries
          break;
      } //switch
    } //for
  } //for

  //fill in the html table:
  a=''; //this is where the output html is assembled
  a+='<table border="1" align="center"> ';
  a+= testNamesHeader; //first line is the testnames
  for(ndx in dataList) { 
    if(dataList.hasOwnProperty(ndx)) { //keeps jslint happy
      a += dataList[ndx]; 
  }
  }
  a+='</table>';
  adiv.innerHTML = a;
}

/*Query and load SM data from server*/
function pollIt() {
  "use strict"; //enable javascript strict mode
  if(_pollingEnabled===false) { return; } //i.e. polling was turned off after timer had already been set. 
  var xhr = getHttpReqObject();
  xhr.open('GET',  '/guru/sm?', true);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function() {
    if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
      if(xhr.status===200) { //received ok
        var resp = xhr.responseText;
        if(resp && resp.length>0) {
          var adiv = document.getElementById("adiv");
          formatSmDataList(JSON.parse(resp), adiv);
          if(_pollingEnabled) { setPollTimer(); } //reset timer for next iteration
        }
      }
      else { alert('-->Error:: '+xhr.statusText); } //error occurred
    }
  };
  xhr.send(null);
}

/**Continues the poll timer for the next iteration*/
function setPollTimer() {
  "use strict"; //enable javascript strict mode
  if(_pollingIsAllowed) {
    _pollTimer = setTimeout(pollIt, _pollInterval); //call the pollIt() function at regular intevals
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
 
/**Stops the polling timer*/
function stopPolling() {
  "use strict"; //enable javascript strict mode
  _pollingEnabled = false; //when timer fires, if disabled then is simply ignored in pollIt function and not reset
}
