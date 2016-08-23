/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_Button.js: Whiteboard button widget 
 * This represents a button widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_Button = function(whiteboard) {

  "use strict"; //enable javascript strict mode

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;

  var widgetContents = null;     //this is used as the button name (and value)
  var selectionGroup = null;     //if this button is part of a selection group (like a set of radio buttons) then this will have a list of entries of the widget ids (not including self)
  var initiallySelected = false; //true if this button is to be initially selected
  var buttonStyle = null;        //set from sm: radio, checkbox,... (currently ignored)
  var buttonType = null;         //set from sm: momentary

  //Closure function definitions:
  //-----------------------------

  /** Function getSelected: Returns button's value if is currently selected, else returns null. This is called anytime an SM event occurs */
  var getSelected = function() {
    var buttonElem = whiteboard.browserDocument.getElementById(this.widgetId);
    if(!buttonElem) { return false; }
    var retval=null;
    if(buttonElem.checked) 
      retval = this.widgetContents;
    return retval;
  };

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    var parentElem = null, singleSelect, nm, nmStr, butnElem, elemStyle; //local vars
    
    this.singleSelect = true; //default is a single select toggle button
    if(this.buttonType === 'momentary') {
      this.singleSelect = false;
    }
    else if(this.buttonStyle === 'radio' || this.buttonStyle === 'checkbox') {
      this.singleSelect = true;
    }
    else if(this.selectionGroup === null || this.selectionGroup.length === 0) {
      this.singleSelect = false;
    }
    if(this.parentWidget) { //if have a parent widget
      parentElem = whiteboard.browserDocument.getElementById(this.parentWidget.widgetId); //get id of parent (usu. a group pane)
    }

    if(!parentElem) { //i.e. no parent html element. If don't have a parentElem then just throw it into the top pane?
      var doc = whiteboard.browserDocument;
      parentElem = doc.createElement('div');
      parentElem.setAttribute('id', 'butnParent_' + this.widgetId); //note: this cannot be widgetId so appending some text in front just to make it differentiable from the button id
      doc.getElementById(whiteboard.rootDiv).appendChild(parentElem); //append the new element
    }
    nm = riri.riStringCheckAndConvert(this.widgetContents); //riString (or string)
    if(!nm) nm = '';
    nmStr = (nm.text != null) ? nm.text : nm; // //NOTE: != on purpose. Depending on auto-promotion here. Get the string only portion (in case is an riString)
    elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"

    var doc = whiteboard.browserDocument;
    butnElem = doc.getElementById(this.widgetId); //see if this item already exists
    if(!butnElem) {
      butnElem = doc.createElement('input'); //make an element representing this button
      butnElem.setAttribute('id', this.widgetId);
    }

    //Set up the button, like: '<input type="button" onclick="whiteboard.emitSmEvent('nm')" id="'widgetId'" value="'nmStr'"/>'
    if(this.singleSelect) { //make it a radio button
      butnElem.setAttribute('type', 'radio');
      butnElem.setAttribute('name', parentElem.widgetId); //radio buttons need a name in common so use parent id. 
              //TODO: technically this is not correct. This is just setting all buttons that are
              //  'singleSelect' and that are in the same panel as being in the same selection group. 
              //  This is just inherited from the old way where the parent panel defined the selection group. 
              //  The correct way is to use 'selectionGroup' (e.g. '10,11,12') as the common name (see java version).

      //For radio buttons putting a label and the button in a div seems to be the best way to ensure the label is visible in all browsers:
      var lbl = document.createElement('label'); //doing this seems to ensure the radio buttons always get their labels
      //lbl.setAttribute('for', this.widgetId); //assign the text node to go with the radio button (this one is for non-IE)
      //lbl.setAttribute('htmlFor', this.widgetId); //assign the text node to go with the radio button (this one is for IE)
      //var textNode = document.createTextNode(nmStr); //displayed button text
      //lbl.appendChild(textNode);
      lbl.innerHTML = nmStr; //displayed button text. this seems to work just as well as creating a textNode and appending it to the label

      var aDiv = whiteboard.browserDocument.createElement('div'); //put the button and label in a div
      aDiv.setAttribute('style', elemStyle); //in this case the div gets the styling instead of the button
      aDiv.appendChild(lbl);
      aDiv.appendChild(butnElem);
      parentElem.appendChild(aDiv); //add this element to parent
    }
    else { //make it a regular button
      butnElem.setAttribute('type', 'button');
      butnElem.setAttribute('value', nmStr); //displayed button text
      butnElem.setAttribute('style', elemStyle);
      parentElem.appendChild(butnElem); //add this element to parent
    }
    ///butnElem.setAttribute('onclick', 'whiteboard.emitSmEvent("'+this.widgetId+'","'+riutil.getAsRiStringWithHeader(nm)+'")' ); //<--This no work. See below.

    if(this.initiallySelected) {
      butnElem.setAttribute('checked', true); //TODO: I don't think this is correct but seems to work. Wanting effectively: <input type="" value="" checked>
    }

    var wdgtId = this.widgetId; //(one way to get the right value into the closure below)
    
    butnElem.onclick = function() { //emit sm event when button is clicked
      whiteboard.emitSmEvent(wdgtId, riutil.getAsRiStringWithHeader(nm)); //<--This version works in the new window whereas the inline 'onclick' does not (that version worked when all shared a common window)
    }; 

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
    case 'contents':
      this.widgetContents = val;
      break;
    case 'selected': //selected=true indicates this button should begin its life in the selected state
      if(val === 'true') {
        this.initiallySelected = true;
      } //indicates the button should begin its life as 'selected'
      break;
    case 'selectiongroup': //list of members in the selectiongroup (not including this one)
      this.selectionGroup = val;
      break;
    case 'style': //e.g. style=checkbox, radio
      this.buttonStyle = val;
      break;
    case 'type': //e.g. type=momentary
      this.buttonType = val;
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
    selectionGroup : selectionGroup,
    getSelected : getSelected,
    doConfigure : doConfigure,
    executeCmd : executeCmd
  }; //closure return

}; //wb.Widget_Button
