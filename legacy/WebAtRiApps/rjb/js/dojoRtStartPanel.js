
/* ------------------------------------------------------------------------------------------
  dojoRtStartPanel.js 
  This is the Dojo RtPanel part of RtStart. This creates and manages the Dojo RtWidgets.
  11/03/10 rjb
  ------------------------------------------------------------------------------------------
*/

// ------------
// Global Vars:
// ------------

var _modelSmChannel='none'; //the SM response channel to use when talking back to the model (on the other end of this conversation)
var _widgets = {}; //the map of rt widgets held by this app.


dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.Tree");
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


/**Creates dojo region info given a ID variable, which has values from 1 to N...
 * This SHOULD change to a 'region' variable that maps to Dojo Regions
 * Returns as string: 'top','left','center','right','bottom'
 * */
function setDojoRegionFromID(rtClassID) {
  if (!rtClassID) return;
  switch(rtClassID.toLowerCase()) {
    case "1":
      return "leading";  //to support rtl languages!
      break;
    case "2":
      return "center";
      break;
    case "3":
      return "trailing";  //to support rtl languages!
      break;
    case "4":
      return "bottom";
     break;
    default:
      return null;
  }
}

/**Creates Dojo Height Style (width and layout determined by region)
 * */
function setDojoStyleFromFrameRatio(frameRatio) {
  var wd, ht, xpos, ypos;
  if(frameRatio) { //frameRatio is percent values for: left, right, top, bottom
    ht = ''+(frameRatio.top-frameRatio.bottom)+'%';
  }
  else {
    ht='auto';
  }
  var a='height: '+ht+';';
  return a;
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
              
               // update name to id='top'
              var node = dojo.byId("top")
              if(node){
                node.innerHTML = val;
              }else{
                console.log("no node with id='top' found!");
              }
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
          //generate dojo tree from content
          var a ='<div class="dojo-Tree">'; //html list
          var contents = val.contents; //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
          var childLevel = 0;
          
          for(var ndx in contents){ //fill in the list... TODO, children (aka indent) must skip the </div> and add it after all children!
              if (ndx+1 > contents.length) { //if last element, close as leaf
                 a+= getRiStringAsDojoTreeDiv(contents[ndx])+"</div>";  
              }else if (getChildLevelFromRSIndent(contents[ndx+1])== childLevel) {       //check next element for indent = current
                a+= getRiStringAsDojoTreeDiv(contents[ndx])+"</div>";             //close previous element as leaf
              }else if (getChildLevelFromRSIndent(contents[ndx+1]) > childLevel) {  //make child
                a+= getRiStringAsDojoTreeDiv(contents[ndx])  ;
                childLevel++;
              }else if (getChildLevelFromRSIndent(contents[ndx]) < childLevel) {
                a+= getRiStringAsDojoTreeDiv(contents[ndx])+"</div></div>"; // close parent tree div too!
                childLevel--;
              }
          }
          a+='</div>';   //to close dojo-Tree
          
//--TREE NOT WORKING... REQUIRES DOJO.STORE functionality!  temporarily using UL 
          
          var a ='<ul>'; //html list
          var contents = val.contents; //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
          for(var ndx in contents) //fill in the list
            a+=getRiStringAsLi(contents[ndx]);
          a+='</ul>';
          a+='</div>';
                    
          // add content based on id
          var node = dojo.byId(this.id)
          console.log("Found "+this.id+"! and adding: "+a)
          if(node){
                node.innerHTML = a;
          }else{
                console.log("no node with id='"+this.id+"' found!");
          };
                    
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
          
           var a='<span style="overflow:auto">'; //w/border
          a+=val;
          a+='</span>';  
          
          // add content based on id
          var node = dojo.byId(this.id)
          if(node){
                node.innerHTML = a;
          }else{
                console.log("no node with id='"+this.id+"' found!");
          };
          
          
          //var aDiv = document.createElement('div'); //TODO: make a new div
          //aDiv.setAttribute('id', this.id);
          //var divStyle = makeDivStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%; overflow:auto;"
          //aDiv.setAttribute('style', divStyle); 
          //
         
          //document.body.appendChild(aDiv);
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

