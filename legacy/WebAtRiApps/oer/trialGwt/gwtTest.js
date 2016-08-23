
/*Test of GWT servlet*/
function formatSmDataList(smData) {
  a='';
  len=0;
  if(smData > ' ') {
    //a=a+'<strong>Raw Data:</strong>'+smData; //debug
    len = smData.length;
  }

  a=a+ '<p><h3 align="center">'+len+' SM Packet(s)</h3></p>\n';
  a=a+'<table align="center">';
  a=a+'<tr>';
  a=a+'<td>Dest</td>';
  a=a+'<td>Src</td>';
  a=a+'<td>Channel</td>';
  a=a+'</tr>';

  for(var i=0; i<len; i++) {
    sm = smData[i];
    a=a+'<tr>';
    a=a+'<td>'+sm.DST+'</td>';
    a=a+'<td>'+sm.SRC+'</td>';
    a=a+'<td>'+sm.CHANNEL+'</td>';
    msgs = sm.MSGS; //array of messages, each has an array of sub messages
    msgCnt = msgs.length;
    for(var j=0; j<msgCnt; j++) { //go through the sub messages
      submsg = msgs[i]; 
      subCnt = submsg.length;
      for(var k=0; k<subCnt; k++) {
        a=a+'<td>';
        if(k==0) a=a+'<strong>';
        a=a+submsg[k];
        if(k==0) a=a+'</strong>';
        a=a+'</td>';
      }
    }
    a=a+'</tr>';
  }
  a=a+'</table>';
  return a;
}

/*Creates and returns the XML HTTP Request object. Tries all known ways*/
function getHttpReqObject() {
  if(typeof XMLHttpRequest != 'undefined') //for all but Internet Explorer
    return new XMLHttpRequest(); 
  try { //Internet Explorer has two different ways. Try them both.
    return new ActiveXObject('Msxml2.XMLHTTP'); 
  } 
  catch(e) { 
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } 
    catch(e) {}
  } 
  return false; 
}

/*Query and load SM data from server*/
function loadIt() {
  xhr = getHttpReqObject(); //new XMLHttpRequest();
  xhr.open('GET',  'http://localhost:8888/sm?', true);
  //xhr.open("POST","name.asp",true); //sample POST
  //xhr.send("A=aa&B=bb"); //sample POST data
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function() {
    if(xhr.readyState==4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
      if(xhr.status==200) { //received ok
        s1 = xhr.responseText;
        ///smList = eval(s1);
        //sub1=["aa","bb","cc"]; msgs=[sub1,sub1]; sm1={"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":msgs}; sm2={"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":msgs}; smList = [sm1, sm2];
        //smList = [{"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":[["aa","bb","cc"],["aa","bb","cc"]]},{"CHANNEL":"ch","SRC":"sss","DST":"ddd","MSGS":[["aa","bb","cc"],["aa","bb","cc"]]}];
        s2 = formatSmDataList(smList);
        element = document.getElementById("adiv");
        element.innerHTML = s1; //s2;
      }
      else alert('-->Error. Got:'+xhr.statusText); //error occurred
    }
  };
  xhr.send(null);
}
