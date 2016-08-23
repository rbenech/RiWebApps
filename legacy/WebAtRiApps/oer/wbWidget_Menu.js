/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_Menu.js: Whiteboard Menu widget 
 * This represents a Menu widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_Menu = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  var menuTitle = null;
  var isTopMenu = false;

  //Closure function definitions:
  //-----------------------------

  /**Function getSelected: Returns currently selected value (or null if nothing is selected). 
   * This is called anytime an SM event occurs */
  var getSelected = function() {
    return null; //TODO
  };

  /** Function setContents */
  var setContents = function(val) {
    var elem, elemStyle, doc; //local vars
    
    doc = whiteboard.browserDocument;
    elem = doc.getElementById(this.widgetId);
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
    case 'owner': //check the owner. If is 'top' then this should be a pull down menu, else is a context menu
      //TODO: Java example, partially converted:
      //var ownerWidget = widgets[val];
      //if(typeof(ownerWidget)==='RtWidget_TopPane') { //then needs to be a pull down menu on RtPanel <----TODO: Check the syntax on this
      //  this.isTopMenu=true; //indicate that this needs to be a pulldown menu (set this before callng superclass as it will call addWidgetComponent)
      //}
      //whiteboard.executeCmd(this, cmd, val); //finish doing 'owner': sets the _parent
      break;
    case 'title':
      this.menuTitle = val;
      break;
    case 'value':
      //TODO: Java example:
      //RiString[] ra = RiString.getAsArray(val, (char)RiriSep.SEP3, -1); //auto-offset on leading separator
      //_parent._extrnlContextMenuActns = ra;
      //_menuValues = ra; //keep for local use (the other one is a problem if putting multiple menus on a single component (as in topMenu)
      break;
    default:
      wb.baseExecuteCmd(this, whiteboard, cmd, val);  //this message not handled here, let common actions have a go at it
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

}; //wb.Widget_Menu
