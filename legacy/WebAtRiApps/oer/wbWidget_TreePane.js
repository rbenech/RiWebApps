/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */
/*globals ri, dojo, dijit*///for jslint
/**
 * ----------------------------------------------------------------------------------------- 
 * wbWidget_TreePane.js: Whiteboard TreePane widget 
 * This represents a TreePane widget for the whiteboard application.
 * 
 * History: 
 *   10/24/2013 oer: -Created 
 *   ---------------------------------------------------------------------------------------
 */

var wb = wb || {}; //namespace for the whiteboard module

/** module definition */
wb.Widget_TreePane = function(whiteboard) {

  //Closure local variables:
  //------------------------
  var widgetId = null; //the identifier used to refer to this widget
  var parentWidget = null;
  var frameRatio = null;
  var lastSelectedValue = null;

  //Closure function definitions:
  //-----------------------------

  /** Function getSelected: Returns value of selected element or null if nothing is selected. This is called anytime an SM event occurs */
  var getSelected = function() {
    return lastSelectedValue;
  };

  /** Function setContents. given parameter 'contents' is a list of RiStrings */
  var setContents = function(widgetId, frameRatio, contents) {
    var treeHolderElem, tree, treeModel, treeDataStore, elemStyle; //local vars

    //Create an element to wrapper the tree (establishes position and size):
    treeHolderElem = whiteboard.browserDocument.getElementById(widgetId);
    if(treeHolderElem) { //no reason for it not to exist, doConfigure creates it
      dojo.empty(treeHolderElem); 
        
      if(tree) {
        tree.destroyRecursive(); //destroy any previously built version so can create anew
      }
  
      if(!contents || contents.length == 0) //if got no data then nothing to do
        return;
      
      //Create the tree (data store, data model, tree):
      treeDataStore = new dojo.data.ItemFileReadStore({ //data store for the tree model
        //var contentsArray = val.contents || { identifier: 'index', label: 'text', items:[] }; //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
        data : riutil.getTreeFor(contents), //contents is a list of RiStrings: QAAAitem1, QAAAitem2,...
        getChildren : function(object) {
          if(object) return object.kids;
          else return null;
        }
      });

      treeModel = new dijit.tree.ForestStoreModel({ //the tree model
        store : treeDataStore,
        query : { //initial query. Since is a forest, everything at level zero will be displayed as a root
          indent : '0'
        }, 
        //rootId: 'root',
        //rootLabel: 'Root',
        childrenAttrs : [ 'kids' ]
      });

      tree = new dijit.Tree({
        model : treeModel,
        showRoot : false,
        openOnClick : false, //note: if openOnClick is true then only leaf nodes can emit events
        persist : true
      }); 
      
      tree.placeAt(treeHolderElem, "first"); //install the newly created tree
      
      tree.onClick = function(item, treeNode) { //when tree is clicked, emit sm event
        lastSelectedValue = riutil.getAsRiStringWithHeader(item); //emit full riString (header+text)
        whiteboard.emitSmEvent(widgetId, lastSelectedValue);
      };
    }
  }; //function

  /** Function doConfigure: This is called when the widget is ready to be configured (all the settings are in) */
  var doConfigure = function() {
    var treeHolderElem, elemStyle, doc; //local vars
    
    doc = whiteboard.browserDocument;

    //Create an element to wrapper the tree (establishes position and size):
    treeHolderElem = doc.getElementById(this.widgetId);
    if(!treeHolderElem) { //get existing html element or else make a new one
      treeHolderElem = doc.createElement('div');
      treeHolderElem.setAttribute('id', this.widgetId);
      treeHolderElem.setAttribute('class', 'claro');

      var elem = doc.getElementById(whiteboard.rootDiv);
      elem.appendChild(treeHolderElem); //append the new element
    }
    elemStyle = riutil.makeStyleFromFrameRatio(this.frameRatio); //makes: style="position:absolute; left:20%; top:30%; width:40%; height:50%;"
    elemStyle += '; overflow:auto'; //auto or scroll here makes it have scrollbars
    elemStyle += '; border: solid 1px gray'; //add a border
    treeHolderElem.setAttribute('style', elemStyle);

    delete this.doConfigure; //remove this function after executing it (running it is a one-time occurrence)
  }; //function

  /** Function executeCmd: Used to parse received messages. */
  var executeCmd = function(cmd, val) {
    switch(cmd) {
      case 'contents':
        setContents(this.widgetId, this.frameRatio, val.contents);
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

}; //wb.Widget_TreePane
