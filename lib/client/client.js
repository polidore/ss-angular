'use strict';
var ss = require('socketstream');

var requestId = 0; //only needs to be unique within a session since server uses middleware
var callbacks = {};

var isReady = false;
var queued = [];
ss.server.on('ready', function() {
  isReady = true;
  queued.forEach(function(q) {
    q();
  });
  queued = [];
});

function parseRequest() {
  var r = {};
  var args = Array.prototype.slice.call(arguments[0]);
  r.modelName = args[0];
  r.params = args[1];
  r.callBack = args[2];

  if(r.params) {
    try {
      r.paramString = JSON.stringify(r.params);
    }
    catch(e) {
      throw new Error("params must be a single JSON object",e);
    }
  }
  else {
    r.paramString = "*";
  }

  if(!r.modelName || r.modelName.length === 0) {
    throw new Error("Invalid model name");
  }

  r.requestName = r.modelName + "/" + r.paramString;
  return r;
}


module.exports = function(responderId, config, send) {
  ss.registerApi('linkModel', function() {
    var req = parseRequest(arguments);

    if(callbacks[req.requestName]) {
      throw new Error("Already syncing the model. Duplicate subscriptions not currently supported");
    }
    else {
      console.log("Syncing model " + req.requestName + " with the server");
      var request = {
        m: "LINK",
        n: req.modelName,
        p: req.params
      };
      callbacks[req.requestName] = req.callBack;
      var go = function() {
        send(JSON.stringify(request));
      };
      if(isReady) {
        go();
      }
      else {
        queued.push(go);
      }
    }
  });

  ss.registerApi('unlinkModel', function() {
    var req = parseRequest(arguments);
    if(!callbacks[req.requestName]) {
      return;
    }
    else {
      delete callbacks[req.requestName];
    }

    var request = {
      m: "UNLINK",
      n: req.modelName,
      p: req.params
    };

    var go = function() {
      send(JSON.stringify(request));
    };
    if(isReady) {
      go();
    }
    else {
      queued.push(go);
    }
  });

  ss.message.on(responderId, function(msg) {
    var res = JSON.parse(msg);
    if(res.r === "OK") {
      if(res.o && res.n) {
        var cb = callbacks[res.n];
        if(!cb) {
          return;
        }
        else {
          cb(res.o);
        }
      }
      else if(res.m && res.i) {
        console.log("Received confirmation of " + res.m + " for " + res.n + " with status: " + res.i);
      }
      else {
        throw new Error("Unknown response: " + JSON.stringify(res));
      }
    }
    else if(res.r === "NOAUTH") {
      console.log("No credentials for model");
      delete callbacks[res.n];
    }
    else {
      throw new Error("Server error: " + JSON.stringify(res));
    }
  });
};
