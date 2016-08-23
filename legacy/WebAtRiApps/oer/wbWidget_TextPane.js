/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_TextPane.js: Whiteboard TextPane widget 
 * This represents a TextPane widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_TextPane = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;

  //Closure function definitions:
  //-----------------------------

  /** Function getSelected: Returns value of selected element or null if nothing is selected. This is called anytime an SM event occurs */
  var getSelected = function() {
    return null; //TODO
  }
  //var getSelected = function() { return 'this is a test'; };

  /** Function setContents */
  var setContents = function(widgetId, val) {
    var elem, elemStyle; //local vars
    elem = whiteboard.browserDocument.getElementById(widgetId);
    if(elem) { //no reason for it not to exist, doConfigure creates it
      //elem.innerHTML='<pre style="border: solid 1px gray">'+val+'</pre>'; //text area w/border
      elem.innerHTML = val;
    }
  }; //function

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    var elem, elemStyle, doc; //local vars
    
    doc = whiteboard.browserDocument;
    elem = doc.getElementById(this.widgetId);
    if(!elem) { //get existing html element or else make a new one
      elem = doc.createElement('textarea');
      elem.setAttribute('id', this.widgetId);
      doc.getElementById(whiteboard.rootDiv).appendChild(elem); //append the new element
    }
    elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
    elemStyle += '; overflow:auto'; //auto or scroll here makes it have scrollbars
    elemStyle += '; border: solid 1px gray'; //add a border
    elem.setAttribute('style', elemStyle);

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
      case 'contents':
        setContents(this.widgetId, val);
        break;
  
      //TODO:
      //------------------------------
      case 'append':
      case 'checkformodified':
      case 'clear':
      case 'highlight':
      case 'insert':
      case 'position':
      case 'showit':
        break;
      //------------------------------
        
      default:
        wb.baseExecuteCmd(this, whiteboard, cmd, val); //this message not handled here, let common actions have a go at it
        break;
    }
  }; //function

  /**Accessor functions:*/
  var getWidgetId = function() { return this.widgetId; }
  var setWidgetId = function(id) { this.widgetId = id; } 
  var getParentWidget = function() { return this.parentWidge; }
  var setParentWidget = function(w) { this.parentWidget=w; }
  var getFrameRatio = function() { return this.frameRatio; }
  var setFrameRatio = function(f) { this.frameRatio=f; }

  /*---------------
   *closure return:
   *---------------*/
  return {

    //Public API (list variables and functions here to make them publicly available):
    //--------------------------------------------------------------------------------

    //Variables:

    //Functions:
    getWidgetId : getWidgetId,
    setWidgetId : setWidgetId,
    getParentWidget : getParentWidget,
    setParentWidget : setParentWidget,
    getFrameRatio : getFrameRatio,
    setFrameRatio : setFrameRatio,
    getSelected : getSelected,
    doConfigure : doConfigure,
    executeCmd : executeCmd
  }; //closure return

}; //wb.Widget_TextPane
