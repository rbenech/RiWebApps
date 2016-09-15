import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './components/App';
import toppane from './components/toppane';

let message = ({"toppane":{"label":"Guru Browser for latest on local","identifier":"top","type":"viewModel","windowSize":"100@80","model":".identifier"},"attribute":{"scope":"local","range":"latest"},"subpane":[{"class":"ListPane","owner":"top","frameRatio":"0@95;20@65","identifier":"key1","enableEvent":["getMenu","select"],"selector":"selectKey1"},{"class":"Button","owner":"top","contents":"none","frameRatio":"0@100;20@95","foreColor":"1","enableEvent":"select","selected":"true","selector":"PromptForKey1","identifier":"15"},{"class":"ListPane","owner":"top","frameRatio":"20@95;40@65","identifier":"key2","selector":"selectKey2","enableEvent":["getMenu","select"]},{"class":"Button","owner":"top","contents":"none","frameRatio":"20@100; 40@95","enableEvent":"select","foreColor":"1","selector":"promptForKey2","identifier":"16","seleced":"true"},{"class":"ListPane","owner":"top","frameRatio":"40@100;100@60","identifier":"title","selector":"selectTitle","enableEvent":["getMenu","select"]},{"class":"TextPane","owner":"top","frameRatio":"0@60; 100@0","identifier":"text","font":"~LucindaTypewriterRegular~plain~14"},{"class":"GroupPane","owner":"top","frameRatio":"0@65;20@60","identifier":"5"},{"class":"Button","owner":"5","contents":"Keys","frameRatio":"0@100;33@0","selected":"true","enableEvent":"select","selector":"selectTitle","selectionGroup":"~12~11","identifier":"10"},{"class":"Button","owner":"5","contents":"Partial","frameRatio":"33@100;66@0","selector":"selectTitle","enableEvent":"select","selectionGroup":"~12~10","identifier":"11"},{"class":"GroupPane","owner":"top","frameRatio":"20@65;40@60","identifier":"6"},{"class":"Button","owner":"6","contents":"Name","frameRatio":"0@100;50@0","selector":"selectKey2","enableEvent":"select","selectionGroup":"~14","identifier":"13"},{"class":"Button","owner":"6","contents":"Title","frameRatio":"50@100;100@0","selected":"true","selector":"selectKey2","enableEvent":"select","selectionGroup":"~13","identifier":"14"},{"class":"Button","owner":"5","contents":"All","frameRatio":"66@100;100@0","selector":"selectTitle","enableEvent":"select","selectionGroup":"~10~11","identifier":"12"}],"menu":[{"owner":"key1","identifier":"keysMenu","selector":"menuKeys","value":{"addListItem":[{"Key1=Class":{"tag":"4002"}},{"Key1=Copies":{"tag":"4003"}},{"Scope=Local":{"tag":"4004"}},{"Scope=Update":{"tag":"4005"}},{"Scope=All":{"tag":"4006"}}]}},{"owner":"title","identifier":"objectsMenu","selector":"menuObjects","value":{"addListItem":[{"Launch":{"tag":"4011"}},{"Edit":{"tag":"4010"}},{"Show Latest":{"tag":"4012"}},{"Show All":{"tag":"4013"}},{"Select All":{"tag":"4014"}},{"Make Current":{"tag":"4017"}},{"Delete":{"tag":"4015"}},{"Remove from Local":{"tag":"4016"}}]}},{"owner":"text","identifier":"textMenu","value":{"addListItem":[{"Cut":{"tag":"1001"}},{"Copy":{"tag":"1002"}},{"Select All":{"tag":"1005"}},{"Word Wrap":{"tag":"1006"}},{"Find/Replace":{"tag":"1007"}},{"Find Again":{"tag":"1008"}}]}}],"command":"createView"});

let store = createStore(message);

render(
    <toppane />
        <
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root');
);