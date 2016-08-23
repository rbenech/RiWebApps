/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_TopPane.js: Whiteboard TopPane widget 
 * This represents a TopPane widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_TopPane = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  var attribs = null; //for topPane these are essentially cookies provided by the model, and returned on selection events

  //Closure function definitions:
  //-----------------------------

  /**Function getSelected: Returns currently selected value (or null if nothing is selected). This is called anytime an SM event occurs */
  var getSelected = function() {
    return null; //TODO
  };

  /**For topPane these are essentially a cookies provided by the model, and returned on selection events*/
  var getAttributes = function() {
    return this.attribs;
  };

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    var doc;
    
    switch(cmd) {
    case 'clearattributes':
      this.attribs = null;
      break;
    case 'label': //set the title for whatever is the enclosing Frame or dialog
      doc = whiteboard.browserDocument;
      doc.title = val; //set browser title
      ///doc.getElementByID(whiteboard.rootDiv).title = val; //set Root Div Title. TODO: TEST THIS, added from merge w/rjb code on 5/17/12
      //TODO?: send SM to update button text on the guru panel itself? (prob. need a hook in servlet for this). Without sm's would be CMD_SEND to 255 (no response): "AS,ButtonText=val"
      break;
    case 'model': //the SM response channel to use when talking back to the model (on the other end of this conversation)
      whiteboard.modelSmChannel = val;
      break;
    case 'attribute': //for topPane, attributes are provided by the model and returned on selection events.
      if(!this.attribs) {
        this.attribs = {};
      } //create if needed
      var pos = val.indexOf('='); //extract either 'cmd=val' or else 'cmd':
      var c, v;
      if(pos < 0) {
        c = val;
        v = '';
      }
      else {
        c = val.substring(0, pos);
        v = val.substring(pos + 1);
      }
      this.attribs[c] = v;
      break;

    case 'type':
      break; //not used for anything?

    case 'windowsize': //specified the size of the window (in characters)
      var pos = val.indexOf('@'); //windowsize=width@height in terms of characters
      if(pos < 0) break; //ignore entry if not formatted correctly
      var fontSz = riutil.getDefaultFontSize(); //quick and dirty function to get a value for default font size
      var w = val.substring(0, pos) * fontSz.width;
      var h = val.substring(pos + 1) * fontSz.height;
      window.resizeTo(w, h); //TODO: this is not doing any actual window resize
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

}; //wb.Widget_TopPane
