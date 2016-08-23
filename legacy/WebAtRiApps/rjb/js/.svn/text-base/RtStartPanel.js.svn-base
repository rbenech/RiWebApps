
/* ------------------------------------------------------------------------------------------
  RtStartPanel.js 
  This is the RtPanel part of RtStart. This creates and manages the RtWidgets.
  10/3/2011 oer
  ------------------------------------------------------------------------------------------
*/

// ------------
// Global Vars:
// ------------

var _modelSmChannel='none'; //the SM response channel to use when talking back to the model (on the other end of this conversation)
var _widgets = {}; //the map of rt widgets held by this app.

//------------
//Functions:
//------------

/**Called for each message in the received SM*/
function handleRtMsg(msg) {
  if(!msg) return

  var subMsgCnt = msg.length //number of sub msgs in this msg
  if(subMsgCnt==0) return
  
  var map = {}; //convert given msg to a map
  for(var ndx in msg) {
    if(ndx===0) continue; //skip the first message (handled separately)
    var s = msg[ndx];
    if(!s) continue; //nothing there, skip it
    if(s.indexOf) { //if has an indexOf then use it
      var cmd = getKeyFor(s);
      if(cmd && cmd.toLowerCase && cmd.toLowerCase()==='class') cmd = 'className'; //substitution. The word 'class' is a bit of a problem
      map[cmd]=getValFor(s);
    }
    else  { //assume it's an object not a key/value (HACK ALERT)
      map['contents']=s; //TEST. Need to actually check if it is a 'contents' thing ###
    }
  }

  var cmd = getKeyFor(msg[0])
  var cmdOrig = cmd; //non-lowercased version (used in fetching of widgets)
  cmd = cmd.toLowerCase(); //lowercased version
  switch(cmd) {
    case 'toppane':
      var widget = createWidget("TopPane");
      if(widget) parseMsg(widget, map);
      return
    case 'subpane':
      var rtClassName = map.className;
      var widget = createWidget(rtClassName); //tablePane, listpane, textpane, treepane, button, grouppane, menu,...
      if(widget) parseMsg(widget, map);
      return;
    case 'menu':
      var widget = createWidget("Menu"); 
      if(widget) parseMsg(widget, map);
      return
    case 'command':
      var val = getValFor(msg[0]);
      if(val=='createView') {} //TODO?
      if(val=='subscribe') {} //TODO
      return;
    default: //message to an indexed widget
      var widget = _widgets[cmdOrig];
      if(widget) parseMsg(widget, map);
      else console.log('rtError: unrecognized command or widget name: '+cmd);
      break;
  }
}

/**Given a widget and a msg in the form of a map, parses through the given map of sub-messages to configure this widget*/
function parseMsg(widget, map) {
  for(var cmd in map) //parse the entries in map
    widget.parseSubMsg(cmd.toLowerCase(), map[cmd]);
}

/**Make a widget. rtClassType=Button, GroupPane, ListPane, Menu, PanelPane, TextPane, TopPane, TreePane, Worksheet
 * Note: This makes a widget. Note: Must give it a 'parseSubMsg' method.
 * */
function createWidget(rtClassType) {
  if(!rtClassType) return;
  switch(rtClassType.toLowerCase()) { //lowercase compares
    
    case "toppane":
      return new function() { //widget class definition
      
        this.parseSubMsg = function(cmd, val) { //returns true if message was handled
          switch(cmd) {
            case 'identifier': //the id for the 'top' widget.
              //_topId=val; //needed?
              _widgets[val]=this; //add to widgets list maintained in RtPanel
              break;
            case 'label': //set the title for whatever is the enclosing Frame or dialog
              document.title = val; //set browser title
              //TODO?: send SM to update guru panel button text? (prob. need a hook in servlet to just do this). Without sm's would be CMD_SEND to 255 (no response): "AS,ButtonText=val"
              break;
            case 'model': //the SM response channel to use when talking back to the model (on the other end of this conversation)
              _modelSmChannel = val;
              break;
            case 'type': break; //not used for anything?
            case 'windowsize': break; //TODO?
            default: baseParseSubMsg(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition
      
    case "listpane":
      
      return new function() { //widget class definition
        this.setContents = function(val) {
          var aDiv = document.createElement('div'); //TODO: make a new div
          aDiv.setAttribute('id', this.id);
          var divStyle = makeDivStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%; overflow:auto;"
          aDiv.setAttribute('style', divStyle); 

          var a ='<ul style="border: solid 1px gray">'; //html list
          var contents = val.contents; //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
          for(var ndx in contents) //fill in the list
            a+=getRiStringAsLi(contents[ndx]);
          a+='</ul>';
          a+='</div>';
          
          aDiv.innerHTML=a;
          document.body.appendChild(aDiv);
        } //function
        
        this.parseSubMsg = function(cmd, val) { //returns true if message was handled
          switch(cmd) {
            case 'contents': this.setContents(val);
            default: baseParseSubMsg(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition

    case "textpane":
      return new function() { //widget class definition
        this.setContents = function(val) {
          var aDiv = document.createElement('div'); //TODO: make a new div
          aDiv.setAttribute('id', this.id);
          var divStyle = makeDivStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%; overflow:auto;"
          aDiv.setAttribute('style', divStyle); 

          var a='<pre style="border: solid 1px gray; overflow:auto">'; //w/border
          //var a='<pre style="overflow:auto">'; //no border
          a+=val;
          a+='</pre></div>';  
          aDiv.innerHTML=a;
          document.body.appendChild(aDiv);
        } //function
        
        this.parseSubMsg = function(cmd, val) { //returns true if message was handled
          switch(cmd) {
            case 'contents': this.setContents(val);
            case 'clear': case 'showit': case 'append': case 'highlight': case 'insert': case 'position':
              //TODO
              break; 
            default: baseParseSubMsg(this, cmd, val); break; //this message not handled here, let parent have a go at it
          }
        } //function
      }; //class definition
      
      default:
        console.log('rtError: Unable to create item of class type: '+rtClassType); //debug
        return null; //no widget definition
  }
}

/**Called by widgets when they don't handle a given command. This handles the actions common to all widgets.*/
function baseParseSubMsg(widget, cmd, val) {
  switch(cmd) {
    case 'events': break; //TODO?
    case 'frameratio':  //set size: 10;50;100;5: left;right;top;bottom as a percentage of parent window size. 0,0 is bottom left
      widget.frameRatio = getFrameRatioFor(val);
      break;
    case 'hscroll': break; //srollbars are handled automatically
    case 'identifier': //the id for this widget. Note: If never get an id then it never goes in the widgets list so it cannot be referenced later on.
      widget.id = val;
      _widgets[val]=widget; //add to widgets list
      break;
    case 'name': break; //currently don't do anything with this one
    case 'owner': 
      var ownerWidget = _widgets[val];
      //TODO: var widget.parent = ownerWidget; //set the widget's value for who its parent is
      //TODO: ownerWidget.addWidgetComponent(this); //add this widget to component view of the parent 
      break;
    case 'vscroll': break; //srollbars are handled automatically
    
    //These were already handled, only here so don't get an unrecognized error: 
    case 'classname':
    case 'toppane':
    case 'subpane':
    case 'menu':
    case 'command':
      break;
      
    default:
      console.log('rtWarning: unrecognized message '+cmd+'='+val);
      break;
  }
  
}
