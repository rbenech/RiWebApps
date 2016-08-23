
  /*-------------------------
    Run RiApplication
    History:
      6/2/11: ver6: fixed os id, added <thead><tbody> elements
      5/20/11: ver 5: Added divs for run status, and console (stdout/stderr). Added polling to show current status of application.
      5/15/11: ver 4. Displays only items relevant to current OS, can select the OS.
      5/11/11: ver 3. Reformatted to pass js_lint checks
      5/10/11: ver 2.
      5/9/11: initial release
     ---------------------------*/
  var _pollingIsAllowed=true; //true to allow polling to occur, false to completely disable all polling
  var _pollInterval=1000; //mS
  var _osType=""; //os version: win, os2, linux, mac, unix, all. Used to display selected subset of apps
  var _pollTimer; //timer used to trigger polling events
  var _pollingEnabled=false; //toggled automatically at runtime
  var consoleMsgs = new Array(); //list of message being displayed in the stdout/stderr/info console
  var maxConsoleMsgs=25; //max number of console messages to keep
    
  /**Creates and returns XML HTTP Request object. Tries all known ways*/
  function getHttpReqObject() {
    if(typeof XMLHttpRequest !== 'undefined') { return new XMLHttpRequest(); } //for all but Internet Explorer
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } //IE has two ways, try them both.
    catch(e) {
      try { return new ActiveXObject('Microsoft.XMLHTTP'); }
      catch(ex) {}
    }
    return false;
  }
  
  /**Given appOpSys, the os an application can run on (e.g. Win, Linux, OS2, All)
     Determines if that is included in the current value for _osType (e.g. win, linux, os2, mac, unix, all)
  */
  function showThisOne(appOpSys) {
    if(_osType === "all") { return true; } //showing all types
    appOpSys = appOpSys.toLowerCase();
    if(appOpSys === "all") { return true; } //given app runs on all os types
    if(_osType === appOpSys) { return true; } //given app matches currently selected os type
    return false; //do not display this entry
  }
  
  /**Format the list returned as a result of querying the available RiApplications.
   * kqvList contains key/values for each object in a list of matching objects.*/
  function formatRefresh(kvqList) {
    var i, j;
    var len = kvqList.length;
    if(len===0) { return; } //nothing to do
    var item = kvqList[0];
    var slen = item.length;
    var ndxTitle, ndxName, ndxVer, ndxOpSys, ndxStatus, ndxType;
    for(j=0; j<slen; j++) { //figure out indexes
      switch(item[j].key) {
        case "ri.sys.Title":   ndxTitle = j; break;
        case "ri.sys.Name":    ndxName  = j; break;
        case "ri.sys.Version": ndxVer   = j; break;
        case "ri.sys.OpSys":   ndxOpSys = j; break;
        case "ri.sys.Status":  ndxStatus= j; break;
        case "ri.sys.Type":    ndxType  = j; break;
      }
    }
    var sortNdx = ndxTitle; //Indicate which array index to sort on
    kvqList.sort( function(a,b) { return (a[sortNdx].value > b[sortNdx].value); }); //sort displayed elements

    var a=''; //the html buildup string
    a+='<table id="apps" class="tablesorter" border="0" cellpadding="0" cellspacing="1"><thead>';
    a+='<tr><th>App Title</th><th>App ID</th><th>Version</th><th>OS</th></tr></thead><tbody>';
    for(i=0; i<len; i++) { //for each object represented in kvqlist
      item = kvqList[i];
      var opSys = item[ndxOpSys].value;  //ri.sys.OpSys = All, Win, Linux, OS2
      if(showThisOne(opSys)) {
        var title = item[ndxTitle].value;  //ri.sys.Title =  e.g. Guru Browser
        var name  = item[ndxName].value;   //ri.sys.Name = e.g. GEU43Y2A
        var ver   = item[ndxVer].value;    //ri.sys.Version = e.g. 1
        var status= item[ndxStatus].value; //ri.sys.Status = Alpha, Beta, Released
        var type  = item[ndxType].value;   //ri.sys.Type = stv, java13, java14, java16, vast55, vast60
        var hoverText = (opSys==="All" ? "All Systems" : opSys)+', '+type+', '+status;
        a+='<tr>';
        a+='<td><a href=javascript:runit("' + encodeURI(title) + '","' + opSys + '"); title="' + hoverText + '">' + title + '</a></td>';
        a+='<td>'+name+'</td>';
        a+='<td>'+ver+'</td>';
        a+='<td>'+opSys+'</td>';
        a+='</tr>\n';
      }
    }
    a+='</tbody></table>';
    return a;
  $("#apps").tablesorter({sortList: [[0,0], [1,0]]}); 
  }
  
  /**Format the map returned as a result of running an RiApplications*/
  function formatRunResults(guruKeys) {
    var i;
    var title='Running:';
    var a='';
    a+='<br /><h3><center>'+title+'</center></h3>';
    a+='<br /><center><table border="1">';
    var len = guruKeys.length;
    for(i=0; i<len; i++) { //for each entry
      var item = guruKeys[i];
      var key = item.key;
      var val = item.value;
      switch(key) { //skip certain keys:
        case 'SIGN': case 'SIGNER': case 'AttrHash': case 'ObjHash': case 'ri.sys.ObjFormat': 
        case 'ri.sys.Obsoleted': case 'ri.sys.RiPermission':
          break; //do nothing
        default:
          a+='<tr><td>'+key+'</td><td>'+val+'</td></tr>\n';
          break;
      }
    }
    a+='</table></center>\n';
    return a;
  }
  
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
    _pollingEnabled = false;
/*disable for now, anyway when timer fires, if disabled then is simply ignored in pollIt function
    if(_pollTimer) {
      _pollTimer.clearTimeout(); //stop the timer //this causes a problem?
      _pollTimer=undefined; //this causes a problem?
    }
*/
  }

  /**Receives a json array of poll response messages*/
  function formatPollResponse(msgs) {
    var ndx;
    for(ndx in msgs) {
        var msg = msgs[ndx];
        if(msg.type==='status') {
          document.getElementById("divStatus").innerHTML = 'Status: '+msg.value;
          if(msg.value.toLowerCase().indexOf('terminated') >= 0) { //program terminated
          stopPolling();
            document.getElementById("divDescrip").innerHTML = '';
          }
        }
        else {
          var color;
          switch(msg.type) {
            case 'stdout': color='black';   break;
            case 'stderr': color='red';     break;
            case 'info':   color='#0033FF'; break; //blue
          default:       color='#00CC33'; break; //green
          }
          consoleMsgs.push('<span style="color:'+color+'">'+msg.value+'</span><br />');
        }
      }
    var a = '';
    while(consoleMsgs.length > maxConsoleMsgs) { consoleMsgs.shift(); } //remove the old messages
    for(ndx in consoleMsgs) {
      a += consoleMsgs[ndx];
    }
    document.getElementById("divConsole").innerHTML = a; //TODO: add scrollbar
    
  }
  
  function pollIt() {
    if(_pollingEnabled===false) return; //i.e. polling was turned off after timer had already been set.
    var xhr = getHttpReqObject();
    var query = '/guru/query?poll';
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          var resp = xhr.responseText;
          if(resp && resp.length > 0) { //if got something
            var msgs = eval(resp);
            formatPollResponse(msgs);
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
 
  /**Update the list of available entries*/
  function refresh() {
    stopPolling();
    var xhr = getHttpReqObject();
    var query = '/guru/query?KV&ri.sys.ObjClass=RiApplication&ri.sys.Title,ri.sys.Name,ri.sys.Version,ri.sys.OpSys,ri.sys.Status,ri.sys.Type';
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          var kvqList = eval(xhr.responseText);
          document.getElementById("divAppsList").innerHTML = formatRefresh(kvqList);
        }
        else { alert('Error performing refreshing: '+xhr.statusText); } //error occurred
      }
    };
    xhr.send(null);
  }
 
  /**Executes RiApplication with the specified value for ri.sys.Title*/
  function runit(runTitle, opSys) {
    stopPolling();
    var xhr = getHttpReqObject();
    var query = '/guru/query?exec&ri.sys.ObjClass=RiApplication,ri.sys.Title='+encodeURI(runTitle)+',ri.sys.OpSys='+opSys;
    xhr.open('GET', query, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState===4) { //0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Completed
        if(xhr.status===200) { //received ok
          var guruKeys = eval(xhr.responseText);
          document.getElementById("divDescrip").innerHTML = formatRunResults(guruKeys);
          startPolling();
        }
        else { alert('Error executing application: '+xhr.statusText); } //error occurred
      }
    };
    xhr.send(null);
  }
 
  /**Returns the current operating system: "win", "os2", "mac", "linux", "unix"*/
  function setOsTypeToMatchCurrentOs() {
    if(_osType) { return _osType; }
    var info = navigator.appVersion;
    if      (info.indexOf("Win")   > -1) { _osType="win";   }
    else if (info.indexOf("OS/2")  > -1) { _osType="os2";   }
    else if (info.indexOf("Mac")   > -1) { _osType="mac";   }
    else if (info.indexOf("Linux") > -1) { _osType="linux"; }
    else if (info.indexOf("X11")   > -1) { _osType="linux";  }
    else                                 { _osType="-";     } //unknown
    //document.getElementById("divDebug").innerHTML = '<h2>'+_osType+'</h2>'; //debug
    return _osType;
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

  /**Called when user clicks on osType radio button to select displayed os type*/
  function setSelectedOs() {
    _osType = getCheckedValue(document.forms.radioForm.elements.osSel);
    refresh();
  }
  
  /**Called on initial load to perform initial setup*/
  function doInit() {
    setOsTypeToMatchCurrentOs(); //initialize _osType to match current os
    setCheckedValue(document.forms.radioForm.elements.osSel, _osType); //select the radio button corresponding to the current OS
    refresh();
  }
  