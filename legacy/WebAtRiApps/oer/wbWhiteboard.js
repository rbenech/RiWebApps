/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWhiteboard.js: Whiteboard object
 * 
 * History: 
 *   10/24/2013 oer: 
 *     -Created 
 * -----------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

wb.whiteboards = {};           //each entry in this map is a whiteboard, accessed by smChannel
wb.currentWhiteboard = null;   //currently active whiteboard (from the 'whiteboards' map)
wb.createEventsHandle = null;  //publish/subscribe handle for create events
wb.commandEventsHandle = null; //publish/subscribe handle for command events
wb.nameNdx = 1;                //index used to make up identifier names when non is provided (currently used for buttons 5 & 6) (TEMP DEBUG)


/**
 * Constr for creating a Whiteboard. This holds a set of widgets and their settings. 
 * It also points to the browser window in which they are all located.
 * 
 * Parameters: 
 *   -smChannel: The SM channel that messages to this whiteboard come in on. 
 *   -rootDiv: Name of the html div to use as the root in the browser document. 
 *   -browserDocument: The browser window.document used to interface with the browser. 
 *   -browserWindow: The browser window itself (optional). Can be used to resize or position the browser.
 */
wb.Whiteboard = function(smChannel, rootDiv, browserDocument, browserWindow) {
  "use strict"; //enable javascript strict mode

  //Dependencies:
  //------------------------

  
  //Closure local variables:
  //------------------------
  var widgets = {}; //the widgets for the currently active whiteboard. The different ones of these are stored in 'whiteboards' above
  var modelSmChannel=null; //The SM channel of the rtalk 'model' on the other end of the conversation with this whiteboard. This is set by a message to the 'top' panel

  //Closure method definitions:
  //------------------------

  /**
   * Sends back an SM with the event item as well as all other selected items (as required for select events). 
   * Emits an SM of the form:
   *   SM...^event+widget=ID+channel=CHANNELNAME+selection=SELECTION+selection1=SELECTION+selection3=SELECTION... 
   * Where ^ + represent RIRI separators. 
   * Note: selection values are generally RiStrings, occasionally regular strings. 
   * This version does high level assembly of the SM (no RIRI separators)
   */
  var emitSmEvent = function(widgetId, eventString, mouseEventName) {
    var eventMsg, ndx, sel, smDst, smSrc, w, attrs, attrNdx; //local vars
  
    if(ri.verboseDebug) {
      riutil.emitStatus('Event from widget ' + widgetId + ': ' + eventString);
    } //debug
  
    eventMsg = [ 'event', 'widget=' + widgetId, 'channel=' + smChannel, 'selection=' + eventString ]; //assemble the SM message
    //portion
    if(mouseEventName) {
      eventMsg.push('mouse=' + mouseEventName);
    }
  
    var widget = this.widgets[widgetId];
    if(widget && widget.selectorAttribute) { //if this widget defines a 'selector' attribute include it in the emitted event
      eventMsg.push('selector=' + widget.selectorAttribute);
    }
  
    for(ndx in this.widgets) { //see if any other widgets have selections
      if(this.widgets.hasOwnProperty(ndx)) { //make jslint happy
        w = this.widgets[ndx];
        if(w.getSelected) { //if this widget defines a getSelected function.
          sel = w.getSelected(); //returns null if nothing is selected
          if(sel) {
            eventMsg.push('selection' + w.widgetId + '=' + sel);
          } //if this widget is participating in the selection event, add to the SM message
        }
        if(w.getAttributes) { //if this widget defines a getAttributes function.
          attrs = w.getAttributes(); //returns null if no attributes available
          if(attrs) { //if this widget is participating in the selection event, add to the SM message
            for(attrNdx in attrs) {
              eventMsg.push(attrs[attrNdx]);
            }
          }
        }
      }
    }
  
    smDst = '00000000'; //broadcast for now
    smSrc = smChannel; //optional, this can also just be blank
    riri.sendSm(smparse.getWebSkt(), smDst, smSrc, this.modelSmChannel, riri.toRiri(eventMsg)); //convert message to RIRI (at the default separator level of 2), then send it out
  }; //function emitSmEvent
  
  
  /**
   * SM event send method used by Dialogs to provide the user selection back to the model. 
   * Example: ^event+selector=changeStateImmediate+value=42.7+cookie=RfMeasure1~Receiver control~Frequency
   */
  var emitSmForDialogEvent = function(selector, value, cookie, responseChannel) {
    var myChannel, eventMsg, smDst, smSrc;
    eventMsg = [ 'event', 'selector=' + selector, 'channel=' + smChannel, 'value=' + value, 'cookie=' + cookie ];
  
    smDst = responseChannel; //'00000000';
    smSrc = smChannel; //optional, this can also just be blank
    riri.sendSm(smparse.getWebSkt(), smDst, smSrc, this.modelSmChannel, riri.toRiri(eventMsg)); //convert message to RIRI (at the default separator level of 2), then send it out
  }; //function emitSmForDialogEvent
  
  
  /** This is the same thing as above but creates the message directly using low level RIRI separators */
  var emitSmEvent_UsingLowLevelSeps = function(widgetId, eventString, mouseEventName) {
    var eventMsg, ndx, sel, smDst, smSrc, w; //local vars
  
    if(ri.verboseDebug) {
      riutil.emitStatus('Event from widget ' + widgetId + ': ' + eventString);
    } //debug
    eventMsg = RIRISEP2 + 'event' + RIRISEP2 + 'widget=' + widgetId + RIRISEP2 + 'channel=' + smChannel + RIRISEP2 + 'selection=' + eventString; //assemble the SM message portion
    if(mouseEventName) {
      eventMsg += +RIRISEP2 + 'mouse=' + mouseEventName;
    }
    for(ndx in this.widgets) { //see if any other widgets have selections
      w = this.widgets[ndx];
      if(w.getSelected) { //if this widget defines a getSelected function.
        sel = w.getSelected(); //returns null if nothing is selected
        if(sel) {
          eventMsg += RIRISEP2 + 'selection' + w.widgetId + '=' + sel;
        } //if this widget is participating in the selection event, add to the SM message
      }
    }
  
    smDst = '00000000'; //broadcast for now
    smSrc = smChannel; //optional, this can also just be blank
    riri.sendSm(smparse.getWebSkt(), smDst, smSrc, this.modelSmChannel, eventMsg); //send out the SM
  }; //function emitSmEvent_UsingLowLevelSeps
  
  
  /**
   * This handles actions that are common to all RtWidgets, e.g: TopPane, SubPane, ListPane, TextPane, GroupPane, Menu, Button, ...
   */
  wb.baseExecuteCmd = function(widget, whiteboard, cmd, val) {
    "use strict"; //enable javascript strict mode

    switch(cmd) {

      //TODO:
      //-----------------------------------------------------------------------------
      case 'forecolor': break;
      case 'backcolor': break;
      case 'disable': break;
      case 'enable': break;
      case 'enableevent': break; //NEW?
      case 'events': break; //OLD?
      case 'name': break; //is this one used for anything?
      case 'readonly': break;
      case 'selectionpane': break;
      case 'vscroll': break; //currently scrollbars are handled automatically
      case 'checkformodified': break;
      case 'selectiongroup': break;
      //-----------------------------------------------------------------------------

      case 'frameratio': //set size: 10;50;100;5: left;right;top;bottom as a percentage of parent window size. 0,0 is bottom left
        widget.setFrameRatio(riutil.getFrameRatioFor(val));
        break;

      case 'hscroll':
        break; //srollbars are handled automatically

      case 'identifier': //the id for this widget. Note: If never get an id then it never goes in the widgets list so it cannot be referenced later on.
        widget.setWidgetId(val);
        whiteboard.widgets[val] = widget; //add to widgets for this whiteboard
        widget.receiveWidgetEvents = function(settings) { //function to receive widget events from SM. Called by dojo.subscribe
          var cmdVal; //local vars
          for(cmdVal in settings) { //parse through the settings to configure this widget
            widget.executeCmd(cmdVal.toLowerCase(), settings[cmdVal]);
          }
        }; //function
        widget.unsubscribeFromEvents = function() { //function to cause this widget to unsubscribe from dojo events generated by SM
          if(widget.eventsHandle) {
            dojo.unsubscribe(widget.eventsHandle);
            widget.eventsHandle = null;
            if(ri.verboseDebug) {
              riutil.emitStatus('Widget ' + widget.widgetId + ' unsubscribed from dojo events');
            } //debug
          }
        }; //function
        widget.eventsHandle = dojo.subscribe('wbWdgt_' + whiteboard.smChannel + '_' + val, widget.receiveWidgetEvents); //register for sm generated events using the given identifier
        break;

      case 'selector': //this is an attribute sent on widget definition that is returned whenever events are generated
        widget.selectorAttribute = val;
        break;

      case 'owner':
        widget.setParentWidget(whiteboard.widgets[val]); //set the widget's value for who its parent is
        //TODO?: ownerWidget.addWidgetComponent(widget); //needed for javascript? add this widget to component view of the parent
        break;

      default:
        //TODO: try deleting widget name in smParse when event is generated. If that doesn't work then just use this to ignore the widget name entry here: ###
        if(whiteboard.widgets[cmd]) {
        } //ignore. This is a kludge to eliminate warning just because the widget name is always in the list
        else {
          console.log('>Warning: unrecognized message (id=' + widget.widgetId + ') cmd=' + cmd + ', val=' + riutil.getObjAsString(val));
        }
        break;
    }
  }; //function baseExecuteCmd

  
  /**Make a widget. rtClassType, e.g. Button, GroupPane, ListPane, Menu, PanelPane, TextPane, TopPane, TreePane, Worksheet
   * Note: This makes a widget.
   * */
  var createWidget = function(rtClassType, response) {
    var ndx; //local vars
  
    if(!rtClassType) { return; }
    
    switch(rtClassType.toLowerCase()) { //using lowercase compares
    
      case "button":    return new wb.Widget_Button(this);
      case "dialog":    return new wb.Widget_Dialog(this, response);
      case "grouppane": return new wb.Widget_GroupPane(this);
      case "listpane":  return new wb.Widget_TreePane(this); //RtWidget_ListPane(); //DEBUG: for now just use TreePane for both
      case "menu":      return new wb.Widget_Menu(this); 
      case "panelpane": return new wb.Widget_PanelPane(this);
      case "textpane":  return new wb.Widget_TextPane(this);
      case "treepane":  return new wb.Widget_TreePane(this);
      
      case "toppane":
        //for now: whenever a topPane message is received, clear everything out and start over:
        var tpElem = browserDocument.getElementById(rootDiv);
        if(tpElem.hasChildNodes()) { //remove all child nodes
          while(tpElem.childNodes.length >= 1) {
            tpElem.removeChild(tpElem.firstChild);       
          }
        }
        for(ndx in this.widgets) { //if there are any widgets in this whiteboard, and any are subscribed, then unsubscribe them
          if(this.widgets[ndx].unsubscribeFromEvents) {
            this.widgets[ndx].unsubscribeFromEvents();
          }
          delete this.widgets[ndx]; //remove the widget from this whiteboard
        }
        return new wb.Widget_TopPane(this);
        
      default:
        console.log('>Error: Unable to create item of class type: '+rtClassType);
        return null; //no widget definition
    }
  }; //function createWidget
    
    
  /*---------------
   *closure return:
   *---------------*/
  return {
    //Variables:
    widgets : widgets,
    modelSmChannel : modelSmChannel,
    rootDiv : rootDiv,
    browserDocument : browserDocument,
    browserWindow : browserWindow,
    
    //Functions:
    emitSmEvent : emitSmEvent,
    emitSmForDialogEvent : emitSmForDialogEvent,
    emitSmEvent_UsingLowLevelSeps : emitSmEvent_UsingLowLevelSeps,
    smChannel : smChannel,
    createWidget : createWidget,
  };

}; //constr Whiteboard


/**
 * Called when a 'create' event is received from smParse. 
 * Receives a list: [rtClassName, settings, response] 
 *   rtClassName: e.g. TopPane, Menu, LispPane, TextPane, GroupPane, Button, ... 
 *   settings: a collection of key=values to configure widget 
 *   response: (optional) response channel (used for dialog boxes)
 */
wb.receiveCreateWidgetEvent = function(nameAndSettings) {
  var rtClassType = null, settings = null, response = null, widget, cmd; //local vars

  var argCnt = nameAndSettings.length;
  if(argCnt > 0) {
    rtClassType = nameAndSettings[0];
  }
  if(argCnt > 1) {
    settings = nameAndSettings[1];
  }
  if(argCnt > 2) {
    response = nameAndSettings[2];
  } //used by dialogs to indicate the response channel

  if(!wb.currentWhiteboard) { //just a check to ensure there is a current whiteboard
    riutil.emitStatus('>Error: received a createWidget event on a null whiteboard');
    return;
  }

  widget = wb.currentWhiteboard.createWidget(rtClassType, response);
  if(widget) { //if a widget was created
    
    if(!settings.identifier) { //if widget has no name then make one up (just in case) 
      settings.identifier = 'madeUpName' + (wb.nameNdx++); 
    } 
    
    for(cmd in settings) { //configure the widget by going through each of the settings
      widget.executeCmd(cmd.toLowerCase(), settings[cmd]);
    }
  }
}; //function


/**
 * Called when a 'command' event comes in from smParse. 
 * Receives a list: [commandName, settings] 
 *   commandName: e.g. createView, top 
 *   settings: a collection of key=values
 */
wb.receiveCommandEvent = function(nameAndSettings) {
  var commandName, settings, ndx, w, widgetId, elem; //local vars
  commandName = nameAndSettings[0];
  settings = nameAndSettings[1];

  if(!wb.currentWhiteboard) { //just a check to ensure there is a current whiteboard
    riutil.emitStatus('>Error: received Command event on a null whiteboard: "' + commandName + '(' + settings + ')' + '"');
    return;
  }

  if(commandName === 'createView') { //finalize the layout
    var widgets = wb.currentWhiteboard.widgets;

    for(ndx in widgets) { //EXPERIMENT: pre-configure group panes
      w = widgets[ndx];
      if(w.doFirst && w.doFirst() && w.doConfigure) //if has the doFirst property AND has a doConfigure function
          w.doConfigure();
    }
    for(ndx in widgets) { //configure any widgets needing to be configured
      w = widgets[ndx];
      if(w.doConfigure) {
        w.doConfigure();
      }
    }

    for(ndx in widgets) { //press any buttons that need a-pressin'
      w = widgets[ndx];
      if(w && w.isInitiallySelected) { //if it exists and it has an isInitiallySelected field
        elem = currentWhiteboard.browserDocument.getElementById(w.widgetId);
        if(elem) {
          elem.checked = w.isInitiallySelected;
        }
      }
    }
  } //if 'createView'

  else if(commandName === 'top') { //bring this window to the top of the Z-order
    wb.currentWhiteboard.browserWindow.focus();
  } //if 'top'

}; //function


/**
 * Creates a whiteboard and adds it to the list of available ones. Also, returns the created whiteboard.
 * 
 * Parameters: 
 *   -smChannel: The SM channel this whiteboard receives messages on. 
 *   -rootDiv: The DIV in the browser document into which the assembly of widgets is constructed. 
 *   -browserDocument: window.document that will be used as the browser document. 
 *   -browserWindow: (optional) browser window. If given then is used to adjust browser window: position, size,...
 */
wb.addWhiteboard = function(smChannel, rootDiv, browserDocument, browserWindow) {
  //Create a new Whiteboard and set it as the current whiteboard:
  wb.currentWhiteboard = new wb.Whiteboard(smChannel, rootDiv, browserDocument, browserWindow);
  wb.whiteboards[smChannel] = wb.currentWhiteboard; //save it to the list
  return wb.currentWhiteboard; //return the current whiteboard
}; //function

  
/**
 * Sets the currently active whiteboard (from the 'whiteboards' map) and sets it as the focus.
 * Returns the selected item.
 */
wb.selectWhiteboard = function(smChannel) {
  var whiteboard = wb.whiteboards[smChannel];
  wb.currentWhiteboard = whiteboard; //set as current whiteboard

  if(whiteboard && whiteboard.browserWindow) { //set the window focus
    whiteboard.browserWindow.focus();
  }
  return whiteboard;
};

  
/**
 * Finalize (close down) wbWidgets module. TODO: call this when need to unsubscribe from dojo SM events
 */
wb.doFinalize = function() {
  var ndx; //local vars

  if(wb.createEventsHandle) { //unsubscribe from 'widget create' events
    dojo.unsubscribe(wb.createEventsHandle);
    wb.createEventsHandle = null;
  }

  if(wb.commandEventsHandle) { //unsubscribe from 'command' events
    dojo.unsubscribe(wb.commandEventsHandle);
    wb.commandEventsHandle = null;
  }

  if(wb.currentWhiteboard) {
    var widgets = wb.currentWhiteboard.widgets;
    for(ndx in widgets) { //if there are any widgets and any are subscribed, then unsubscribe them
      if(widgets[ndx].unsubscribeFromEvents) {
        widgets[ndx].unsubscribeFromEvents();
      }
      delete widgets[ndx]; //remove the widget from this whiteboard
    }
  }
}; //function

  
/**
 * Initialize module. Mainly this subscribes to dojo SM events.
 */
wb.doInit = function() {
  wb.doFinalize(); //just in case this is a re-init

  //Register to receive widget 'create' messages via dojo publish and subscribe.
  //These are generally a result of receiving a widget create message over SM.
  wb.createEventsHandle = dojo.subscribe('wbCreate', wb.receiveCreateWidgetEvent); //subscribe to 'create' events

  //Register to receive 'command' messages via dojo publish and subscribe.
  //These are generally a result of receiving a command message over SM.
  wb.commandEventsHandle = dojo.subscribe('wbCmd', wb.receiveCommandEvent); //subscribe to 'command' events
}; //function
