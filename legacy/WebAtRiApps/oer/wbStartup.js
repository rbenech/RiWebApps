/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri*/ //for jslint

/**-----------------------------------------------------------------------------------------
  wbStartup.js
  This is the whiteboard application startup and initialization code.
  This should be listed last in the list of includes.
  12/28/2011 oer
  ------------------------------------------------------------------------------------------
*/

var ri = ri || {}; //namespace for the ri module

ri.verboseDebug = false; //if true then debug messages are emitted to the console
ri.messageExpand = false;  //if true then message arrays and objects are printed in expanded mode

/**This sets the 'verboseDebug' variable to match the web page. Verbose debug logs extra messages to the console*/
ri.setVerboseDebug = function() {
  "use strict"; //enable javascript strict mode
  
  var chkVerbose = document.getElementById('verboseDebug'); //get the html checkbox
  if(chkVerbose && chkVerbose.checked) { //if it exists and it's checked then enable verbose debug, otherwise disable it
    console.log('Verbose on');
    ri.verboseDebug=true; //if true then debug messages are emitted
  }
  else { //verbose debug disabled 
    console.log('Verbose off');
    ri.verboseDebug=false; 
  } 
};

/**This sets the 'messageExpand' variable to match the web page. Enabled expands objects and arrays when printed to console*/
ri.setMessageExpand = function() {
  "use strict"; //enable javascript strict mode
  
  var chkbox = document.getElementById('messageExpand'); //get the html checkbox
  if(chkbox && chkbox.checked) { //if it exists and it's checked then enable, otherwise disable
    console.log('Message expand on');
    ri.messageExpand=true; //if true then message arrays and objects are printed in expanded mode
  }
  else { //verbose debug disabled 
    console.log('Message expand off');
    ri.messageExpand=false; 
  } 
};



/**Initialize this application.
 * Called by onLoad and by html 'init' button. 
 * */
function doInit() {
  "use strict"; //enable javascript strict mode

  ri.setVerboseDebug(); //initialize verbose debug to match the web page setting (if any).
  ri.setMessageExpand(); //initialize message expand to match the web page setting (if any).
  smparse.doInit(); //initialize SM parse and webserver communications.
  wb.doInit(); //initialize widgets

  //See if the dom contains an auto-launch checkbox and it is selected:
  var autolaunchCheckbox = document.getElementById("autoLaunch"); 
  if(autolaunchCheckbox && autolaunchCheckbox.checked)
    smparse.doRtalkSubscribe();
}

function confirmExit(env) {
  return 'Are you sure you want to close (or reload) the main window?';
}

/**SAMPLE CODE. Called from html button: Initiate a "remote browser" session*/
function doRemoteBrowse() {
  "use strict"; //enable javascript strict mode
  //Note: smdst=00000000, smsrc=G8ZLJ3CAB45PE300, msgid=1?, src=G8ZLJ3CA
  riAjax.smPoll('%1ccode%1csubscribe%1ctopic=browser%1dview=browser%1dlibrary=GF10RC2A.093%1cG8ZLJ3CAB45PE309%1cbrowser'); 
}

/**Loading complete*/
window.onload = doInit; 

/**Confirm exit on unload (exit or reload)*/
window.onbeforeunload = confirmExit;
