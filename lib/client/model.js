//client script for model syncing.

var ss = require('socketstream');

var nextRequestId = 0; //only needs to be unique within a session since server uses middleware
var callbacks = {};

module.exports = function(responderId, config, send) {
  ss.registerApi('linkModel', function() {
    var args = Array.prototype.slice.call(arguments);
    var modelName = args[0];
    var callBack = args[1];

    if(modelName && modelName.length > 0) {
      console.log("Syncing model " + modelName + " with the server");
      var request = {
        method: "LINK",
        model: modelName,
        id: ++nextRequestId
      };
      callbacks[request.id] = callBack;
      send(JSON.stringify(request));
      return request.id;
    }
    else {
      console.log("Error: invalid model: " + modelName);
      return -1;
    }
  });

  ss.message.on(responderId, function(msg) {
    var res = JSON.parse(msg);
    if(res.response === "OK") {
      callbacks[res.id](res);
    }
    else {
      console.log("Error! Bad response: " + JSON.stringify(res));
    }
  });
};
