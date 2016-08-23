/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri*/ //for jslint

/**----------------------------------------------------------------------------------------------
  riri.js
  
  This contains functionality related to RIRI (RI Remote Interface) and SM (Guru System Message).
  
  4/18/2012 oer
  ------------------------------------------------------------------------------------------------
*/


/**module definition*/
var riri = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //-------------
  
  //Closure local variables:
  //------------------------
  var 
    base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",  //used for base64 encode/decode

    //RIRI Separators:
    RIRISEP1 = '\u001c', //RIRI level 1 separator - FS - '^'
    RIRISEP2 = '\u001d', //RIRI level 2 separator - GS - '+'
    RIRISEP3 = '\u001e', //RIRI level 3 separator - RS - '~'
    RIRISEP4 = '\u001f', //RIRI level 4 separator - US - '/'riStringCheckAndConvert 
    RIRISEP = [RIRISEP1, RIRISEP2, RIRISEP3, RIRISEP4] //for array access of RIRI separators
    ;
  
  //Closure method definitions:
  //---------------------------
  
  /**Recursive function to break apart what it is given, at collection boundaries and insert appropriate separators
   *  Example: given [a, b, [c, d], e] at level=1 returns: SEP1 a SEP1 b SEP1 SEP2 c SEP2 d SEP1 e 
   *  This isolates the application from SM transport semantics.
   *  'level' starts at 1 for 1st level separators (not 0).
   *          The default level, if not specified, is 2 just because most messages separate at level 2.
   *  Note: there are only 4 levels defined for RIRI separators. If called with a deeper nesting requirement, this emits succeeding levels modulo 4
   *  
   *  TODO?: If given an object like {some:value, another:thing}, this currently just gets the values and not the keys.
   *         So the above returns "SEP value SEP thing". Maybe it should do "SEP some=value SEP another=thing" instead?
   */
  var toRiri = function toRiri(msg, level) {
    var a, ndx; //local vars
    if(!level) { level=2; } //default separator level [GS]
    level--; //convert from 1 based to 0 based
    if(level > 3) { level %= 4; } //just in case (only 4 RIRI levels are defined but cycling them modulo 4 should work ok)
    if(msg instanceof Object) { //this covers both Objects as well as arrays
      a='';
      for(ndx in msg) {
        if(msg.hasOwnProperty(ndx)) { //keeps jslint happy
          a += RIRISEP[level] + toRiri(msg[ndx], +level+2); //increment by 1 (to the next lower separator, additional +1 because call is base 1 not base 0) 
        }
      }
      return a;
    }
    return msg; //bottom out at primitives
  };

  /**New version to try out. This one handles objects in addition to arrays [OER 4/18/12]*/
  var toRiri_NEWONE = function toRiri(msg, level) {
    var ndx, a, len;
    if(!level) { level=2; } //default separator level [GS]
    level--; //convert from 1 based to 0 based
    if(level > 3) { level %= 4; } //just in case (only 4 RIRI levels are defined so above that, cycle them modulo 4)

    if(msg instanceof Array) { //for arrays: [ val, [...], {...}, ... ] 
      a='';
      len = msg.length;
      for(ndx=0; ndx<len; ndx++) {
        a += RIRISEP[level] + toRiri(msg[ndx], +level+2); //increment by 1 (to the next lower separator, additional +1 because call is base 1 not base 0) 
      }
      return a;
    }
    if(msg instanceof Object) { //for objects: { key:val, key:[...], key:{...}, ... }
      a='';
      for(ndx in msg) {
        if(msg.hasOwnProperty(ndx)) {
          a += RIRISEP[level] + ndx + '=' + toRiri(msg[ndx], +level+2); //increment by 1 (to the next lower separator, additional +1 because call is base 1 not base 0) 
        }
      }
      return a;
    }
    return msg; //bottom out at primitives
  };
  
  /**This builds and sends out an SM (System Message)
   * if dst is null or empty string then is taken as a broadcast.
   * src is normally left blank. Fill in a value just to see where an SM came from.
   * message needs to have appropriate RIRI separators. this sends it out as is.
   * */ 
  var sendSm = function(webSkt, smDst, smSrc, toChannel, message) {
    var sm; //local vars
    if(!smDst || smDst==='') { smDst = '00000000'; } //broadcast
    if(!smSrc) { smSrc=''; } //normally src starts out blank
    
    //TODO: most of this assembly (except message) can be cached:
    //TODO: using a typed array: ArrayBuffer makes this go out as bytes
    sm = RIRISEP1 + 'SM' + RIRISEP2 + 'SMDST=' + smDst + RIRISEP2+'SMSRC=' + smSrc+RIRISEP2 + 'SRC=' + RIRISEP1 + toChannel;
    if(message[0]!==RIRISEP1) { sm += RIRISEP1; }//just in case. Check that message has its leading sep1, add it if not
    sm += message;

    try { ri.websocket.send(webSkt, sm); } //send out the SM 
    catch(ex) { //if it's closed then re-open and re-send 
      //For now call smparse from here. Later: figure out a more general way to define this (since riri.js should not be calling back into smparse):
      smparse.openComms(sm); //open comms and when established resend the sm. 
    }
    
    if(ri.verboseDebug) { console.log('WB SENT:'+sm); } //debug
  };

  //These are the functions used to convert raw (riri separated) SM's into javascript objects:
  
  /**Base64 decode: Converts to integer from base 64 string (or array). 
   * Note: this one derived from the smalltalk method 'riBase64Integer'
   * */
  var base64Decode = function(value) {
    var ndx;
    var result = 0;
    for(ndx in value) {
      if(value.hasOwnProperty(ndx)) {
        result = result * 64 + base64Digits.indexOf(value[ndx]);
      }
    }
    return result;
  };

  /**Base64 encode: Converts the given integer to an array containing the base 64 characters. 
   * Note: this one derived from the smalltalk method 'riBase64StringPaddedTo'
   * 
   * Example of using the browser to decode base 64: 
   *     "data:text/plain;base64,bWVzc2FnZSBlbmNvZGVkIGluIGJhc2U2NA==" --> "message encoded in base64"
   * */
  var base64Encode = function(value, maxDigits) {
    var i, chars, pos, result, stringVal;
    chars = []; //builds result as an array of chars, i.e. ['A', '+', 'e', '9']  
    for(pos = maxDigits-1; pos>=0; pos--) {
      result = Math.floor(value % 64);
      chars[pos] = base64Digits[result];
      value = Math.floor(value / 64);
    }
    stringVal='';
    for(i=0; i<maxDigits; i++) {
      stringVal += chars[i];
    }
    return stringVal; //return as a string i.e. 'A+e9'
  };

  /**Given a string, checks if the String is a RIRI encoded RiString. 
   * If so converts it, otherwise returns the given string unmodified
   * The returned riString object will have the following properties:
   *   text, indent, color, font, tag, action, header
   * All are optional except for 'text'. 
   * Note that the values for 'indent', 'color', 'font', and 'tag' are all integers.
   * 'text' and 'action' are strings
   * 'header' is the binary header portion used to emit the riString as RIRI.
   * */
  var riStringCheckAndConvert = function(s) {
    var val, rawHeaderBytes, headerOffset, actionLength;
    var temp, riString, isType2;

    if(!s || s.length===0) { return s; }
    
    switch(s[0]) {
      case '\u0001': isType2=false; break;
      case '\u0002': isType2=true;  break;
      default: return s; //is a regular string (neither type 1 or type 2). Just return the string 
    }
    
    rawHeaderBytes=null; //raw bytes extracted from input string
    //var decodedHeader=null; //base 64 decoded header bytes
    headerOffset = 0; //starting location after the header (type1 = 5, type2 = 7)
    actionLength = 0;  //length of the (type 2) action portion

    rawHeaderBytes = s.slice(0, 5); //ignore 1st byte, the next 4 is the type 1 header
    headerOffset=5;
    if(isType2) {  //type 2 RiListString
      rawHeaderBytes = rawHeaderBytes+'A'+'A'+s.slice(5, 7); //type 2 header. The two padding bytes allow the 'action' string length to be properly decoded using base 64
      headerOffset = 7; //header offset for type 2 'action' string
    }

    try {
      val = base64Decode(rawHeaderBytes);  //extract the, base 64 encoded, type1 header portion
      //temp = base64Encode(val, 4); //test the reverse action (debug)
      riString = {};

      temp = ((val >>> 20) & 0xf); //color: 4 bits
      if(temp!==0) { riString.color  = temp; } //create entry only if actually has a value
      temp = ((val >>> 16) & 0xf); //indent: 4 bits
      if(temp!==0) { riString.indent = temp; }
      temp = ((val >>> 14) & 0x3); //font: 2 bits
      if(temp!==0) { riString.font   = temp; }
      temp = (val & 0x3fff);       //tag: 14 bits
      if(temp!==0) { riString.tag    = temp; }
    
      if(isType2) { //for type 2 decode the 'action' string
        //determine the action command length then extract it
        actionLength = ((rawHeaderBytes[4] & 0xff) << 8) + (rawHeaderBytes[5] & 0xff); //convert to int
        if(headerOffset+actionLength > s.length) { //check that specified action string length is not larger than available bytes.  
          console.log('Error parsing RiString (type 2) action cmd because of length: action cmd length='+actionLength+'. Available string length='+(s.length-headerOffset));
          actionLength = 0; //if so then set action string to zero so that bytes show up in the regular string data (to help in debug)
        }
        riString.action = s.slice(headerOffset, headerOffset+actionLength);
      }
    }
    catch(e) {
      console.log('Unable to convert RiString header because: '+e);
    }
    riString.text = s.slice(headerOffset+actionLength); //take the remainder as the text. For type1 = 5, for type2 = (7+length of action string)
    riString.header= isType2 ? s.slice(1, 7) : rawHeaderBytes; //the raw header portion
    return riString;
  };
  
  /**Given a RIRI2/RIRI3 separated string, parse it into json*/
  var parseSmMsgs = function(smMsgs) {
    var s, ndx, b, item0, p, key;
    var val0, entry, len;
    var smMsgsJson;
    var a = smMsgs.split(RIRISEP2); //split on second level riri separator
  
    smMsgsJson = []; //assemble the results into here
    if(!a[0] || a[0].length===0) { a.shift(); } //remove the first element if empty (implies a leading sep, which gets tossed)
    len = a.length;
    for(ndx=0; ndx<len; ndx++) {
      if(a[ndx].indexOf(RIRISEP3) < 0) { //if no 3rd level seps it just goes in directly
        s = riStringCheckAndConvert(a[ndx]); //convert to riString if needed
        smMsgsJson.push(s);
      }
      else { //may have a sep after the equals: "key=SEP val1 SEP val2..." -or- may not: "key=val1 SEP val2..." 
        b = a[ndx].split(RIRISEP3); //sep by level 3
        if(b.length===0) { continue; } //is this check useful?
        item0 = b[0];
        p=item0.indexOf('='); //check the first entry for an assignment operator, e.g. "contents=..."
        if(p<0) { p=item0.indexOf(':'); } //assignment used in turtle graphics
        
        if(p>=0) { //if 1st item has assignment: split it int key and value portions: key=val1, val2, val3 --> {key:[val1, val2, val3]
          key=item0.substring(0, p); //extract the 'key' portion
          if(p+1 < b.length) { //if there was anything after the equals that means there was no leading separator before the first value: key=val SEP val...
            val0 = item0.substring(p+1);
            b[0] = val0; //replace first entry with the cleaned up one ('key=' removed)
          }
          else { //first entry had nothing after the equals so just remove it 
            b.shift(); //remove first entry from array
          }
          
          var len2 = b.length;
          for(var ndx2=0; ndx2<len2; ndx2++) { //check for any riString entries
            b[ndx2] = riStringCheckAndConvert(b[ndx2]); //convert to riString if needed
          }
          entry = {};
          entry[key] = b;
          smMsgsJson.push(entry);
        }

        else { smMsgsJson.push(b); } //no assignment on the first entry so just it take as an array
      }
    }
    return smMsgsJson;
  };
  
  /**This returns a javascript object, given a string representing an sm (Guru System Message).
   * If the given string is in raw sm format (i.e. it has riri separators in it) this parses it,
   * if the given string in in json format then parses it directly.
   * */
  var convertSmToObject = function(sm) {
    var isJson, a, alen, len, ndx, smHeader, smChannel, smMsgs;
    var respVal, hdrArray;
    var key, val, pos, keyval;


    if(!sm) { return sm; } //nothing to do
    
    isJson=false;
    if(sm.length < 10) { //for short strings can just check the whole length
      if(sm.indexOf(RIRISEP2)<0) { //not a raw sm (already json), just 'eval' it
        isJson=true;
      }
    }
    else if(sm[2]!==RIRISEP2 && sm[3]!==RIRISEP2) { isJson=true; }
    
    if(isJson) {
      return JSON.parse(sm); //not necessarily available in all browsers, on older ones may have to 'eval' instead
      //return eval('['+sm+']')[0]; //wrapper the sm in an array is a hack to fix browser issue with single {} received
    }

    //Convert raw sm into a javascript object:
    a = sm.split(RIRISEP1); //split the sm at top level riri separator
    alen = a.length;
    ndx=0;
    smHeader = a[ndx++]; //if there was no leading sep then the header is going in here
    if(smHeader===undefined || smHeader.length===0) { //if got a leading sep then that 1st entry is empty
      smHeader = a[ndx++];
    }
    smChannel = a[ndx++];
    smMsgs = [];
    while(ndx < alen) { //append all the remaining entries as the messages portion
      smMsgs.push(parseSmMsgs(a[ndx++]));
    }
    respVal = {}; //assemble the value to be returned

    hdrArray = smHeader.split(RIRISEP2); //separate the header entries
    len = hdrArray.length;
    for(ndx=0; ndx<len; ndx++) { //populate smJson header portion: { SM:, SMDST:nnn, SMSRC:nnn, SRC:nnn, MSGID:nnn, TTL:nnn, etc. }
      keyval = hdrArray[ndx]; //separate key=value from given item
      pos = keyval.indexOf('=');
      if(pos<0) { key = keyval; val=null; }
      else {
        key = keyval.substring(0, pos);
        val = keyval.substring(pos+1);
      }
      respVal[key]=val;
    }
    respVal.CHANNEL = smChannel;
    respVal.MSGS = smMsgs;
    
    return respVal;
  };
  
  
  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    toRiri: toRiri,
    sendSm: sendSm,
    riStringCheckAndConvert: riStringCheckAndConvert,
    convertSmToObject: convertSmToObject
    
  }; //closure return
  
}()); //namespace riutil
