/*jslint browser: true, devel: true */ 

/**Returns a string representation of the provided item.
  * Renders arrays, and objects as comma separated. 
  * If the given item is an riString (or contains riStrings): shows it as the 'text' component.
  * Everything else is just treated as a string. 
  * */
function getAsString(data) {
  "use strict"; //enable javascript strict mode
  var ndx, a, firstTime;
  
  if(!data) { return ''; } //nothing
  if(data instanceof Object) { //if get an array or object, show the contents as comma separated
    a='';
    firstTime=true; //for leading comma suppression
    for(ndx in data) {
    if(data.hasOwnProperty(ndx)) {
        if(!firstTime) { a+= ', '; }
        firstTime=false;
        if(data[ndx].text) { a+=data[ndx].text; } //riString
        else { a+=data[ndx]; }
    }
    }
    return a;
  }
  if(data.text) { return data.text; } //riString
  return data;  //everything else
}

/**Returns the given sm as a single row in a table*/
function formatAnSm(sm) {
  "use strict"; //enable javascript strict mode
  var msgs, msgNdx, submsg, firstEntry, submsgNdx;
  var a='<tr>'+
        '<td>'+getAsString(sm.DST)+'</td>'+
        '<td>'+getAsString(sm.SRC)+'</td>'+
        '<td>'+sm.CHANNEL+'</td>';
  msgs = sm.MSGS; //array of messages, each has an array of sub messages
  for(msgNdx in msgs) { //for each Msg
    if(msgs.hasOwnProperty(msgNdx)) { //make jslint happy
      submsg = msgs[msgNdx];
      firstEntry=true;
      for(submsgNdx in submsg) { //for each sub-msg
        if(submsg.hasOwnProperty(submsgNdx)) { //make jslint happy
          a+='<td>';
          if(firstEntry) { a+='<strong>'; }
          a+=getAsString(submsg[submsgNdx]); //renders arrays, objects riStrings etc in a viewable form
          if(firstEntry) { a+='</strong>'; }
          firstEntry=false;
          a+='</td>';
    }
      }
  }
  }
  a+='</tr>';
  return a;
}

/*Given a list of SM data messages, returns an html formatted table*/
function formatSmDataList(smData) {
  "use strict"; //enable javascript strict mode
  var smCnt, a, smNdx, len;
  
  if(!smData) { return ''; }
  smCnt = smData.length || 1; //either it's an array or a single entry
  a='';
  //a=a+'<strong>Raw Data:</strong>'+smData+<br />; //debug
  a+='<p><h3 align="center">'+smCnt+' SM Packet(s)</h3></p>\n'+
     '<table border="1" align="center">'+
     '<tr>'+
     '<td>Dest</td>'+
     '<td>Src</td>'+
     '<td>Channel</td>'+
     '<td>Messages</td>'+
     '</tr>';
  if(smData instanceof Array) { //given an array of SM's
    len = smData.length;
    for(smNdx=0; smNdx<len; smNdx++) { //for each SM
      a+=formatAnSm(smData[smNdx]);
  }
  }
  else { //assume is a single sm instead of an array 
    a+=formatAnSm(smData);
  }
  a+='</table>';
  return a;
}

/*Creates and returns the XML HTTP Request object. Tries all known ways*/
function getHttpReqObject() {
  "use strict"; //enable javascript strict mode
  try { return new XMLHttpRequest(); } catch(e1) {} //for all browsers except older (pre IE7) Internet Explorer
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e2) {} //older IE has two ways, try them both 
  try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e3) {}
  alert('Unable to set up ajax (XmlHttpRequest object). Browser too old?');
  return null; 
}

/*Query and load SM data from server*/
function loadIt() {
  "use strict"; //enable javascript strict mode
  var xhr = getHttpReqObject();
  xhr.open('GET',  'http://localhost:7501/guru/sm?', true);
  //xhr.open("POST","name.asp",true); //sample POST
  //xhr.send("A=aa&B=bb"); //sample POST data
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function() {
    if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
      if(xhr.status===200) { //received ok
        //var sub1=["aa","bb","cc"]; msgs=[sub1,sub1]; sm1={"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":msgs}; sm2={"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":msgs}; smList = [sm1, sm2];
        //var smList = [{"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":[["aa","bb","cc"],["aa","bb","cc"]]},{"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":[["aa","bb","cc"],["aa","bb","cc"]]}];
        var resp = xhr.responseText;
        if(resp) {
          //var smList = eval(resp); //this has issue with a single object return: Invalid character ':'
          var smList = JSON.parse(resp);
          document.getElementById("adiv").innerHTML = formatSmDataList(smList);
        }
      }
      else { alert('-->Ajax receive Error: '+xhr.statusText); } //error occurred
    }
  };
  xhr.send(null);
}
