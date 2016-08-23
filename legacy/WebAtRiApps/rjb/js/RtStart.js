
/* ------------------------------------------------------------------------------------------
  RTalkStart. 
  This is a whiteboard (a blank slate) that is configured by SM messages.
  The received SM messages indicate what widgets are to be inserted as well as their configuration parameters.
  10/1/2011 oer
  ------------------------------------------------------------------------------------------
*/

// ------------
// Global Vars:
// ------------
//window.onload=refresh //initial refresh

var _pollingIsAllowed=false; //true to allow polling to occur, false to completely disable all polling
var _pollInterval=1000; //mS 
var _pollTimer; //timer used to trigger polling events
var _pollingEnabled=false; //toggled automatically at runtime
var _mySmChannel = 'aaa'; //FOR NOW: hard-code. Later: randomly generated channel name. TODO

 
//------------
//Functions:
//------------

/**Called from html button: Initiate a "remote browser" session*/
function doRemoteBrowse() {
  //Note: smdst=00000000, smsrc=G8ZLJ3CAB45PE300, msgid=1???, src=G8ZLJ3CA
  smPoll('%1ccode%1csubscribe%1ctopic=browser%1dview=browser%1dlibrary=GF10RC2A.093%1cG8ZLJ3CAB45PE309%1cbrowser');
}

// ----------------------------------------------------------

/**Continues the poll timer for the next iteration*/
function setPollTimer() {
  if(_pollingIsAllowed)
    _pollTimer = setTimeout("pollIt()", _pollInterval);
}

/**Starts the polling timer*/
function startPolling() {
  if(_pollingIsAllowed) {
    _pollingEnabled = true;  
    setPollTimer();
  }
}
 
/**Stops the polling timer*/
function stopPolling() {
  _pollingEnabled = false; //when timer fires, if disabled then is simply ignored in pollIt function and not reset
}

/**Called at regular intervals by the timer*/
function pollIt() {
  if(_pollingEnabled===false) return; //i.e. polling was turned off after timer had already been set.
  smPoll(null);
}

/**Perform a poll for sm packets. Sends out an optional message*/
function smPoll(smMsg) {
  xhr = getHttpReqObject();
  if(smMsg) //send message and do poll
    xhr.open('GET', '/guru/sm?'+smMsg, true);
  else //just do poll, no msg to send
    xhr.open('GET', 'http://localhost:7501/guru/sm?', true);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function() {
    if(xhr.readyState==4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
      if(xhr.status==200){  //received ok
        var resp = xhr.responseText;
        if(resp && resp.length > 0) { //if got something
          var msgs = eval(resp);
          updateFromRtalk(msgs);
        }
        if(_pollingEnabled) { setPollTimer(); } //reset timer for next iteration
      }
      else alert('-->Error:: '+xhr.statusText); //error occurred
    }
  }
  xhr.send(null);
}

/**Act on received SM list*/
function updateFromRtalk(smList) {
  var len = smList.length;
  for(var ndx in smList) {
    if(smList[ndx].CHANNEL !== _mySmChannel) continue; //skip messages not directed to this app.
    var msgs = smList[ndx].MSGS;
    if(!msgs) continue; //nothing to do
    for(var msgsNdx in msgs)
      handleRtMsg(msgs[msgsNdx]);
  }
}

//----------------
// Utility methods: 
// ----------------

/**given an RiString returns a Dojo compatible html <div> element(otherwise just returns a plain string)
*   Note: The closing </div> must be provided in calling function!*/
function getRiStringAsDojoTreeDiv(rs) {
  if(!rs.text) //if no text field then it's not an RiString
    return '<div class="DojoTree" title="'+rs+'">';
  
  var indent=0;
  var color=0;
  var font=0;
  if(rs.indent) indent = rs.indent;
  if(rs.color) color = rs.color;
  if(rs.font) font = rs.font;
  if(color===0 && indent===0 && font===0) 
    return '<div class="DojoTree" title="'+rs+'">'; //nothing to format
  
  var a='<div class="DojoTree"';
  
  //if(color!==0 || font!==0 || indent!=0) {
  //  a+=' style="'; //note: opening double quote
  //  if(color!==0) a+='color:'+color;
  //  switch(font) {
  //    case 0: break; //normal font
  //    case 1: a+=' font-weight:bold'; break; //bold 
  //    case 2: a+=' font-style:italic'; break; //italic
  //    case 3: a+=' font-weight:bold font-style:italic'; break; //bold italic
  //  }
  //  //if(indent!=0) a+=' padding-left: '+indent+'em'; //why doesn't this approach work?  --only 'block' objects can be padded, li is not one of them...
  //  a+='"'; //closing double quote
  //}
  a+=' title="'+rs.text+'">';
  return a; //remember to close with </div> in parent function
}

/**given an RiString returns a integer value of child level starting at 0*/
function getChildLevelFromRSIndent(rs) {
  //if(!rs.text){ //if no text field then it's not an RiString
  //  return 0;
  //}
  
  var indent=0;
 // if(rs.indent) indent = rs.indent;
  
  return indent; //returns 0 or indent if available
}

/**given an RiString returns a formatted list <li>...</li> element*/  
function getRiStringAsLi(rs) {
  if(!rs.text) //if no text field then it's not an RiString
    return '<li>'+rs+'</li>';
  
  var indent=0;
  var color=0;
  var font=0;
  if(rs.indent) indent = rs.indent;
  if(rs.color) color = rs.color;
  if(rs.font) font = rs.font;
  if(color===0 && indent===0 && font===0) 
    return '<li>'+rs.text+'</li>'; //nothing to format
  
  var a='<li';
  if(color!==0 || font!==0 || indent!=0) {
    a+=' style="'; //note: opening double quote
    if(color!==0) a+=' color:'+color;
    switch(font) {
      case 0: break; //normal font
      case 1: a+=' font-weight:bold'; break; //bold 
      case 2: a+=' font-style:italic'; break; //italic
      case 3: a+=' font-weight:bold font-style:italic'; break; //bold italic
    }
    //if(indent!=0) a+=' padding-left: '+indent+'em'; //why doesn't this approach work?
    a+='"'; //closing double quote   
  }
  a+='>'+nbspaces(indent)+rs.text+'</li>'; //use nbspaces until figure out whhy css padding didn't work
  return a;
}


/**given an RiString returns a formatted html <span>...</span> element(otherwise just returns a plain string)*/  
function getRiStringAsSpan(rs) {
  if(!rs.text) //if no text field then it's not an RiString
    return rs;
  
  var indent=0;
  var color=0;
  var font=0;
  if(rs.indent) indent = rs.indent;
  if(rs.color) color = rs.color;
  if(rs.font) font = rs.font;
  if(color===0 && indent===0 && font===0) 
    return rs.text; //nothing to format
  
  var a='<span';
  if(color!==0 || font!==0) {
    a+=' style=';
    if(color!==0) a+='"color:'+color;
    switch(font) {
      case 0: break; //normal font
      case 1: a+=' font-weight:bold'; break; //bold 
      case 2: a+=' font-style:italic'; break; //italic
      case 3: a+=' font-weight:bold font-style:italic'; break; //bold italic
    }
    a+='"'; //closing double quote   
  }
  a+='>'+nbspaces(indent)+rs.text+'</span>';
  return a;
}

/**toggles 'visibility' given the id of a div*/
function makeVis(divID) {
  //document.getElementById(divID).style.visibility = "visible";
  var adiv = document.getElementById(divID);
  if(adiv.style.visibility=="visible")
    adiv.style.visibility="hidden";
  else
    adiv.style.visibility="visible";
}

/**Given a div id, sets its position. Example setPos("myDivId", "10px", "20px") */
function setPos(divID, topPos, leftPos) {
  var adiv = document.getElementById(divID);
  adiv.style.position="relative";
  adiv.style.top=topPos; //"10px";
  adiv.style.left=leftPos; //"10px";
  //document.getElementById(divID).style.left = 300;
}

/**Creates and returns XML HTTP Request object. Tries all known ways*/
function getHttpReqObject() {
  if(typeof XMLHttpRequest != 'undefined') return new XMLHttpRequest(); //for all but Internet Explorer
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } //IE has two ways, try them both.
  catch(e) { 
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } 
    catch(e) {}
  }
  return false;
}

/**Given a string of the form 'key=val' returns 'key'
 * if no equal sign then returns the given string.*/
function getKeyFor(keyval) {
  var pos = keyval.indexOf('=');
  if(pos<0) return keyval;
  return keyval.substring(0, pos);
}

/**Given a string of the form 'key=val' returns 'val'
 * if no equal sign then returns null.*/
function getValFor(keyval) {
  var pos = keyval.indexOf('=');
  if(pos<0) return null;
  return keyval.substring(pos+1);
}

/**Returns a string with the indicated number of spaces*/
function spaces(len) {
  if(len<=0) return '';
  switch(len) {
    case  1: return ' '; case 10: return '          ';
    case  2: return '  '; case  9: return '         ';
    case  3: return '   '; case  8: return '        ';
    case  4: return '    '; case  7: return '       ';
    case  5: return '     '; case  6: return '      ';
  }
  var a='';
  var len10 = Math.floor(len/10);
  for(var i=0; i<len10; i++) a+='          '; //the big chunks
  return a+spaces(len-(len10*10)); //the remainder
}

/**Returns a string with the indicated number of spaces*/
function nbspaces(len) {
  if(len<=0) return '';
  switch(len) {
    case  1: return '&nbsp'; case 10: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
    case  2: return '&nbsp&nbsp'; case  9: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
    case  3: return '&nbsp&nbsp&nbsp'; case  8: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
    case  4: return '&nbsp&nbsp&nbsp&nbsp'; case  7: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
    case  5: return '&nbsp&nbsp&nbsp&nbsp&nbsp'; case  6: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
  }
  var a='';
  var len10 = Math.floor(len/10);
  for(var i=0; i<len10; i++) a+='&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'; //the big chunks
  return a+spaces(len-(len10*10)); //the remainder
}

/**Creates div style info given a frameRatio variable, which has values for: left, right, top, bottom.
 * Example: given a frameratio object: { left:20, right:50 top:100, bottom:60 } 
 * Returns as string: 'style=position:absolute; left:20%; top:100%; width:30%; height:40%; overflow:auto;'
 * */
function makeDivStyleFromFrameRatio(frameRatio) {
  var wd, ht, xpos, ypos;
  if(frameRatio) { //frameRatio is percent values for: left, right, top, bottom
    wd = ''+(frameRatio.right-frameRatio.left)+'%';
    ht = ''+(frameRatio.top-frameRatio.bottom)+'%';
    xpos = frameRatio.left;
    ypos = 100-frameRatio.top;
  }
  else {
    wd = 'auto';
    ht='auto';
    xpos = 0;
    ypos = 0;
  }
  var a='';
  //a+=' position:absolute; left:'+xpos+'%; top:'+(100-top)+'%;';
  a+=' position:absolute; left:'+xpos+'%; top:'+ypos+'%;';
  a+=' width: '+wd+'; height: '+ht+';';
  a+=' overflow:auto;"'; //<--'auto' or 'scroll' here makes it have scrollbars
  return a;
}

/**Returns the given frameratio string (i.e. '20;50;100;60')
 * as a json object: { left:20, right:50 top:100, bottom:60 } 
 * */
function getFrameRatioFor(val) {
  var frameRatio = {};
  var doing=0; //start with 0 (left)
  var p0=0; //index of start of substring
  for(var ndx in val) {
    if(val[ndx]===';') {
      switch(doing) {
        case 0: frameRatio.left  = parseInt(val.substring(p0, ndx), 10); break; //left
        case 1: frameRatio.right = parseInt(val.substring(p0, ndx), 10); break; //right
        case 2: frameRatio.top   = parseInt(val.substring(p0, ndx), 10); break; //top
      }
      p0 = +ndx+1; //next
      doing++; //next
    }
  }
  frameRatio.bottom = parseInt(val.substring(p0, val.length), 10); //bottom
  return frameRatio;
}



