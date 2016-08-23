/*jslint devel: true, browser: true, evil: true, maxerr: 50 */

/**Creates and returns the XML HTTP Request object. Tries all known ways*/
function getHttpReqObject() {
  if(typeof XMLHttpRequest !== 'undefined') { return new XMLHttpRequest(); }//for all but Internet Explorer
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } //Internet Explorer has two different ways. Try them both.
  catch(e) { 
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } 
    catch(ex) {}
  } 
  return false; 
}

/**Returns the value of the radio button that is checked.
Returns an empty string if none are checked, or there are no radio buttons
*/
function getCheckedValue(radioObj) {
  var i;
  if(!radioObj) { return ""; }
  var radioLength = radioObj.length;
  if(radioLength === undefined) {
   if(radioObj.checked) { return radioObj.value; }
   else { return ""; }
  }
  for(i=0; i<radioLength; i++) {
   if(radioObj[i].checked) { return radioObj[i].value; }
  }
  return "";
}

/**Display the results of a KeyValues query*/
function formatKvInfo(data) {
  var aMap, ndxList, ndxMap, i;
  var a = "Key/Values Query. Got " + data.length + " Entries: <br />";
  a += "<ul>"; //unordered list
  i=1;
  for(ndxList in data) { //each entry in the list is a 'map' of key/vals
    a += "<li><b>#" + i + "</b>";
    aMap = data[ndxList];
    a += "<ol>"; //ordered list
    for(ndxMap in aMap) {
      a += "<li>" + ndxMap + ": " + aMap[ndxMap] + "</li>";
    }
    a += ("</ol>");
  }
  a += ("</ul>");
  return a;
}

/**Format the results of a KeyRange query*/
function formatKrInfo(data) {
  var ndx;
  //data = data[0]; //EXP###
  var a = "<p>Key/Range Query. Got " + data.length + " Entries:</p>";
  a += "<ol>"; //ordered list
  for(ndx in data) {
    a += "<li><b>" + ndx + ":</b> " + data[ndx] + "</li>";
  }
  a += "</ol>";
  return a;
}

/**Format the results of a Keys query*/
function formatKqInfo(data) {
  var i;
  var len = data.length;
  var a = "<p>Keys Query. Got " + len + " Entries:</p>";
  a += "<ol>"; //Unordered list
  for(i=0; i<len; i++) {
    a += "<li>" + data[i] + "</li>";
  }
  a += "</ol>";
  return a;
}

/**Format the results of an Object Attributes query*/
function formatKaInfo(data) {
  var i;
  var len = data.length;
  var a = "<p>Object Attributes Query. Got " + len + " Entries:</p>";
  a += "<ol>"; //Unordered list
  for(i=0; i<len; i++) {
    a += "<li>" + data[i] + "</li>";
  }
  a += "</ol>";
  return a;
}

/*Test use of guru query servlet via ajax*/
function loadIt() {
  var guruCmd = getCheckedValue(document.forms.radioForm.elements.querySel); //e.g. "KV", "KR", "KQ", "KA"
  //KV: key values query, KR: key range query, KQ: keys query, KA: keys all, i.e. object attributes query

  var xhr = getHttpReqObject(); //Tries all the known ways to create an XmlHttpRequest object
  var url = "/guru/query?";
  var guruQuery = "ri.sys.ObjClass=RiApplication";
  //var guruQuery = "ri.sys.ObjClass=RiDigitalPattern";
  var keysList = "ri.sys.Title,ri.sys.Name,ri.sys.Cid,ri.sys.Type";

  xhr.open("GET",  url + guruCmd + '&' + guruQuery + '&' + keysList, true); //KV, KR, KQ, KA test
  //xhr.open("GET", "/guru/sm?", true); //SM test

  //Set response type:
  //xhr.setRequestHeader('Accept', 'text/html');
  //xhr.setRequestHeader('Accept', 'application/xml');
  xhr.setRequestHeader('Accept', 'application/json');
  //xhr.setRequestHeader('Accept', 'text/plain');

  xhr.onreadystatechange = function() { //Set xhr response handler
    if(xhr.readyState === 4) { //readyState: 0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
      if(xhr.status === 200) { //Everything went ok
        var resp = xhr.responseText; //use the response string directly
        if(resp && resp.length>0) {
          //var cdiv = document.getElementById("commentDiv");
          //cdiv.innerHTML = "Resp_Raw=" + resp; //raw response
          //cdiv.innerHTML = "Resp_XML="+xhr.responseXML;

          //var json = eval(resp); //should work just fine this way but get an error on KR (which returns a json object {...}).
          var data = eval('['+resp+']')[0]; //throwing in this work-around for now: for some reason when eval a single returned object i.e. {...}, as from KR query, get an error. Wrapping it in '[]' and taking the 1st element: makes it work for now.
          
          var rdiv = document.getElementById("resultsDiv");
          switch(guruCmd) {
            case "KV": rdiv.innerHTML = formatKvInfo(data); break; //generate formatted html from given data
            case "KR": rdiv.innerHTML = formatKrInfo(data); break;  
            case "KQ": rdiv.innerHTML = formatKqInfo(data); break; 
            case "KA": rdiv.innerHTML = formatKaInfo(data); break; 
          }
        }
      }
      else { alert("Error: " + xhr.statusText); } //Error occurred
    }
  };
  xhr.send(null); //Send out the query
}

