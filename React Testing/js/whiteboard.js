var sysMsgs = {"toppane":{"_kind":"toppane","label":"Guru Browser for latest on local","identifier":"top","type":"viewModel","windowSize":"100@80","model":".identifier","subpane":[{"_kind":"subpane","class":"ListPane","owner":"top","frameRatio":"0@95;20@65","identifier":"key1","enableEvent":["getMenu","select"],"selector":"selectKey1","menu":{"_kind":"menu","owner":"key1","identifier":"keysMenu","selector":"menuKeys","value":{"addListItem":[{"Key1=Class":{"tag":"4002"}},{"Key1=Copies":{"tag":"4003"}},{"Scope=Local":{"tag":"4004"}},{"Scope=Update":{"tag":"4005"}},{"Scope=All":{"tag":"4006"}}]}}},{"_kind":"subpane","class":"Button","owner":"top","contents":"none","frameRatio":"0@100;20@95","foreColor":"1","enableEvent":"select","selected":"true","selector":"PromptForKey1","identifier":"15"},{"_kind":"subpane","class":"ListPane","owner":"top","frameRatio":"20@95;40@65","identifier":"key2","selector":"selectKey2","enableEvent":["getMenu","select"]},{"_kind":"subpane","class":"Button","owner":"top","contents":"none","frameRatio":"20@100; 40@95","enableEvent":"select","foreColor":"1","selector":"promptForKey2","identifier":"16","seleced":"true"},{"_kind":"subpane","class":"ListPane","owner":"top","frameRatio":"40@100;100@60","identifier":"title","selector":"selectTitle","enableEvent":["getMenu","select"],"menu":{"_kind":"menu","owner":"title","identifier":"objectsMenu","selector":"menuObjects","value":{"addListItem":[{"Launch":{"tag":"4011"}},{"Edit":{"tag":"4010"}},{"Show Latest":{"tag":"4012"}},{"Show All":{"tag":"4013"}},{"Select All":{"tag":"4014"}},{"Make Current":{"tag":"4017"}},{"Delete":{"tag":"4015"}},{"Remove from Local":{"tag":"4016"}}]}}},{"_kind":"subpane","class":"TextPane","owner":"top","frameRatio":"0@60; 100@0","identifier":"text","font":"~LucindaTypewriterRegular~plain~14","menu":{"_kind":"menu","owner":"text","identifier":"textMenu","value":{"addListItem":[{"Cut":{"tag":"1001"}},{"Copy":{"tag":"1002"}},{"Select All":{"tag":"1005"}},{"Word Wrap":{"tag":"1006"}},{"Find/Replace":{"tag":"1007"}},{"Find Again":{"tag":"1008"}}]}}},{"_kind":"subpane","class":"GroupPane","owner":"top","frameRatio":"0@65;20@60","identifier":"5","subpane":[{"_kind":"subpane","class":"Button","owner":"5","contents":"Keys","frameRatio":"0@100;33@0","selected":"true","enableEvent":"select","selector":"selectTitle","selectionGroup":"~12~11","identifier":"10"},{"_kind":"subpane","class":"Button","owner":"5","contents":"Partial","frameRatio":"33@100;66@0","selector":"selectTitle","enableEvent":"select","selectionGroup":"~12~10","identifier":"11"},{"_kind":"subpane","class":"Button","owner":"5","contents":"All","frameRatio":"66@100;100@0","selector":"selectTitle","enableEvent":"select","selectionGroup":"~10~11","identifier":"12"}]},{"_kind":"subpane","class":"GroupPane","owner":"top","frameRatio":"20@65;40@60","identifier":"6","subpane":[{"_kind":"subpane","class":"Button","owner":"6","contents":"Name","frameRatio":"0@100;50@0","selector":"selectKey2","enableEvent":"select","selectionGroup":"~14","identifier":"13"},{"_kind":"subpane","class":"Button","owner":"6","contents":"Title","frameRatio":"50@100;100@0","selected":"true","selector":"selectKey2","enableEvent":"select","selectionGroup":"~13","identifier":"14"}]}]},"attribute":{"_kind":"attribute","scope":"local","range":"latest"},"command":"createView"};

var makeStyleFromFrameRatio = function(frameRatio) {
    var wd, ht, xpos, ypos;
    if(frameRatio) { //frameRatio is percent values for: left, right, top, bottom
      wd = (frameRatio.right-frameRatio.left)+'%';
      ht = (frameRatio.top-frameRatio.bottom)+'%';
      xpos = frameRatio.left;
      ypos = 100-frameRatio.top;
    }
    else {
      wd = 'auto';
      ht='auto';
      xpos = 0;
      ypos = 0;
    }
    return ({position: "absolute", left: xpos+"%", top: ypos+"%", width: wd, height: ht});
};
  
var getFrameRatioFor = function(val) {
    var frameRatio, doing, p0, ndx, len; //local vars
    frameRatio = {};
    doing=0; //start with 0 (left)
    p0=0; //index of start of substring
    len = val.length;
    for(ndx=0; ndx<len; ndx++) {
    //walk through the string
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
  

var toppane = React.createClass({
    render: function() {
        console.log(React.createElement('div', {id: this.identifier}));
        document.title = sysMsgs.label;
        //for (let i = 0; i < Object.keys(this.subpane).length - 1; i++) {
        //     this.subpane[i].render();
        //}
        return React.createElement('div', {id: this.identifier});
    }
});

var attribute = React.createClass({
    render: function() {
        return React.createElement('div', {id: this._kind});
        //(React.Component.setState("scope", this.scope),React.Component.setState("range", this.range))
    }
});

var command = React.createClass({
    render: function() {
        return;
        //(React.Component.setState("scope", this.scope),React.Component.setState("range", this.range))
    }
});







var subpane = React.createClass({
    render: function() {
        switch (this.class) {
            case 'Button':
            switch (this.selector) {
                case 'selectTitle':
                return (
                    React.createElement('form',"",
                        React.createElement('input',{
                            id: this.identifier,
                            type: "radio",
                            name: this.selector,
                            checked: this.selected,
                            enableEvent: this.enableEvent,
                            selectionGroup: this.selectionGroup,
                            style: makeStyleFromFrameRatio(getFrameRatioFor(this.frameRatio))
                        })
                    )
                );
                
                default:
                return (
                    React.createElement('button', {
                        id: this.identifier,
                        className: this.class,
                        style: makeStyleFromFrameRatio(getFrameRatioFor(this.frameRatio))
                    })    
                );
            } 
            case 'TextPane':
            return React.createElement('div', {
                id: this.identifier, className: this.class,
                style: makeStyleFromFrameRatio(getFrameRatioFor(this.frameRatio))
            });
        
            default:
            return React.createElement('div', {id: this.identifier, className: this.class, style: makeStyleFromFrameRatio(getFrameRatioFor(this.frameRatio))});
        }
    }
});

var renderMsg = function(obj) {
    for (var o in obj) {
        console.log(o);
       React.createElement('toppane', o, o.subpane);
    }
};



//var a = (<ul id={this.identifier}></ul>);
//var menu = (React.createClass({
//    render: function() {
//        a;
//    }
//});

//var addListItem = React.createClass({
//    render: function() {
//        <li tag={this.tag}>{this._name}</li>
//    }
//});
    
//     console.log(Object.keys(sysMsgs.message).length)
//
ReactDOM.render(renderMsg(sysMsgs), document.getElementById('whiteboard'));
//
//
var app = (
    <toppane id="top">
        <subpane id="key1">
            <menu id="keysMenu">
                <addListItem tag="4002"></addListItem>
            </menu>
        </subpane>
    </toppane>
);
//            
//ReactDOM.render( app, document.getElementById('app'))         

//    ----OLD-----
//
//document.title = SM.message[0].label;
//
//var rootElement =  React.createElement(typeOfElement(SM.message.class), {id: SM.message.identifier, className: SM.message.class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message.frameRatio))})
//
//
//ReactDOM.render(rootElement, document.getElementById(SM.message.owner));
//
//}
  //[0] = toppane
  //[1]= attribute
  //[2] = subpane
  //[15] = menu
//var rootElement =
//    React.createElement('div', {id: SM.message[0].identifier}, //id=top
//        React.createElement('div', {id: SM.message[2].identifier, className: SM.message[2].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[2].frameRatio))}),
//        React.createElement(typeOfElement(SM.message[3].class), {id: SM.message[3].identifier, className: SM.message[3].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[3].frameRatio))}),
//        React.createElement('div', {id: SM.message[4].identifier, className: SM.message[4].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[4].frameRatio))}),
//        React.createElement('div', {id: SM.message[5].identifier, className: SM.message[5].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[5].frameRatio))}),
//        React.createElement('div', {id: SM.message[6].identifier, className: SM.message[6].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[6].frameRatio))}),
//        React.createElement('div', {id: SM.message[7].identifier, className: SM.message[7].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[7].frameRatio))}),
//        React.createElement('div', {id: SM.message[8].identifier, className: SM.message[8].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[8].frameRatio))},
//            React.createElement('div', {id: SM.message[9].identifier,className: SM.message[9].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[9].frameRatio))}),
//            React.createElement('div', {id: SM.message[10].identifier, className: SM.message[10].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[10].frameRatio))}),
//            React.createElement('div', {id: SM.message[14].identifier, className: SM.message[14].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[14].frameRatio))})
//        ),
//        React.createElement('div', {id: SM.message[11].identifier, className: SM.message[11].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[11].frameRatio))},
//            React.createElement('div', {id: SM.message[12].identifier, className: SM.message[12].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[12].frameRatio))}),
//            React.createElement('div', {id: SM.message[13].identifier, className: SM.message[13].class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message[13].frameRatio))})              
//        )
//       
//       
//    )


 //var organizeOwners = function(obj) {
 //   if (owner != "top") {
 //        if (document.getElementById(owner)) { //document.getElementById??? if exists
 //          let parentObj = NULL;
 //                           for (let i = 0; i < Object.keys(SM.message).length - 1; i++) {
 //                               if (SM.message[i].identifier == obj.message[i].owner) {
 //                                   parentObj = SM.message[i];
 //                                   break;
 //                               }
 //                               React.createElement('div', {id: parentObj.message.identifier, className: SM.message.class, style: makeStyleFromFrameRatio(getFrameRatioFor(parentObj.message.frameRatio))},
 //                                   React.createElement('div', {id: obj.message.identifier, className: SM.message.class, style: makeStyleFromFrameRatio(getFrameRatioFor(obj.message.frameRatio))})
 //                               )
 //                           }
 //          organizeOwners(parentObj);
 //        } //else if owner doesn't exist/not yet created, do not render
 //   }
 //   React.createElement('div', {id: SM.message.identifier, className: SM.message.class, style: makeStyleFromFrameRatio(getFrameRatioFor(SM.message.frameRatio))})//if owner is top, render without nesting (top level) OR render into a div with id="top"
 // };                                         //^ currently message is in array  ^ but won't be when sent individually, so won't work right now    