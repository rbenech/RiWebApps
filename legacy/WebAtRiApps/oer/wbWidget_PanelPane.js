/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_PanelPane.js: Whiteboard PanelPane widget 
 * This represents a PanelPane widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_PanelPane = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  
  var //note: these all get initialized in function initializeTurtlePanel()
    charBoxVal=null, 
    currentSvgGroup=null, 
    //currentTwidget=null, 
    fontSize=null, 
    foreColor=null, 
    lineWidth=1, 
    namedRegions=null,
    namespace1999=null, 
    namespace2000=null,
    panelWidgetId=null,
    paneSize=null, 
    place=null, 
    tooltip=null, 
    top=null, 
    twidgets=null;
  

  //Closure function definitions:
  //-----------------------------

  /**Initializes the turtle panel using the provided wiget id and the given name for the svg element.
   * 
   * The parent widget id is used for two things:
   *   1. It is taken as the name of the html widget to insert the svg object into
   *   2. It is stored for events that need to specify the id of the PanelPane (turtle panel) RtWidget (Rtalk Widget).
   *   
   * -Creates an svg object with the given name, if it doesn't already exist.
   * -Clears any pre-existing content in it.
   * -Initializes all the local variables used by this panel.
   * -Returns the initialized SVG element*/
  var initializeTurtlePanel = function(parentWidgetId, elemName) {
    var svgElem = document.getElementById(elemName);
    if(!svgElem) { //get existing svg element or else make a new one
      svgElem = createSvgElement('svg', {version:'1.2', baseProfile:'tiny' }); //create svg object
      document.getElementById(parentWidgetId).appendChild(svgElem); //append the new element
    }
    if(svgElem.hasChildNodes()) { //clear the svg drawing element of all previously drawn child nodes
      while(svgElem.childNodes.length >= 1) {
        svgElem.removeChild(svgElem.firstChild);
      }
    }
    
    //initialize closure level components:
    charBoxVal=null;          //comes from charBox setting. '10@10' saved as a coordinates item: {x:10, y:10}
    currentSvgGroup=null;     //current svg group that svg items are going into. Note: this is a 'turtleWidget'
    //currentTwidget=null;      //the current turtle widget
    fontSize=8;               //initial font size
    foreColor='black';        //initial painting color
    lineWidth=1;              //initial line width
    namedRegions={};          //list of all the named regions currently in the panel
    namespace1999='http://www.w3.org/1999/svg'; //xml namespace
    namespace2000='http://www.w3.org/2000/svg'; //xml namespace
    panelWidgetId=parentWidgetId; //widget id of the parent turtle panel (panelPane)
    paneSize=null;            //this is set by the 'paneSize' command and defines the viewport size
    place=parseCoords('0@0'); //current turtle position
    
    //tooltip = document.getElementById('tooltip'); //this version uses the html defined tooltip element (remember to make it visible)
    if(!tooltip) {
      tooltip = createSvgElement('text', {x:0, y:0, visibility:'hidden'});
      //tooltip = createSvgElement('text', {x:20, y:100}, null, 'tool tip text' ); //debug (visible)
      
      //tooltip = createSvgElement('g', {}, null, 'tool tip text' ); //create it in a svg group so can combine text and rect for the tooltip
      //var elem = createSvgElement('text', {x:20, y:100}, null, 'tool tip text' );
      //tooltip.addChild(elem);

      //SAMPLE TO TRY (tooltip with rect so can have a bgnd color and border):
      //<g transform="translate(0,0)" visibility="hidden">
      //  <rect y="-10.8" x="-3" width="1" height="15" style="stroke:black;fill:#edefc2;stroke-width:1"/>
      //  <text style="font-family:Arial; font-size:12;fill:black;"> </text>
      //</g>    
    }
    
    top=0;                    //used to invert y axis (for now. Shouldn't have to do this)
    twidgets={};              //list of all the turtle widgets currently in the panel
    
    return svgElem;           //the created (or freshly cleared) SVG drawing element.
  };
  
  /**Creates an svg element given a type, attributes, event and content. 
   * If eventId is provided, it is used to generate sm events in response to mouse clicks.
   * If 'content' is provided, the element content is populated with it. 
   * Examples:
   *   e = createSvgElement('svg', {version:'1.2', baseProfile:'tiny' }); //create an svg object
   *   e = createSvgElement('rect', { x:70, y:90, width:40, height:30 }, 'myId'); //a rectangle that generates a 'myId' sm event
   *   e = createSvgElement('text', { x:20, y:40, style:'font-size:6pt' }, null, 'some text'); //a text element with its content and no event
   * */
  var createSvgElement = function(svgType, attribs, eventId, textContent) {
    var ndx;
    var elem = document.createElementNS(namespace2000, svgType);
    
    for(ndx in attribs) {
      elem.setAttribute(ndx, attribs[ndx]);
  }

    if(eventId) { //if an event is defined for this element
      elem.turtleWidgetId=eventId;
      //svg mouse events: click, mousedown, mouseup, mouseover, mouseout, mousemove
      var useCapture=false; //false:the event bubbles to others, true: the event does not bubble up. (Doesn't seem to matter as these objects are not nested)
      elem.addEventListener('click',     doSvgEvent_click, useCapture); //svg event
      elem.addEventListener('mousedown', doSvgEvent_down,  useCapture); //svg event
      elem.addEventListener('mouseover', showTooltipFor, useCapture);   //svg event
      elem.addEventListener('mouseout',  hideTooltip,    useCapture);   //svg event
      //elem.addEventListener('mousemove', showTooltipFor,  useCapture); //svg event (currently not used)
    }
    
    if(textContent) { //if content is defined for this element
      elem.textContent=textContent; //specific to text content
  }

    return elem;
  };

  /**Causes tooltip to be displayed for the given widget*/
  var showTooltipFor = function(evt) {
    var turtleWidgetId = evt.target.turtleWidgetId; //note: this is a group which contains the widget svg elements: rect, text etc.
    if(!turtleWidgetId) { return; }
    var w = twidgets[turtleWidgetId];
    if(!w) { return; } //nothing to do
    var msg = w.help;
    //if(!msg) msg = 'help message for item '+turtleWidgetId; //debug 
    if(!msg) { return; } //no tooltip associated with this item
    //if(ri.verboseDebug) { console.log('>>>'+msg); } //debug
    
    //EXAMPLE for manual scaling: svgElem.setAttribute('viewBox', ''+c.x+' '+ (c.y-c.height)+' '+ c.width+' '+ c.height); //viewBox: minx, miny, width, height. Example: '0 0 443 218'
    tooltip.setAttribute('x', evt.layerX); //note: layerX,Y is deprecated. Do this calculation manually instead? (using clientX,Y) or else just get widget position instead of using the evt position
    tooltip.setAttribute('y', evt.layerY);
    tooltip.textContent=msg;
    tooltip.setAttribute('visibility', 'visible');
  };

  /**Hides the tooltip text*/
  var hideTooltip = function(evt) {
    tooltip.setAttribute('visibility', 'hidden');
  };
  
  /**This is used to emit sm events for svg items: mouse clicked*/
  var doSvgEvent_click = function(evt) {
    var turtleWidgetId = evt.target.turtleWidgetId || 'no-ID'; //also currentTarget
    //whiteboard.emitSmEvent(id, 'do event for '+(evt.altKey ? 'ALT ' : '')+(evt.ctrlKey ? 'CTL ' : '')+(evt.metaKey ? 'META ' : '')+(evt.shiftKey ? 'SHIFT ' : '')+ '('+evt.clientX+', '+evt.clientY+')'); //debug
    whiteboard.emitSmEvent(panelWidgetId, turtleWidgetId, getMouseEventNameFor('Up', evt));
  };
  
  /**This is used to emit sm events for svg items: mouse down*/
  var doSvgEvent_down = function(evt) {
    var turtleWidgetId = evt.target.turtleWidgetId || 'no-ID'; //also currentTarget
    whiteboard.emitSmEvent(panelWidgetId, turtleWidgetId, getMouseEventNameFor('Down', evt));
  };
  
  var getMouseEventNameFor = function(actionName, evt) {
    //mouseEventNames: button[1|2][Up|Move|Down|DownShift|DownCtrl|DoubleClick]
    var s='button1'+actionName; //button1Up, button1Down
    if(evt.ctrlKey)  { s+='Ctrl';  }
    if(evt.shiftKey) { s+='Shift'; }
    if(evt.altKey)   { s+='Alt';   }
    if(evt.metaKey)  { s+='Meta';  } //this is the 'command' key on the mac (the cloverleaf)
    return s;
  };
  
  /**Given a string of the form 'left@top@right@bottom', 'left@top@right@bottom@namedRegion', 'x@y', or 'x@y@namedRegion'
   * Examples: '0@218@443@0@regionX', '23@43' 
   * Returns an object with entries for x, y, width, height, name.
   * Example: { x:0, y:218, width:442, height:218, name:regionX }
   * In addition to parsing the given coordinates. If there is a named region, it is placed into the official list for lookup purposes.
   * */
  var parseCoords = function(coords) {
    var left, right, top, bottom; //local vars
    var c = {};
    var parts = coords.split('@');
    var len = parts.length;
    if(len>=4) {
      left   = parseFloat(parts[0]);
      top    = parseFloat(parts[1]);
      right  = parseFloat(parts[2]);
      bottom = parseFloat(parts[3]);
      c.x = left;
      c.y = top;
      c.width = right-left;
      c.height = top-bottom;
      if(len>=5) { c.name = parts[4]; } //named region
    }
    else if(len>=2) {
      c.x = parseFloat(parts[0]);
      c.y = parseFloat(parts[1]);
      c.width = 0;
      c.height = 0;
      if(len>=3) { c.name = parts[2]; } //named region
    }
    else { 
      c.name = coords; //no '@' so just take it as the name
      console.log('Error in parse coords: got ['+coords+']. Ignored.'); //debug
    }
    if(c.name) { //register any named regions, for easy lookup
      namedRegions[c.name] = c;
  }
    
    return c;
  };

  /**Given a value representing a color number, returns a string representing a color value.
   * Example: given '5' or 5, returns '#dc0000' i.e. light red.
   */
  var getColorFor = function(colorNumber) {
    switch(parseInt(colorNumber)) {
      case  1: return '#000000'; //Black 
      case  2: return '#404040'; //DarkGray
      case  3: return '#808080'; //LightGray
      case  4: return '#ffffff'; //White
      case  5: return '#dc0000'; //LightRed
      case  6: return '#00dc00'; //LightGreen
      case  7: return '#0000dc'; //LightBlue
      case  8: return '#dcdc00'; //LightYellow
      case  9: return '#dc00dc'; //LightMagenta
      case 10: return '#00dcdc'; //LightCyan
      case 11: return '#800000'; //DarkRed
      case 12: return '#008000'; //DarkGreen
      case 13: return '#000080'; //DarkBlue
      case 14: return '#808000'; //DarkYellow
      case 15: return '#800080'; //DarkMagenta
      default: return 'black';   //default - black
    }
  };
  
 /**Draws the provided turtle content using svg (scalar vector graphics). 
   * 'contents' is an array of 'cmd:args' strings, for example: 
   *     [ 'paneSize:0@218@443@0', 'widget:7', 'clickRegion:121@33@171@8', 'place:121@32', 'foreColor:3', 'fill:171@9', ... ]
   * */
  var setDrawContent = function(parentWidgetId, contents) {
    var ndx, c, elem, svgElem, keyval, cmd, args, pos; //local vars
  var handled;
  var sa, len, c0, c1, turtleWidgetId;

    svgElem = initializeTurtlePanel(parentWidgetId, 'svgElem'); //clears the svg element, creates and installs it if necessary, initializes variables

    for(ndx in contents) { //go thru each of the received commands
      //if(ri.verboseDebug) { console.log('  TURTLE::'+contents[ndx]); } //debug

      //Parse the given command and args:
      keyval=contents[ndx];
      cmd=null; //given 'cmd:args', separate out into two strings
      args=null;
      if(keyval) {
        pos = keyval.indexOf(':');
        if(pos<0) { cmd = keyval.toLowerCase(); } //no ':' so just use the string itself. Is lower case always ok?
        else { //cmd is the part before ':'
          cmd = keyval.substring(0, pos).toLowerCase();
          args = keyval.substring(pos+1); 
        }
      }

      //Execute the command:
      handled=false;
      try {
        if(!cmd) {
          handled=true;
          continue; //nothing to do
        }
        switch(cmd[0]) {
          
          case '3':
            if(cmd==='3dbox') { //draw a 3d non-filled box. [3Dbox:121@33@171@8]
              c = parseCoords(args);
              elem = createSvgElement(
                  'rect', //svg element type
                  { x:c.x, y:top-c.y, width:c.width, height:c.height, style:'stroke: black; fill: none;'}, //attributes
                  currentSvgGroup ? currentSvgGroup.turtleWidgetId : 'no-name-3dbox' //event
                  );
              if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
              else { svgElem.appendChild(elem); }
              elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
              place = c; //turtle position
              handled=true;
            }
            break;
          
          case 'b':
            if(cmd==='box') { //draw a rectangle to given absolute position. [box:200@300]
              c = parseCoords(args);
              elem = createSvgElement(
                  'rect',                              //svg element type 
                  { x:place.x, y:top-place.y,          //attributes
                    width:Math.abs(c.x-place.x),       //abs?
                    height:Math.abs(c.y-place.y),      //abs?
                    style:'stroke: black; fill: none;'
                  },
                  currentSvgGroup ? currentSvgGroup.turtleWidgetId : 'no-name-box' //event
              );
              if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
              else { svgElem.appendChild(elem); }
              elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
              handled=true;
            }
            break;
          
          case 'c':
            if(cmd==='centertext') { //draw text that is centered at the current turtle postion. [centerText:some text] 
              elem = createSvgElement(
                  'text', //svg element type
                  {  x:place.x, y:top-place.y, 'text-anchor':'middle', style:'font-family: sans-serif; font-size: '+fontSize+'pt'}, //attributes. note: still needs vertical centering
                  currentSvgGroup ? currentSvgGroup.turtleWidgetId : 'no-name-ctext', //event
                  args    //text content
              );
              if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
              else { svgElem.appendChild(elem); }
              elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
              handled=true;
            }
            else if(cmd==='charbox') { //set the font size. [charBox:10@10]
              c = parseCoords(args);
              charBoxVal = c; //currently not using this anywhere. (I think it is supposed to relate to font size).
              handled=true;
            } 
            else if(cmd==='clickregion') { //i.e. [clickRegion:121@33;171@8;regionX] (representing left@top;right@bottom;regionName)
              args = args.replace(/;/g, '@'); //replace all instances of semicolon so can just use parseCoords
              c = parseCoords(args);
              if(currentSvgGroup) {
                //currentSvgGroup.addClickRegion(args); //TODO
              }
              else { console.log('TurtlePanel: Got a "clickRegion" with no widget defined'); }
              handled=true;
            }
            break;
          
          case 'd':
            if(cmd==='displaytext') { //draw text at current turtle position. [displayText:some text] 
              elem = createSvgElement(
                  'text', //svg element type 
                  {  x:place.x, y:top-place.y, style:'font-family: sans-serif; font-size: '+fontSize+'pt'}, //attributes
                  currentSvgGroup ? currentSvgGroup.turtleWidgetId : 'no-name-dtext', //event
                  args    //text content
              );
              if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
              else { svgElem.appendChild(elem); }
              elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
              handled=true;
            } 
            break;
          
          case 'f':
            if(cmd==='fill') { //fill in current color, from current turtle location to the specified one. [fill:10@20] 
              c = parseCoords(args);
              elem = createSvgElement(
                  'rect',                         //svg element type 
                  { x:place.x,                    //attributes
                    y:top-place.y, 
                    width:Math.abs(c.x-place.x),  //abs?
                    height:Math.abs(c.y-place.y), //abs?
                    style:'fill:'+foreColor+'; stroke-opacity: 0.5; fill-opacity: 0.5' //play with semi-transparent fill
                  },
                  currentSvgGroup ? currentSvgGroup.turtleWidgetId : 'no-name-fill' //event
              );
              if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
              else { svgElem.appendChild(elem); }
              elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
              handled=true;
            }
            else if(cmd==='forecolor') { //set the drawing color. [foreColor:3]
              foreColor = getColorFor(args); //given a '3', returns '#808080' i.e. light gray
              handled=true;
            } 
            break;
          
          case 'h':
            if(cmd==='help') { //i.e. [help:some text]
              if(currentSvgGroup) {
                currentSvgGroup.help = args; //???trial thing
                //currentTwidget.help = args;
              }
              else { console.log('TurtlePanel: Got a "help" string with no widget defined'); }
              handled=true;
            }
            break;
          
          case 'l':
            if(cmd==='line') { //draw a line. [line:name1;name2] or [line:x1@y1;x2@y2]
              sa = args.split(';');
              len = sa.length;
              if(len<2) { console.log('TurtlePanel. Error in "line" cmd: illegal arg: "'+sa+'"'); }
              else {
                c0 = namedRegions[sa[0]];    //try for a named region
                if(!c0) { c0 = parseCoords(sa[0]); } //failing that, take it as an absolute position
                c1 = namedRegions[sa[1]];    //try for a named region
                if(!c1) { c1 = parseCoords(sa[1]); } //failing that, take it as an absolute position
                if(!c0 || !c1) { console.log('TurtlePanel. Error in "line" cmd: needs two arguments: "'+sa+'"'); }
                else { //draw the line
                  elem = createSvgElement( 
                      'line',                     //svg element type 
                      { x1: c0.x + (c0.width/2), //attributes. If has width or height, takes the center of region (used for click areas for example) 
                        y1: top - (c0.y - (c0.height/2)), 
                        x2: c1.x + (c1.width/2), 
                        y2: top - (c1.y - (c1.height/2)),
                        style:'stroke:'+foreColor+'; stroke-width:'+lineWidth
                      },
                      null //no event?
                  );
                  if(currentSvgGroup) { currentSvgGroup.appendChild(elem); }
                  else { svgElem.appendChild(elem); }
                  elem.svgGroup = currentSvgGroup; //group (i.e. turtle widget) for this element
                }
              }
              handled=true;
            } 
            else if(cmd==='linewidth') { //set the drawing line width. [lineWidth:1]
              lineWidth = args;
              handled=true;
            } 
            break;
          
          case 'p':
            if(cmd==='panesize') { //given a string of the form 0@218@443@0 representing left@top@right@bottom
              c = parseCoords(args); //'0@218@443@0' to { x:0, y:218, width:442, height:218 }
              paneSize=c; //save for later
              svgElem.setAttribute('viewBox', ''+c.x+' '+ (c.y-c.height)+' '+ c.width+' '+ c.height); //viewBox: minx, miny, width, height. Example: '0 0 443 218'
              //svgElem.setAttribute('transform', 'translate(0 '+ -(c.height) +') scale(1 -1)'); //invert the y axis (this no work###)
              //svgElem.setAttribute('transform', 'translate(0 '+ -(c.height) +')'); //invert the y axis (this no work###)
              top = c.height; //why I need this? ###
              handled=true;
            }
            else if(cmd==='place') { //sets the current turtle draw location. [place:20@30]
              place = parseCoords(args);  //turtle position
              handled=true;
            } 
            break;
          
          case 'w':
            if(cmd==='widget') { //i.e. widget:27.  fetches the named widget and sets it as the current one being executed (not actually used for anything currently). [widget:3]
              turtleWidgetId = args;
              //currentTwidget = { 'name': turtleWidgetId };
              currentSvgGroup = createSvgElement('g', {}, turtleWidgetId); //make a group to hold all related items
              twidgets[turtleWidgetId] = currentSvgGroup; //each widget is a group which contains the elements that widget comprises
              svgElem.appendChild(currentSvgGroup); 
              //currentTwidget.svgGroup = currentSvgGroup; //the widget holds a reference to its svg group element
              handled=true;
            }
            else if(cmd==='widgetend') { //indicates end of a widget definition.
              //currentTwidget=null; //no longer working with this widget
              currentSvgGroup=null; //no longer working with this widget
              handled=true;
            }
            break;
            
        } //switch
      } //try
      catch(e) { 
        console.log('TurtlePanel parse error: '+e); 
      }
      if(!handled) {
        console.log('TurtlePanel: Unrecognized command: '+cmd+':'+riutil.getObjAsString(args));
    }
    } //for
    svgElem.appendChild(tooltip); //install the tool tip item last so is on top of Z order. note: is ok to append same element again, it just pulls it to the top
    //document.body.appendChild(tooltip); //install the tool tip item###
  }; //function setDrawContent
  
  /**Function getSelected: Returns currently selected value (or null if nothing is selected). This is called anytime an SM event occurs */
  var getSelected = function() {
    return null;
  };

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    var elem, elemStyle, doc; //local vars
    
    doc = whiteboard.browserDocument;
    elem = doc.getElementById(this.widgetId);
    if(!elem) { //get existing html element or else make a new one
      elem = doc.createElement('div');
      elem.setAttribute('id', this.widgetId);
      doc.getElementById(whiteboard.rootDiv).appendChild(elem); //append the new element
    }
    elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
    elemStyle += '; border:solid 1px gray'; //add a border
    //elemStyle += '; overflow:auto'; //add scrollbars (if this is ever needed for svg panel).
    elem.setAttribute('style', elemStyle);

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
    case 'readonly':
      break;
    case 'panemodenoredraw':
      break;
    case 'stretch':
      break;
    case 'contents':
      setDrawContent(this.widgetId, val.contents); //draw the turtle panel contents
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

}; //wb.Widget_PanelPane
