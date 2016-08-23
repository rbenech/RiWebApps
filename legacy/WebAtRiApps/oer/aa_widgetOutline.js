//Outline of wbWidgets.js:
/*

var ri = {      //namespace for the ri module
  widget = {}   //namespace for the whiteboard widgets module
  riri = {}     //namespace for the RIRI module
  smparse = {}  //namespace for the SM parsing module
  turtle = {}   //namespace for the turtle graphics module
  util = {}     //namespace for the utilities module
};

//module definition
ri.widget = (function () {
  "use strict"; //enable javascript strict mode

  //Dependencies:
  //------------------------
  ...
  
  //Closure local variables:
  //------------------------
  ...

  //Closure method definitions:
  //------------------------

  var Whiteboard = function(smChannel, rootDiv, browserDocument, browserWindow) {
    
    //Local variables:
    ...
     
    //Method definitions:
      
     var emitSmEvent = function(widgetId, eventString, mouseEventName) {...}
     
     var emitSmForDialogEvent = function(selector, value, cookie, responseChannel) {...}

     var emitSmEvent_UsingLowLevelSeps = function(widgetId, eventString, mouseEventName) {...}
     
     var getAsRiStringWithHeader = function(s) {...}
     
     var whiteboard.executeCmd = function(widget, cmd, val) {...}

     //Button Constr
     var RtWidget_Button = function() {
       this.getSelected = function() {...};
       this.doConfigure = function() {
         ...
         delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
       }; //function
       
       this.executeCmd = function(cmd, val) {...}; //function
     };
     
     
     //Dialog Constr
     var RtWidget_Dialog = function(response) {...};

     //GroupPane Constr
     var RtWidget_GroupPane = function() {...};
     
     //ListPane Constr
     var RtWidget_ListPane = function() {...};
     
     //Menu Constr
     var RtWidget_Menu = function() {...};

     //PanelPane Constr
     var RtWidget_PanelPane = function() {...};
     
     //TreePane Constr
     var RtWidget_TreePane = function() {...};
     
     //TopPane Constr
     var RtWidget_TopPane = function() {...};
     
     // -----------------------
     // End Widget definitions
     // -----------------------
     
     var createWidget = function(rtClassType, response) {...};
     
     var getWidgets = function() {...};

     var getBrowserDocument = function() {...};

     var getBrowserWindow = function() {...};
     
     //---------------
     //closure return:
     //---------------
     return {
       createWidget: createWidget,
       getWidgets: getWidgets,
       getBrowserDocument: getBrowserDocument,
       getBrowserWindow: getBrowserWindow
     };
     
  }; //constr Whiteboard
  
  
  var receiveCreateWidgetEvent = function(nameAndSettings) {...};
  
  var receiveCommandEvent = function(nameAndSettings) {...};
  
  var addWhiteboard = function(smChannel, rootDiv, browserDocument, browserWindow) {...};
  
  var doFinalize = function() {...};

  var doInit = function() {...};
  
  //---------------
  //closure return:
  //---------------
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    addWhiteboard: addWhiteboard,       //adds to the list of whiteboards (called by smParse)
    selectWhiteboard: selectWhiteboard, //selects the currently active whiteboard (from the 'whiteboards' map)
    //emitSmEvent: emitSmEvent,         //used by turtlePanel <--FIX THIS
    doInit: doInit                      //called by wbStartup
    
  }; //closure return
  
}()); //namespace ri.widget

*/
