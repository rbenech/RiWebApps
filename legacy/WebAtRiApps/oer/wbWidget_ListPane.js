/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_ListPane.js: Whiteboard ListPane widget 
 * This represents a ListPane widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_ListPane = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  var lastSelectedValue = null;

  //Closure function definitions:
  //-----------------------------

  /** Function getSelected: Returns value of selected element or null if nothing is selected. 
   * This is called anytime an SM event occurs */
  var getSelected = function() {
    return lastSelectedValue;
  };

  /** Function setContents. given parameter 'contents' is a list of RiStrings: QAAAitem1, QAAAitem2,... */
  var setContents = function(widgetId, contents) {
    var elem, elemStyle, a, ndx; //local vars

    elem = whiteboard.browserDocument.getElementById(widgetId);
    if(elem) { //no reason for it not to exist, doConfigure creates it
      
      //TODO: need to assign 'lastSelectedValue'
      
      //elem.setAttribute('onclick', 'whiteboard.emitSmEvent("'+widgetId+'","'+riutil.getAsRiStringWithHeader(lastSelectedValue)+'")' ); //when list is clicked, emit sm event
      elem.onclick = function() { //emit sm event when list element is selected
        whiteboard.emitSmEvent(widgetId, riutil.getAsRiStringWithHeader(lastSelectedValue)); //<--This version works in the new window whereas the inline 'onclick' above, does not (that version worked when all shared a common window)
      }; 

      a = '<ul style="border: solid 1px gray">'; //html list with border
      //a ='<ul>'; //html list no border
      for(ndx in contents) { //fill in the list
        //a+=getRiStringAsLi(contents[ndx]); //this way has list bullets
        a += riutil.getRiStringAsSpan(contents[ndx]) + '<br />'; //this gets rid of list bullets
      }
      a += '</ul>';
      elem.innerHTML = a;
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
    }
    elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
    elemStyle += '; overflow:auto'; //auto or scroll here makes it have scrollbars
    //elemStyle += ' border:solid 1px gray;">'; //add a border. For some reason this doesn't work. Seems to work better to add border to list itself
    elem.setAttribute('style', elemStyle);

    //elem.setAttribute('onclick', 'whiteboard.emitSmEvent("'+this.widgetId+'","'+riutil.getAsRiStringWithHeader(this.lastSelectedValue)+'")' ); //when list is clicked, emit sm event (also need to assign lastSelectedValue here)
    doc.getElementById(whiteboard.rootDiv).appendChild(elem); //append the new element

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
    case 'contents':
      setContents(this.widgetId, val.contents);
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

}; //wb.Widget_ListPane
