//client script for model syncing.

var ss = require('socketstream');

var requestId = 0; //only needs to be unique within a session since server uses middleware
var callbacks = {};

module.exports = function(responderId, config, send) {
  ss.registerApi('linkModel', function() {
    var args = Array.prototype.slice.call(arguments);
    var modelName = args[0];
    var callBack = args[1];
    var params = args.slice(1,args.length-1);

    if(modelName && modelName.length > 0) {
      if(callbacks[modelName]) {
        console.log("Already syncing the model. Adding callback");
        callbacks[modelName].push(callBack);
      }
      else {
        console.log("Syncing model " + modelName + " with the server");
        var request = {
          m: "LINK",
          n: modelName,
          p: params
        };
        callbacks[modelName] = [callBack];
        send(JSON.stringify(request));
      }
    }
    else {
      console.log("Error: invalid model: " + modelName);
    }
  });

  ss.message.on(responderId, function(msg) {
    var res = JSON.parse(msg);
    if(res.r === "OK") {
      if(res.m && res.n) {
        var cbs = callbacks[res.n];
        for(var i = 0; i < cbs.length; i++) {
          cbs[i](res.m);
        }
      }
    }
    else {
      console.log("Error! Bad response: " + JSON.stringify(res));
    }
  });
};
