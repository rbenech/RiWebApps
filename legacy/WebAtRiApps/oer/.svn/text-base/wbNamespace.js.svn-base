/*jslint devel: true, browser: true, continue: true, windows: false, vars: true, evil: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals ri*/ //for jslint

/**-----------------------------------------------------------------------------------------
  wbNamespace.js
  This contains the namespace related functionality for the whiteboard application.
  This should be listed first in the list of includes.
  12/28/2011 oer
  ------------------------------------------------------------------------------------------
*/

var ri = ri || {};    //namespace for the ri module. (create if doesn't already exist)

/**Namespace function for the ri module. 
 * note: ri.namespace('ri.wb.util'); is  equivalent to: var ri = { wb: { util: {} } };
 * 
 * Usage examples:
 *
 * Assign returned value to a local var:
 *    var wbUtil = ri.namespace('ri.util');
 *    wbUtil === ri.util; // -->true
 * Skip initial `ri`: 
 *    ri.namespace('util');
 * * /
ri.namespace = function(ns_string) {
  "use strict"; //enable javascript strict mode
  var parts = ns_string.split('.'),
      parent = ri,
      i;
  if(parts[0] === "ri") { //strip redundant leading global
    parts = parts.slice(1);
  }
  for(i=0; i<parts.length; i++) { // create a property if it doesn't exist
    if(typeof parent[parts[i]] === "undefined") {
      parent[parts[i]] = {};
    } 
    parent = parent[parts[i]];
  }
  return parent;
};
*/