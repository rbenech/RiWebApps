/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri*/ //for jslint

/**-----------------------------------------------------------------------------------------
  wbUtil.js
  This contains miscellaneous utility functions for the whiteboard application..
  11/12/2011 oer
  ------------------------------------------------------------------------------------------
*/


/**module definition*/
var riutil = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //-------------
  
  //Closure local variables:
  //------------------------
  var 
    ref36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", //guru-time: reference string for base 36 conversions
    powVal=null,        //guru-time: table of exponents used for base-n string conversion
    prevTimeVal=null    //guru-time: used when auto increment is needed
    ;

  //Closure method definitions:
  //---------------------------
  
  /**Returns a string with the indicated number of spaces*/
  var spaces = function(len) {
    var i, a, len10; //local vars
    
    if(len<=0) { return ''; }
    switch(len) {
      case  1: return ' '; case 10: return '          ';
      case  2: return '  '; case  9: return '         ';
      case  3: return '   '; case  8: return '        ';
      case  4: return '    '; case  7: return '       ';
      case  5: return '     '; case  6: return '      ';
    }
    a='';
    len10 = Math.floor(len/10);
    for(i=0; i<len10; i++) { a+='          '; } //the big chunks
    return a+spaces(len-(len10*10)); //the remainder 
  };
  
  /**Returns a string with the indicated number of spaces*/
  var nbspaces = function(len) {
    var i, a, len10; //local vars
  
    if(len<=0) { return ''; }
    switch(len) {
      case  1: return '&nbsp '; case 10: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp '; //note: added an extra regular space because it helps the old firefox browser
      case  2: return '&nbsp&nbsp '; case  9: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  3: return '&nbsp&nbsp&nbsp '; case  8: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  4: return '&nbsp&nbsp&nbsp&nbsp '; case  7: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  5: return '&nbsp&nbsp&nbsp&nbsp&nbsp '; case  6: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
    }
    a='';
    len10 = Math.floor(len/10);
    for(i=0; i<len10; i++) { a+='&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'; } //the big chunks
    return a+nbspaces(len-(len10*10))+' '; //the remainder.  note: added an extra regular space because it helps the old firefox browser 
  };
  
  /**Given an RiString returns a fomatted list <li>...</li> element*/  
  var getRiStringAsLi = function(riString) {
    var indent, color, font, a; //local vars
    if(!riString.text) { //if no text field then it's not an RiString
      return '<li>'+riString+'</li>';
    }
    
    indent=0;
    color=0;
    font=0;
    if(riString.indent) { indent = riString.indent; }
    if(riString.color) { color = riString.color; }
    if(riString.font) { font = riString.font; }
    if(color===0 && indent===0 && font===0) {
      return '<li>'+riString.text+'</li>'; //nothing to format
    }
    
    a='<li';
    if(color!==0 || font!==0) {
      a+=' class="'; //note: opening double quote
      if(color!==0) { a+='rsColor'+color; } 
      if(font!==0) { a+=' rsStyle'+font; } 
      a+='"'; //closing double quote   
    }
    
  //  if(indent!=0) {
  //    a+=' style="'; //note: opening double quote
  //    a+=' padding-left: '+indent+'em'; //why doesn't this approach work?
  //    a+='"'; //closing double quote   
  //  }
    a+='>'+nbspaces(indent)+riString.text+'</li>'; //use nbspaces until figure out whhy css padding didn't work 
    return a;
  };
  
  /**given an RiString returns a formatted html <span>...</span> element(otherwise just returns a plain string)*/  
  var getRiStringAsSpan = function(riString) {
    var indent, color, font, a; //local vars
    if(!riString.text) { //if no text field then it's not an RiString
      return riString;
    }
    
    indent=0;
    color=0;
    font=0;
    if(riString.indent) { indent = riString.indent; }
    if(riString.color) { color = riString.color; }
    if(riString.font) { font = riString.font; }
    if(color===0 && indent===0 && font===0) {
      return riString.text; //nothing to format
    }
    
    a='<span';
    if(color!==0 || font!==0) {
      a+=' style=';
      if(color!==0) { a+='"color:'+color; }
      switch(font) {
        case 0: break; //normal font
        case 1: a+=' font-weight:bold'; break; //bold 
        case 2: a+=' font-style:italic'; break; //italic
        case 3: a+=' font-weight:bold font-style:italic'; break; //bold italic
      }
      a+='"'; //closing double quote   
    }
    a+='>'+nbspaces(indent)+riString.text+'</span>';  
    return a;
  };
  
  /**Creates a style string from the given a frameRatio variable, which has values for: left, right, top, bottom.
   * Example: given a frameratio object: { left:20, right:50 top:100, bottom:60 } 
   * Returns as string: 'style=position:absolute; left:20%; top:100%; width:30%; height:40%;'
   * */
  var makeStyleFromFrameRatio = function(frameRatio) {
    var wd, ht, xpos, ypos;
    if(frameRatio) { //frameRatio is percent values for: left, right, top, bottom
      wd = ' '+(frameRatio.right-frameRatio.left)+'%';
      ht = ' '+(frameRatio.top-frameRatio.bottom)+'%';
      xpos = frameRatio.left;
      ypos = 100-frameRatio.top;
    }
    else {
      wd = 'auto';
      ht='auto';
      xpos = 0;
      ypos = 0;
    }
    return 'position:absolute; left:'+xpos+'%; top:'+ypos+'%; width: '+wd+'; height: '+ht;
  };
  
  /**Returns the given frameratio string (i.e. '20@100;50@60' or '20;100;50;60')
   * as a json object: { left:20, top:100, right:50, bottom:60 } 
   * */
  var getFrameRatioFor = function(val) {
    var frameRatio, doing, p0, ndx, len; //local vars
    frameRatio = {};
    doing=0; //start with 0 (left)
    p0=0; //index of start of substring
  len = val.length;
    for(ndx=0; ndx<len; ndx++) { //walk through the string
      if(val[ndx]===';' || val[ndx]==='@') { //split on separators
        switch(doing) {
          case 0: frameRatio.left  = parseInt(val.substring(p0, ndx), 10); break; //left
          case 1: frameRatio.top   = parseInt(val.substring(p0, ndx), 10); break; //top
          case 2: frameRatio.right = parseInt(val.substring(p0, ndx), 10); break; //right
        }
        p0 = +ndx+1; //next
        doing++; //next
      }
    }
    frameRatio.bottom = parseInt(val.substring(p0, val.length), 10); //bottom
    return frameRatio;
  };
  
  /**quick and dirty function to get a value for default font size*/
  var getDefaultFontSize = function() {
    var pa = document.body;
    var who = document.createElement('div');
    who.style.cssText='display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden; font-size:1em';
    who.appendChild(document.createTextNode('M'));
    pa.appendChild(who);
    var fs= {width:who.offsetWidth, height:who.offsetHeight};
    pa.removeChild(who);
    return fs;
  };
  
  
  /**Returns a tree object, suitable for use with dijit.Tree, from the contents of the given list of RiStrings
   * This uses the indent level on each riString to determine the location of each node in the tree
   * A sequential 'index' is assigned to each node to provide a unique value for each.
   * also this adds a 'kids' array to any entry that has one or more children. 
   * The 'kids' array is of the form: "[ _reference:indexOfKid1}, {_reference:indexOfKid2}, ...]".
   * 
   * Note: The entries are riString and so they have the riString parameters of text, color, font, tag, header.
   *       To this are added entries for index, kids, parent.
   * The structure of the returned object: 
   * 
   * {
   *   identifier: 'index',
   *   label: 'text',
   *   items: [
   *     { text:"Label1", index:'0', indent:'0', kids:[_reference:1,_reference:2], parent:null },
   *     { text:"Label2", index:'1', indent:'2', parent:0 },
   *     { text:"Label3", index:'2', indent:'2', parent:0 },
   *   ]
   * }
   * */ 
  var  getTreeFor = function(/*riString[]*/ rsArray) {
    var len, rootNode, parent, currentParentNode, currentChildNode, currentChildIndent, i, r, 
        indent, newIndent; //local var defs
    
    if(!rsArray) { return null; } //nothing to do
    len = rsArray.length;
    if(len<1) { return null; } //nothing to do

    rootNode = { //the returned value 
      identifier: 'index',
      label: 'text',
      items: rsArray //the list of all the entries, irrespective of parentage. To these are added references to the index of children and parents
    };

    currentParentNode = null; //the current node to which children are being added
    currentChildNode = null; //most recently added child
    
    r = rsArray[0]; //riString
    if(r.text===undefined) { //if is a regular string, need to replace it with an riString (for tree purposes)
      r = {};
      r.text = rsArray[0];
      rsArray[0] = r; //replace it
    }
    currentChildIndent = (r.indent===undefined) ? 0 : r.indent; //the indent value of the most recent node added. Start it at the value of the first node.
    
    for(i=0; i<len; i++) { //to each entry, add references for children and parent
      
      r = rsArray[i]; //riString
      if(r.text===undefined) { //if is a regular string, need to replace it with an riString (for tree purposes)
        r = {};
        r.text = rsArray[i];
        rsArray[i] = r; //replace it
      }
      
      r.index = i; //give a unique, sequential index to each entry
      r._reference = i; //amazingly: this was the final thing needed to make it work
      if(r.indent===undefined) { r.indent = 0; } //ensure have an indent because is used for tree display 
      indent = r.indent;
      
      if(indent===currentChildIndent) { //keep pushing into same parent node
        currentChildNode = r; //create new node
        r.parent = currentParentNode; 
        if(currentParentNode) { //if have a parent
          if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
          currentParentNode.kids.push(currentChildNode);
        }
      }
      
      else if(indent > currentChildIndent) { //push into the most recent child
        currentParentNode = currentChildNode; //push down one
        currentChildNode = r; //create new node
        r.parent = currentParentNode;
        if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
        currentParentNode.kids.push(currentChildNode);
        currentChildIndent = indent;
      }
      
      else { //i.e. indent < currentLevel: pop until find a node above the level of this node
        parent = currentParentNode;
        while(true) {
          if(!parent) { //just in case something goes horribly wrong
            parent = rootNode;
            break; //all done
          }
          if(!parent) { newIndent=0; }
          else { newIndent = parent.indent; } 
          if(newIndent < indent) { //find a node at a level at least 1 smaller than this node 
            break; //all done
        }
          currentParentNode = parent;
          parent = currentParentNode.parent;
        }
        currentParentNode = parent;
        currentChildNode = r; //create new node
        r.parent = currentParentNode;
        if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
        currentParentNode.kids.push(currentChildNode);
        currentChildIndent=indent;
      }
    }
    return rootNode;
  };
  
  
  /**Recursively expands the given item for display purposes*/
  var getObjAsString = function(someObj) {
    var ndx, type, a;
  
    if(ri.messageExpand) {
      type = Object.prototype.toString.call(someObj); 
      if(type === '[object Array]') {
        a='[';
        for(ndx=0; ndx<someObj.length; ndx++) {
          a+=' '+getObjAsString(someObj[ndx]);
        }
        a+=']';
        return a;
      }
      else if(type === '[object Object]') { //else if('[object Object]'==someObj) { //this also works (note == not ===)
        a='{';
        for(ndx in someObj) {
          if(someObj.hasOwnProperty(ndx)) {
            a+=' '+ndx+':'+getObjAsString(someObj[ndx]);
          }
        }
        a+='}';
        return a;
      }
      else return someObj;
    }
    else { //i.e. no object expansion
      type = Object.prototype.toString.call(someObj); 
      if(type === '[object Array]') {
        return '[' +someObj + ']';
      }
      else if(type === '[object Object]') { //else if('[object Object]'==someObj) { //this also works (note == not ===)
        return '{' +someObj + '}';
      }
      else return someObj;
    }
  };
  
  /**Convenience method to expand an SM*/
  var getSmAsString = function(sm) {
    var ndx;
    var a = 'SMDST:'+sm.SMDST+' SMSRC:'+sm.SMSRC+' CHANNEL:'+sm.CHANNEL+' MSGS:';
    if(ri.messageExpand) {
      for(ndx in sm.MSGS) {
        if(sm.MSGS.hasOwnProperty(ndx)) {
          a += getObjAsString(sm.MSGS[ndx]);
        }
      }
      return a;
    }
    return a+sm.MSGS;
  };


  /** Given an riString or just a regular string, returns either header+text or just the text (if no header defined) */
  var getAsRiStringWithHeader = function(s) {
    if(!s) return ''; //just in case
    if(s.header || s.text) { //return header+text or just text (if there is no header)
      return (s.header || '') + (s.text || '');
    }
    return s; //not an riString, just a regular one
  }; //function

  
  /**Toggles 'visibility' given the id of a div*/
  var makeVis = function(divID) {
    var adiv; //local vars
    //document.getElementById(divID).style.visibility = "visible";
    adiv = document.getElementById(divID);
    if(adiv.style.visibility==="visible") {
      adiv.style.visibility="hidden";
    }
    else {
      adiv.style.visibility="visible";
    }
  };
  
  /**Given a div id, sets its position. Example setPos("myDivId", "10px", "20px") */
  var setPos = function(divID, topPos, leftPos) {
    var adiv = document.getElementById(divID);
    adiv.style.position="relative";
    adiv.style.top=topPos; //"10px";
    adiv.style.left=leftPos; //"10px";
    //document.getElementById(divID).style.left = 300;
  };
  
  /**Given a string of the form 'key=val' returns 'key'
   * if no equal sign then returns the given string.*/
  var getKeyFor = function(keyval) {
    var ndx;
  
    if(keyval.indexOf) { //if is a string
      var pos = keyval.indexOf('=');
      if(pos<0) { return keyval; }
      return keyval.substring(0, pos);
    }
    //assume is an object {key:val}
    for(ndx in keyval) {
      if(keyval.hasOwnProperty(ndx)) {
        return ndx; //return the first key found
    }
  }
  };
  
  /**Given a string of the form 'key=val' returns 'val'
   * if no equal sign then returns null.*/
  var getValFor = function(keyval) {
    var ndx, pos;
    if(keyval.indexOf) { //if is a string
      pos = keyval.indexOf('=');
      if(pos<0) { return null; }
      return keyval.substring(pos+1);
    }
    //assume is an object {key:val}
    for(ndx in keyval) {
      if(keyval.hasOwnProperty(ndx)) {
        return keyval[ndx]; //return the first val found
    }
  }
  };
  
  /**Given a string of the form 'key=val' returns object: { key:val }
   * if no equal sign then returns the given string*/
  var getKeyValFor = function(keyval) {
    if(keyval.indexOf) { //if is a string
      var pos = keyval.indexOf('=');
      if(pos<0) { return keyval; } //return the given value
      var key = keyval.substring(0, pos);
      var val = keyval.substring(pos+1);
      var resp = {};
      resp[key] = val;
      return resp;
    }
    //assume is an object {key:val}
    return keyval;
  };
  
  // --------------------------------------
  // Guru-time related items:
  // --------------------------------------
  
  /**Returns a base 36 string representation of the input parameter
   * using the specified number of output digits.*/
  var createBase36String = function(val, noOfDigits) {
    var temp, sb, convBase, mult, i, pow=null, digit, ch; //local vars
    temp = val;
    sb = '';
  
    if(!powVal) { //fill in table of exponents, if needed
      powVal = [];
      convBase = 36;
      mult = 1;
      for(i = 0; i < noOfDigits; i++) {
        powVal[i] = mult;
        mult *= convBase;
      }
    }
    for(i = noOfDigits - 1; i >= 0; i--) { //create the base n string
      pow = powVal[i];
      digit = parseInt(temp / pow, 10);
      temp -= (digit * pow);
      ch = ref36.charAt(digit);
      sb+=ch;
    }
    return sb;
  };
  
  /**Returns a base 36 string represetation of the current time. 
   * The returned value is a 6 digit string representing the current machine 
   * time offset to GMT.
   * If autoIncrement is true then subsequent calls to this will return guaranteed different values
   * */ 
  var getGuruTimenow = function (autoIncrement) {
    var now, mSecSinceJan70, delta_mSecBetween1970To90_GMT, guruTime, base36String; //local vars
    now = new Date();
    mSecSinceJan70 = now.getTime();
    delta_mSecBetween1970To90_GMT = 631152000000;
    guruTime = parseInt((mSecSinceJan70 - delta_mSecBetween1970To90_GMT) / 1000, 10); //int value in sec
    if(autoIncrement) { //make sure the new one is not the same as previous
      if(prevTimeVal && (guruTime <= prevTimeVal)) { //if has a prev time and is same or less then increment
        guruTime=prevTimeVal+1;
      }
      prevTimeVal = guruTime;
    }
    base36String = createBase36String(guruTime, 6); //a 6 digit string 
    return base36String;
  };
  
  //var ss=''; for(var i=0; i<10; i++) ss+=getGuruTimenow(true)+' '; document.getElementById('gbg').innerHTML=ss; //test the guruTimeNow autoIncrement feature
  
  // --------------------------------------
  // Debug utilities:
  // --------------------------------------
  
  /**Debug function to display text in the html 'status' field. 
   * Note: only prints if element 'statusDiv' is defined in the html.
   * Echoes messages to the console as well.
   * */
  var emitStatus = function(msg) { 
    var elem = document.getElementById('statusDiv');
    if(elem) { elem.innerHTML = 'Status: ['+msg+']'; } 
    console.log('WB STATUS:'+riutil.getObjAsString(msg));
  };
  
  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    spaces: spaces,
    nbspaces: nbspaces,
    getRiStringAsLi: getRiStringAsLi,
    getRiStringAsSpan: getRiStringAsSpan,
    makeStyleFromFrameRatio: makeStyleFromFrameRatio,
    getFrameRatioFor: getFrameRatioFor,
    getDefaultFontSize: getDefaultFontSize,
    getTreeFor: getTreeFor,
    getObjAsString: getObjAsString,
    getSmAsString: getSmAsString,
    getAsRiStringWithHeader : getAsRiStringWithHeader,
    makeVis: makeVis,
    setPos: setPos,
    getKeyFor: getKeyFor,
    getValFor: getValFor,
    createBase36String: createBase36String,
    getGuruTimenow: getGuruTimenow,
    emitStatus: emitStatus
    
  }; //closure return
  
}()); //namespace riutil
