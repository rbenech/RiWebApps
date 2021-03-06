/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_Dialog.js: Whiteboard Dialog widget 
 * This represents a Dialog widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_Dialog = function(whiteboard, response) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  var widgetContents = null; //this is used as the button name (and value)
  var dialogType = null;

  //Closure function definitions:
  //-----------------------------

  /**Function getSelected: Returns currently selected value (or null if nothing is selected). This is called anytime an SM event occurs */
  var getSelected = function() {
    return null; //TODO
  };

  /** Function setContents */
  var setContents = function(val) {
    var elem, elemStyle; //local vars
    elem = whiteboard.browserDocument.getElementById(this.widgetId);
    if(elem) { //no reason for it not to exist, doConfigure creates it
      //TODO
    }
  }; //function

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    var elem, elemStyle, doc; //local vars
    doc = whiteboard.browserDocument;
    elem = doc.getElementById(this.widgetId);
    if(!elem) { //get existing html element or else make a new one
      elem = doc.createElement('div');
      elem.setAttribute('id', this.widgetId);
      elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio);
      //elemStyle += '; overflow:auto'; //auto or scroll here makes it have scrollbars
      elem.setAttribute('style', elemStyle);
    }
    doc.getElementById(whiteboard.rootDiv).appendChild(elem); //append the new element

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
    case 'type': //e.g. type=prompt
      this.dialogType = val;
      break;
    case 'selector': //selector=promptForInitials
      break;
    case 'selection': //selection=unknown
      break;
    case 'label': //label=Programmer Initials?
      break;
    case 'cookie': //cookie=key1
      break;
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

}; // wb.Widget_Dialog
