/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, nomen: true, plusplus: true, vars: true, white: true, windows: false */

/**Base64 encode / decode
 * http://www.webtoolkit.info/
 * From: http://www.webtoolkit.info/javascript-base64.html
 * 
 * This javascript code is used to encode / decode data using base64 encoding. 
 * It is fully compatible with UTF-8 encoding. 
 * You can use base64 encoded data as simple encryption mechanism. 
 * If you plan using UTF-8 encoding in your project don’t forget to set the page encoding 
 * to UTF-8 (Content-Type meta tag).
 * */
var Base64 = {
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", //private property
  
  encode : function (input) { // public method for encoding
    "use strict"; //enable javascript strict mode
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
 
      if (isNaN(chr2)) { enc3 = enc4 = 64; } 
      else if (isNaN(chr3)) { enc4 = 64; }
      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }
    return output;
  },
 
  decode : function (input) { // public method for decoding
    "use strict"; //enable javascript strict mode
    var output='';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var ch;
 
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
    while (i < input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
 
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      
      ch = String.fromCharCode(chr1);
      output += ch;
 
      if (enc3 !== 64) { 
        ch = String.fromCharCode(chr2);
        output += ch; 
      }
      if (enc4 !== 64) { 
        ch = String.fromCharCode(chr3);
        output += ch; 
      }
    }
    output = Base64._utf8_decode(output);
    return output;
  },
 
  _utf8_encode : function (string) { // private method for UTF-8 encoding
    "use strict"; //enable javascript strict mode
  var n;
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
 
    for (n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) { utftext += String.fromCharCode(c); }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  },
 
  _utf8_decode : function (utftext) { // private method for UTF-8 decoding
    "use strict"; //enable javascript strict mode
    var string = "";
    var i = 0;
    var c, c2, c3;
    var ch;
    c = c2 = c3 = 0;
 
    while ( i < utftext.length ) { //one byte values
      c = utftext.charCodeAt(i);
      if (c < 128) {
        ch = String.fromCharCode(c);
        string += ch;
        i++;
      }
      else if((c > 191) && (c < 224)) { //two byte values
        c2 = utftext.charCodeAt(i+1);
        ch = ((c & 31) << 6) | (c2 & 63);
        ch = String.fromCharCode(ch);
        string += ch;
        i += 2;
      }
      else { //three byte values
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        ch = ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63);
        ch = String.fromCharCode(ch);
        string += ch;
        i += 3;
      }
    }
    return string;
  }
};
