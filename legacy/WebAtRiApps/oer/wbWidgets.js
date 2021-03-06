/*jslint devel: true, browser: true, continue: true, windows: false, vars: true, evil: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals ri, dojo, dijit*/ //for jslint

/**-----------------------------------------------------------------------------------------
  Whiteboard. 
  This application represents a blank slate that is configured by received SM messages.
  The received SM messages indicate what widgets are to be inserted as well as their configuration parameters.

  wbWidgets.js 
  These are the widgets that the whiteboard comprises.
  
  11/16/2011 oer
  ------------------------------------------------------------------------------------------
*/

//TODO: executeCmd: return true if command was handled
//Dialog EXAMPLE:
//  <div data-dojo-type="dijit.Dialog" data-dojo-props='title:"My Dialog",
//    onFocus:function(){ ...a_focus_event_handler... }'
//    data-dojo-id="myDialog">
//  </div>   

var ri = ri || {}; //namespace for the ri module

/**module definition*/
ri.widgets = (function () {
  "use strict"; //enable javascript strict mode

  //Dependencies:
  //------------------------
  var 
    emitStatus = ri.util.emitStatus,
    RIRISEP1 = ri.util.RIRISEP1,
    RIRISEP2 = ri.util.RIRISEP2,
    RIRISEP3 = ri.util.RIRISEP3,
    RIRISEP4 = ri.util.RIRISEP4;
  
  //Closure local variables:
  //------------------------
  var
    _modelSmChannel='none',      //the SM response channel to use when talking back to the model (on the other end of this conversation)
    _widgets = {},               //the map of rt widgets held by this app.
    _createEventsHandle=null,    //publish/subscribe handle for create events
    _commandEventsHandle=null;   //publish/subscribe handle for command events
  
  //Closure method definitions:
  //------------------------
  
  /**Sends back an SM with the event item as well as all other selected items (as required for select events).
   * Emits an SM of the form: SM...^event+widget=ID+channel=CHANNELNAME+selection=SELECTION+selection1=SELECTION+selection3=SELECTION...
   * Where ^ + represent RIRI separators.
   * Note: selection values are generally RiStrings, occasionally regular strings.
   * This version does high level assembly of the SM (no RIRI separators)
   * */
  var emitSmEvent = function(widgetId, eventString, mouseEventName) {
    var eventMsg, ndx, sel, smDst, smSrc, w, attrs, attrNdx; //local vars
    
    emitStatus('Event from widget '+widgetId+'='+eventString); //debug 
    
    eventMsg = ['event', 'widget='+widgetId, 'channel='+ri.smparse.smChannel(), 'selection='+eventString]; //assemble the SM message portion
    if(mouseEventName)
      eventMsg.push('mouse='+mouseEventName);
    
    for(ndx in _widgets) {     //see if any other widgets have selections
      w = _widgets[ndx];
      if(w.getSelected) {          //if this widget defines a getSelected function.
        sel = w.getSelected(); //returns null if nothing is selected
        if(sel) { eventMsg.push('selection'+w.id+'='+sel); } //if this widget is participating in the selection event, add to the SM message
      }
      if(w.getAttributes) {    //if this widget defines a getAttributes function.
        attrs = w.getAttributes(); //returns null if no attributes available
        if(attrs) //if this widget is participating in the selection event, add to the SM message
          for(attrNdx in atrs)
            eventMsg.push(attrs[attrNdx]); 
      }
    }
    
    //Send out the SM:
    smDst = '00000000';   //broadcast for now. Eventually should this be directed to _modelSmChannel?
    smSrc = ri.smparse.smChannel(); //optional, this can also just be blank 
    ri.riri.sendSm(ri.smparse.webSkt(), smDst, smSrc, _modelSmChannel, ri.riri.toRiri(eventMsg)); //convert message to RIRI (at the default separator level of 2), then send it out
  };
 
  /**This is the same thing as above but creates the message directly using low level RIRI separators*/
  var emitSmEvent_UsingLowLevelSeps = function(widgetId, eventString, mouseEventName) {
    var eventMsg, ndx, sel, smDst, smSrc, w; //local vars
    
    emitStatus('Event from widget '+widgetId+'='+eventString); //debug 
    
    eventMsg = RIRISEP2 + 'event' + RIRISEP2 + 'widget='+widgetId + RIRISEP2 + 'channel=' + ri.smparse.smChannel() + RIRISEP2 + 'selection=' + eventString; //assemble the SM message portion
    if(mouseEventName) {
      eventMsg +=  + RIRISEP2 + 'mouse=' + mouseEventName;
    }
    
    for(ndx in _widgets) {       //see if any other widgets have selections
      w = _widgets[ndx];
      if(w.getSelected) {            //if this widget defines a getSelected function.
        sel = w.getSelected();   //returns null if nothing is selected
        if(sel) { eventMsg += RIRISEP2 + 'selection'+w.id+'='+sel; } //if this widget is participating in the selection event, add to the SM message
      }
    }
    
    //Send out the SM:
    smDst = '00000000'; //broadcast for now. Eventually should this be directed to _modelSmChannel?
    smSrc = ri.smparse.smChannel(); //optional, this can also just be blank 
    ri.riri.sendSm(ri.smparse.webSkt(), smDst, smSrc, _modelSmChannel, eventMsg); //send out the message
  };
  
  /**Given an riString or just a regular string, returns either header+text or just the text (depending on whether there is a header there or not)*/ 
  var getAsRiStringWithHeader = function(s) {
    if(s.header || s.text) {
      return (s.header || '')+s.text; //return header+text or just text (if there is no header)
    }
    return s; //not an riString, just a regular one
  };
  
  /**This handles actions that are common to all RtWidgets, e.g: TopPane, SubPane, ListPane, TextPane, GroupPane, Menu, Button, ...*/
  var baseExecuteCmd = function(widget, cmd, val) {
    
    switch(cmd) {
  
      case 'events': break; //OLD?
      
      case 'enableevent': break; //NEW? TODO?
      
      case 'frameratio':  //set size: 10;50;100;5: left;right;top;bottom as a percentage of parent window size. 0,0 is bottom left
        widget.frameRatio = ri.util.getFrameRatioFor(val);
        break;
      
      case 'hscroll': break; //srollbars are handled automatically
      
      case 'identifier': //the id for this widget. Note: If never get an id then it never goes in the widgets list so it cannot be referenced later on.
        widget.id = val;
        _widgets[val]=widget; //add to widgets list
        widget.receiveWidgetEvents = function(settings) { //function to receive widget events from SM. Called by dojo.subscribe
          var cmdVal; //local vars
          for(cmdVal in settings) { //parse through the settings to configure this widget
            widget.executeCmd(cmdVal.toLowerCase(), settings[cmdVal]);
          }
        }; //function
        widget.unsubscribeFromEvents = function() { //function to cause this widget to unsubscribe from dojo events generated by SM
          if(widget.eventsHandle) {
            dojo.unsubscribe(widget.eventsHandle);
            widget.eventsHandle=null;
            emitStatus('Widget '+widget.id+' unsubscribed from dojo events');
          }
<<<<<<< .mine
          a+='</ul>';
          elem.innerHTML=a;
          document.getElementById("wb").appendChild(elem); //add this element to the page
        } //function
        
        this.getSelected = function() { return null; } //If any elements are selected, it should be returned by this function. This is called anytime an SM event occurs
        
        this.executeCmd = function(cmd, val) { //returns true if command was handled
          switch(cmd) {
            case 'contents': this.setContents(val); break;
            default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition
=======
        }; //function
        widget.eventsHandle = dojo.subscribe(ri.smparse.widgetChannel()+val, widget.receiveWidgetEvents); //register for sm generated events using the given identifier
        break;
      
      case 'name': break; //currently don't do anything with this one
      
      case 'owner':
        widget.parentWidget = _widgets[val]; //set the widget's value for who its parent is
        //TODO?: ownerWidget.addWidgetComponent(widget); //needed for javascript? add this widget to component view of the parent 
        break;
      
      case 'vscroll': break; //srollbars are handled automatically
      
      default:
        //TODO: try deleting widget name in smParse when event is generated. If that doesn't work then just use this to ignore the widget name entry here: ###
        if(_widgets[cmd]) {} //ignore. This is a kludge to eliminate warning just because the widget name is always in the list
        else {
          console.log('wbWarning: unrecognized message (id='+widget.id+')'+cmd+'='+val);
        }
        break;
    }
  };
  
  //Consider this as a more correct alternative for the object composition?:
  //RtWidget_TopPane = function() {};
  //RtWidget_TopPane.prototype.executeCmd = function(cmd, val) {...}; 
  
  // -------------------
  // Widget definitions:
  // --------------------
  
  /**RtWidget definition: Button.
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_Button = function() {
    
    this.widgetContents=null;   //this is used as the button name (and value)
    
    this.isInitiallySelected=false; //true if this button is to be initially selected
  
    /**Function doConfigure: This is called when the widget is ready to be configured (all the settings are in)*/
    this.doConfigure = function() { //this is called when widget is ready to be configured (all the settings are in)
      var parentElem, singleSelect, nm, nmStr, elem, elemStyle; //local vars
  
      singleSelect=false;
      if(this.parentWidget) { //if have a parent widget
        parentElem = document.getElementById(this.parentWidget.id); //get id of parent (usu. a group pane)
        if(this.parentWidget.singleSelect) { 
          singleSelect = this.parentWidget.singleSelect;
        }
      }
      if(!parentElem) { //i.e. no parent html element.  If don't have a parentElem then just throw it into the top pane?
        parentElem = document.createElement('div');
        parentElem.setAttribute('id', 'butnParent_'+this.id); //note: this cannot be this.id so appending some text in front just to make it differentiable from the button id itself
        document.getElementById("topPane").appendChild(parentElem); //append the new element
      }
      nm = this.widgetContents; //riString (or string)
      nmStr = nm.text || nm; //get string only in case is an riString
      
      elem = document.getElementById(this.id); //see if this item already exists
      if(!elem) {
        elem = document.createElement('input'); //make an element representing this button
        elem.setAttribute('id', this.id);
        elem.innerHTML = nmStr;
      }
  
      //Set up the button, like: '<input type="button" onclick="ri.widgets.emitSmEvent('nm')" id="'this.id'"  value="'nmStr'"/>'
      if(singleSelect) { //make it a radio button
        elem.setAttribute('type', 'radio');
        elem.setAttribute('name', parentElem.id); //need a common name for radio buttons so use the parent id
      }
      else {             //make it a regular button
        elem.setAttribute('type', 'button');
      }
      elem.setAttribute('onclick', 'ri.widgets.emitSmEvent("'+this.id+'","'+getAsRiStringWithHeader(nm)+'")' ); //when button is clicked, emit sm event (using riString header+text)
      elem.setAttribute('value', nmStr); //displayed button text is the string only version 
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elem.setAttribute('style', elemStyle);
>>>>>>> .r3113

<<<<<<< .mine
    case "textpane":
      return new function() { //widget class definition
        this.setContents = function(val) {
          var elem = document.getElementById(this.id); 
          if(!elem) { //get existing html element or else make a new one
            elem = document.createElement('div');
            elem.setAttribute('id', this.id);
          }
          var elemStyle = makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
          elemStyle += ' overflow:auto;"'; //auto or scroll here makes it have scrollbars
          //elemStyle += ' border:solid 1px gray;">'; //add a border. For some reason this doesn't work. Seems to work better to add border to list itself
          elem.setAttribute('style', elemStyle);
          var a='<pre style="border: solid 1px gray">'; //text area w/border
          //var a='<pre">'; //text area no border
          a+=val;
          a+='</pre>';  
          elem.innerHTML=a;
          document.getElementById("wb").appendChild(elem); //add this element to the page
        } //function
        
        this.getSelected = function() { return 'this is a test'; } //If any text is selected, it should be returned by this function. This is called anytime an SM event occurs
        
        this.executeCmd = function(cmd, val) { //returns true if command was handled
          switch(cmd) {
            case 'contents': this.setContents(val); break;
            case 'clear': case 'showit': case 'append': case 'highlight': case 'insert': case 'position':
              //TODO
              break; 
            default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition
=======
      try { parentElem.appendChild(elem); } //add this element to parent
      catch(e) { console.log('>>>Error installing button id="'+this.id+'"+ value="'+nmStr+'": '+e); } //debug
      
      delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
    }; //function
  
    /**Function getSelected: Returns button's value is is currently selected, else returns null. This is called anytime an SM event occurs*/
    this.getSelected = function() {
      var buttonElem = document.getElementById(this.id); 
      if(!buttonElem) return false;
      return buttonElem.checked ? this.widgetContents: null; 
    };
  
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'contents': this.widgetContents = val; break;
        case'selected': if(val==='true') { this.isInitiallySelected = true; } break;
        case 'forecolor': break; //TODO?
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  
  /**RtWidget definition: GroupPane.
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_GroupPane = function() {
  
    this.singleSelect=false; //field
    
    /**Function doConfigure: This is called when the widget is ready to be configured (all the settings are in)*/
    this.doConfigure = function() {
      var elem, elemStyle; //local vars
      elem = document.getElementById(this.id);
      if(!elem) { //get existing html element or else make a new one
        elem = document.createElement('div');
        elem.setAttribute('id', this.id);
      }
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elem.setAttribute('style', elemStyle);
      document.getElementById("topPane").appendChild(elem); //append the new element
      //elem.innerHTML='<div style="border: solid 1px red">group pane</div>'; //DEBUG: make groupPane visible
      delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
    }; //function
  
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'singleselect': if(val==='true') { this.singleSelect=true; } break;
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  /**RtWidget definition: ListPane.
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_ListPane = function() {
    var lastSelectedValue=null;
    
    /**Function setContents. given parameter 'contents' is a list of RiStrings: QAAAitem1, QAAAitem2,...*/
    this.setContents = function(contents) {
      var elem, elemStyle, contents, a, ndx,
          widgetId = this.id; //local vars
      
      elem = document.getElementById(this.id); 
      if(!elem) { //get existing html element or else make a new one
        elem = document.createElement('div');
        elem.setAttribute('id', this.id);
      }
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elemStyle += '; overflow:auto"'; //auto or scroll here makes it have scrollbars
      //elemStyle += ' border:solid 1px gray;">'; //add a border. For some reason this doesn't work. Seems to work better to add border to list itself
      elem.setAttribute('style', elemStyle); 
      
      //elem.setAttribute('onclick', 'ri.widgets.emitSmEvent("'+widgetId+'","'+getAsRiStringWithHeader(lastSelectedValue)+'")' ); //when list is clicked, emit sm event (also need to assign lastSelectedValue here) 
      
      a ='<ul style="border: solid 1px gray">'; //html list with border
      //a ='<ul>'; //html list no border
      for(ndx in contents) { //fill in the list
        //a+=getRiStringAsLi(contents[ndx]); //this way has list bullets
        a+=ri.util.getRiStringAsSpan(contents[ndx])+'<br />'; //this gets rid of list bullets
      }
      a+='</ul>';
      elem.innerHTML=a;
      document.getElementById("topPane").appendChild(elem); //append the new element
      //document.body.appendChild(elem); //add this element to the page
    }; //function
    
    /**Function getSelected: Returns value of selected element or null if nothing is selected. This is called anytime an SM event occurs*/
    this.getSelected = function() { return lastSelectedValue; }; 
    
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) { //returns true if command was handled
      switch(cmd) {
        case 'contents': this.setContents(val.contents); break;
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  /**RtWidget definition: Menu.
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_Menu = function() { //###IN WORK
    
    /**Function setContents*/
    this.setContents = function(val) {
      var elem, elemStyle; //local vars
      elem = document.getElementById(this.id); 
      if(!elem) { //get existing html element or else make a new one
        elem = document.createElement('div');
        elem.setAttribute('id', this.id);
        elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio);
        //elemStyle += '; overflow:auto"'; //auto or scroll here makes it have scrollbars
        elem.setAttribute('style', elemStyle);
      }
      document.getElementById("topPane").appendChild(elem); //append the new element
    }; //function
    
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'title':
          //TODO
          break;
        case 'value':
          //TODO
          break;
        default: //this message not handled here, let common actions have a go at it
          ///###baseExecuteCmd(this, cmd, val); //DEBUG: comment out, for now, so no menu errors 
          break; 
      }
    }; //function
  };
  
  /**RtWidget definition: PanelPane (i.e. 'Turtle panel').
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_PanelPane = function() {
  
    /**Function doConfigure: This is called when the widget is ready to be configured (all the settings are in)*/
    this.doConfigure = function() {
      var elem, elemStyle, a; //local vars
      elem = document.getElementById(this.id); 
      if(!elem) { //get existing html element or else make a new one
        elem = document.createElement('div');
        elem.setAttribute('id', this.id);
        document.getElementById("topPane").appendChild(elem); //append the new element
      }
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elemStyle += '; border:solid 1px gray"'; //add a border
      //elemStyle += '; overflow:auto"'; //add scrollbars (if this is ever needed for svg panel).
      elem.setAttribute('style', elemStyle);
      
      delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
    }; //function
  
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'readonly': break;
        case 'panemodenoredraw': break;
        case 'stretch': break;
        case 'contents': ri.turtle.setDrawContent(this.id, val.contents); break; //draw the turtle panel contents
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
>>>>>>> .r3113

<<<<<<< .mine
    case "grouppane":
      return new function() { //widget class definition
        this.singleSelect=false; //field
        this.doConfigure = function() { //this is called when widget is ready to be configured (all the settings are in)
          var elem = document.getElementById(this.id);
          if(!elem) { //get existing html element or else make a new one
            elem = document.createElement('div');
            elem.setAttribute('id', this.id);
          }
          var elemStyle = makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
          elem.setAttribute('style', elemStyle);
          document.getElementById("wb").appendChild(elem); //add this element to the page
          //elem.innerHTML='<div style="border: solid 1px red">group pane</div>'; //DEBUG: make groupPane visible
          delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
        } //function
=======
  /**RtWidget definition: TextPane.
   * Note: all RtWidgets must have an 'executeCmd' method.
   * ORIG version: html only (no dojo)*/
  var RtWidget_TextPane = function() {
  
    /**Function setContents*/
    this.setContents = function(val) {
      var elem, elemStyle, a; //local vars
      elem = document.getElementById(this.id); 
      if(!elem) { //get existing html element or else make a new one
        elem = document.createElement('textarea');
        elem.setAttribute('id', this.id);
        document.getElementById("topPane").appendChild(elem); //append the new element
      }
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elemStyle += '; overflow:auto; border: solid 1px gray"'; //auto or scroll here makes it have scrollbars, add a border
      elem.setAttribute('style', elemStyle);
      elem.innerHTML=val;
    }; //function
    
    /**Function getSelected: Returns value of selected element or null if nothing is selected. This is called anytime an SM event occurs*/
    this.getSelected = function() { return 'this is a test'; };
    
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'contents': this.setContents(val); break;
        case 'clear': case 'showit': case 'append': case 'highlight': case 'insert': case 'position':
          //TODO
          break; 
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  /**RtWidget definition: TreePane. TODO: For now this is just the same as a ListPane
   * Note: all RtWidgets must have an 'executeCmd' method.
   * */
  var RtWidget_TreePane = function() {
    var lastSelectedValue=null, treeDataStore=null, treeModel=null, tree=null ;
>>>>>>> .r3113

    /**Function setContents. given parameter 'contents' is a list of RiStrings*/
    this.setContents = function(contents) {
      //local vars:
      var treeHolderElem, elemStyle, widgetId = this.id; 
      
      //Create an element to wrapper the tree (establishes position and size):
      treeHolderElem = document.getElementById(this.id); 
      if(!treeHolderElem) { //get existing html element or else make a new one
        treeHolderElem = document.createElement('div');
        treeHolderElem.setAttribute('id', this.id);
        treeHolderElem.setAttribute('class', 'claro');
      }
      elemStyle = ri.util.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
      elemStyle += '; overflow:auto"'; //auto or scroll here makes it have scrollbars
      treeHolderElem.setAttribute('style', elemStyle); 
      document.getElementById("topPane").appendChild(treeHolderElem); //append the new element

      if(tree) { tree.destroyRecursive(); } //destroy any previously built version so can create anew
      
      //Create the tree (data store, data model, tree):
      treeDataStore = new dojo.data.ItemFileReadStore( { //data store for the tree model
        //var contentsArray = val.contents || { identifier: 'index', label: 'text', items:[] }; //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
        data: ri.util.getTreeFor(contents || []), //contents is a list of RiStrings: QAAAitem1, QAAAitem2,... 
        getChildren: function(object) { return object.kids }
      });
      
      treeModel = new dijit.tree.ForestStoreModel({ //the tree model
        store: treeDataStore,
        query: {indent: '0'}, //initial query. Since is a forest, everything at level zero will be displayed as a root
        //rootId: 'root',
        //rootLabel: 'Root',
        childrenAttrs: ['kids'] 
      });
      
      tree = new dijit.Tree({ model: treeModel, showRoot:false, openOnClick:true, persist:true });
      tree.placeAt(treeHolderElem);
      //tree.set('paths', [['0']]); //TODO: do something here to expand the tree at the first level
      tree.onClick = function(item, treeNode) { //when tree is clicked, emit sm event
        //lastSelectedValue = treeDataStore.getLabel(item); //emit the tree label only (no header)
        //lastSelectedValue = (item.header || '')+item.text; //emit full riString (header+text)
        lastSelectedValue = getAsRiStringWithHeader(item); //emit full riString (header+text)
        emitSmEvent(widgetId, lastSelectedValue);
      }
    }; //function
    
    /**Function getSelected: Returns value of selected element or null if nothing is selected. This is called anytime an SM event occurs*/
    this.getSelected = function() { return lastSelectedValue; }; 
    
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) {
      switch(cmd) {
        case 'contents': this.setContents(val.contents); break;
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  /**RtWidget definition: TopPane.
   * Note: all RtWidgets must have an 'executeCmd' method.*/
  var RtWidget_TopPane = function() {
    var attribs = null; //for topPane these are essentially cookies provided by the model, and returned on selection events

    this.getAttributes = function() { return attribs; }; //for topPane these are essentially a cookies provided by the model, and returned on selection events
    
    /**Function executeCmd: Used to parse received messages. Returns true if command was handled*/
    this.executeCmd = function(cmd, val) { //function to parse received messages. returns true if command was handled
      switch(cmd) {
        case 'clearattributes': attribs=null; break;
        case 'label': //set the title for whatever is the enclosing Frame or dialog
          document.title = val; //set browser title
          //TODO?: send SM to update guru panel button text? (prob. need a hook in servlet to just do this). Without sm's would be CMD_SEND to 255 (no response): "AS,ButtonText=val"
          break;
        case 'model': //the SM response channel to use when talking back to the model (on the other end of this conversation)
          _modelSmChannel = val;
          break;
        case 'attributes'://for topPane, attributes are provided by the model and returned on selection events.
          if(!attribs) attribs = []; //create if needed
          attribs.push(val); 
          break; 
        case 'type': break; //not used for anything?
        case 'windowsize': break; //TODO? (this is supposed to set the size of the outer window, in characters)
        default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let common actions have a go at it
      }
    }; //function
  };
  
  // -----------------------
  // End Widget definitions
  // -----------------------
  
  /**Make a widget. rtClassType=Button, GroupPane, ListPane, Menu, PanelPane, TextPane, TopPane, TreePane, Worksheet
   * Note: This makes a widget.
   * */
  var createWidget = function(rtClassType) {
    var ndx; //local vars
    if(!rtClassType) { return; }
    switch(rtClassType.toLowerCase()) { //using lowercase compares
      case "button":    return new RtWidget_Button();
      case "grouppane": return new RtWidget_GroupPane();
      case "listpane":  return new RtWidget_TreePane(); //RtWidget_ListPane(); //DEBUG: for now just use TreePane for both
      case "menu":      return new RtWidget_Menu(); 
      case "panelpane": return new RtWidget_PanelPane();
      case "textpane":  return new RtWidget_TextPane();
      case "treepane":  return new RtWidget_TreePane();
      case "toppane":
        //for now: whenever a topPane message is received, clear everything out and start over:
        var tpElem = document.getElementById("topPane");
        if(tpElem.hasChildNodes()) { //remove all child nodes
          while(tpElem.childNodes.length >= 1) {
            tpElem.removeChild(tpElem.firstChild);       
          }
        }
        for(ndx in _widgets) { //if there are any widgets and any are subscribed, then unsubscribe them
          if(_widgets[ndx].unsubscribeFromEvents) {
            _widgets[ndx].unsubscribeFromEvents();
          }
<<<<<<< .mine
          elem.setAttribute('onclick', 'emitSmEvent("'+this.id+'","'+nm+'")' ); //when button is clicked, emit sm event (using the original riString value)
          elem.setAttribute('value', nmStr); //displayed button text is the string only version 
          var elemStyle = makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
          elem.setAttribute('style', elemStyle);

          parentElem.appendChild(elem); //add this element to parent
          delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
        } //function

        this.getSelected = function() { return null; } //If this button is currently selected, it should return its value (i.e. widgetContents) via this function. This is called anytime an SM event occurs

        this.executeCmd = function(cmd, val) { //returns true if command was handled
          switch(cmd) {
            case 'contents': this.widgetContents = val; break;
            case'selected': if(val==='true') this.isSelected = true; break;
            default: baseExecuteCmd(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition
 
    case "menu": //###IN WORK
      return new function() { //widget class definition
        this.setContents = function(val) {
          var elem = document.getElementById(this.id); 
          if(!elem) { //get existing html element or else make a new one
            elem = document.createElement('div');
            elem.setAttribute('id', this.id);
            var elemStyle = makeStyleFromFrameRatio(this.frameRatio);
            //elemStyle += ' overflow:auto;"'; //auto or scroll here makes it have scrollbars
            elem.setAttribute('style', elemStyle);
          }
          document.getElementById("wb").appendChild(elem); //add this element to the page
        } //function
        
        this.executeCmd = function(cmd, val) { //returns true if command was handled
          switch(cmd) {
            case 'title':
              //TODO
              break;
            case 'value':
              //TODO
              break;
            default: //this message not handled here, let parent have a go at it
              ///###baseExecuteCmd(this, cmd, val); //DEBUG: for now, no menu errors 
              break; 
          }
        } //function
      }; //class definition
      
=======
        }
        _widgets = {}; //TODO: replace this with a removeAll from _widgets
        return new RtWidget_TopPane(); 
>>>>>>> .r3113
      default:
        console.log('wbError: Unable to create item of class type: '+rtClassType); //debug
        return null; //no widget definition
    }
  };
  
  /**Called when a 'create' event is received.
   * Receives a list: [rtClassName, settings]
   *   rtClassName: e.g. TopPane, Menu, LispPane, TextPane, GroupPane, Button, ...
   *   settings: a collection of key=values to configure widget
   * */
  var receiveCreateWidgetEvent = function(nameAndSettings) {
    var rtClassType, settings, widget, cmd; //local vars
    
    rtClassType = nameAndSettings[0];
    settings = nameAndSettings[1];
    widget = createWidget(rtClassType);
    if(widget) { //if a widget was created 
      for(cmd in settings) { //configure the widget by going through each of the settings 
        widget.executeCmd(cmd.toLowerCase(), settings[cmd]);
      }
    }
  };
  
  /**Called when a 'command' event comes in.
   * Receives a list: [commandName, settings]
   * commandName: e.g. createView, top
   * settings: a collection of key=values
   */
  var receiveCommandEvent = function(nameAndSettings) {
    var commandName, settings, ndx, w, id, elem; //local vars
    commandName = nameAndSettings[0];
    settings = nameAndSettings[1];
  
    if(commandName==='createView') { //finalize the layout
      
      for(ndx in _widgets) { //configure any widgets needing to be configured
        w = _widgets[ndx];
        if(w.doConfigure) { w.doConfigure(); }
      }
      
      for(ndx in _widgets) { //press any buttons that need a-pressin'
        w = _widgets[ndx];
        if(w && w.isInitiallySelected) { //if it exists and it has an isInitiallySelected field
          id = w.id;
          elem = document.getElementById(w.id); 
          if(elem) { elem.checked = w.isInitiallySelected; }
        }
      }
    }
    
    else if(commandName==='top') {} //TODO?: bring this window to the top of the Z-order
  };      
  
  /**Finalize (close down) wbWidgets module.
   * TODO: call this when need to unsubscribe from dojo SM events*/
  var doFinalize = function() {
    var ndx; //local vars
    
    if(_createEventsHandle) { //unsubscribe from 'widget create' events
      dojo.unsubscribe(_createEventsHandle);
      _createEventsHandle = null;
    }
  
    if(_commandEventsHandle) { //unsubscribe from 'command' events
      dojo.unsubscribe(_commandEventsHandle);
      _commandEventsHandle=null;
    }
    
    for(ndx in _widgets) { //if there are any widgets and any are subscribed, then unsubscribe them
      if(_widgets[ndx].unsubscribeFromEvents) {
        _widgets[ndx].unsubscribeFromEvents();
      }
    }
  };

  /**Initialize wbWidgets module. 
   * Mainly this subscribes to dojo SM events.*/
  var doInit = function() {
    doFinalize(); //just in case this is a re-init
    
    //Register to receive widget 'create' messages via dojo publish and subscribe. 
    //These are generally a result of receiving a widget create message over SM.
    _createEventsHandle = dojo.subscribe(ri.smparse.createChannel(), receiveCreateWidgetEvent);
    
    //Register to receive 'command' messages via dojo publish and subscribe. 
    //These are generally a result of receiving a command message over SM.
    _commandEventsHandle = dojo.subscribe(ri.smparse.commandChannel(), receiveCommandEvent);
  };
    

  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    emitSmEvent: emitSmEvent,
    doInit: doInit
  }; //closure return
  
}()); //namespace ri.widgets
    
