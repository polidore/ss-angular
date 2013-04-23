'use strict';
var fs = require('fs'),
    path = require('path');

var clients = {};

module.exports = function(responderId, config, ss) {
  var name = config && config.name || 'model';
  var pollFreq = config && config.pollFreq || 1000;
  var timeout = config && config.timeout || 5000;

  ss.client.send('mod','ssAngular', loadFile('ssAngular.js')); //angular integrations
  ss.client.send('mod', 'synced-model', loadFile('client.js'));
  ss.client.send('code', 'init', "require('synced-model')("+responderId+", {}, require('socketstream').send("+responderId+"));");

  return {
    name: name,
    interfaces: function(middleware) {
      var model = require('./model')(ss,middleware);

      return {
        websocket: function(msg, meta, send) {
          msg = JSON.parse(msg);

          var req = {
            method: msg.m,
            modelName: msg.n,
            params: msg.p,
            socketId: meta.socketId,
            clientIp: meta.clientIp,
            sessionId: meta.sessionId,
            transport: meta.transport,
            receivedAt: Date.now()
          };

          if(req.params) {
            try {
              req.paramString = JSON.stringify(req.params);
            }
            catch(e)
            {
              throw new Error("Params not in JSON form!", e);
            }
          }
          else {
            req.paramString = "*";
          }

          req.requestName = req.modelName + "/" + req.paramString;

          var msgLogName = ("model:" + req.requestName).grey;

          var handleError = function(e) {
            var message;
            if(meta.clientIp === '127.0.0.1') {
              message = e.stack;
            }
            else {
              message = 'See server-side logs';
            }

            var obj = {e: {message: message}};
            ss.log("<-".red, msgLogName, req.method, req.requestName, e);
            if(e.stack) {
              ss.log(e.stack.split("\n").splice(1).join("\n"));
            }
            send(JSON.stringify(obj));
          };

          if(req.method === 'LINK') {
            try {
              if(clients[req.socketId]) { //client already exists
                if(clients[req.socketId][req.requestName]) { //already syncing model
                  throw new Error("Duplicate request" + JSON.stringify(req));
                }
              }
              else {
                clients[req.socketId] = {};
              }

              var client = clients[req.socketId];
              var socket;

              var updateModel = function() {
                var timeoutId = setTimeout(function() {
                  ss.log(msgLogName,"Model never called back after ".red + timeout/1000 + " seconds".red);
                },timeout);

                var modelStart = Date.now();
                req.lastHash = client[req.requestName].lastHash;
                model(req, function(err, modelObj) {
                  clearTimeout(timeoutId);
                  var elapsed = Date.now() - modelStart;
                  var logObj = {timeStamp:Date.now(),session:req.sessionId,clientIp:req.clientIp,model:req.modelName,params:req.params,elapsed:elapsed};
                  ss.publish.channel('ss-angular.telemetry', 'modelTime', logObj);

                  if(err) {
                    try {
                      stopPolling(req.socketId,req.requestName);
                    }
                    catch(e) {
                      ss.log('Error and could not stop polling'.red, e);
                    }
                    handleError(err);
                  }
                  else if(!client[req.requestName]) {
                    ss.log(msgLogName, "Request removed");
                    return;
                  }
                  else {
                    var responseObj;
                    if(!modelObj) {
                      var error = 'NOAUTH';
                      ss.log(msgLogName, error.red);
                      responseObj = {
                        r: error,
                        o: modelObj,
                        n: req.requestName
                      };
                      try {
                        stopPolling(req.socketId,req.requestName);
                      }
                      catch(e) {
                        handleError(e);
                      }
                    }
                    else if(modelObj.hash && client[req.requestName].lastHash === modelObj.hash) {
                      poll(client[req.requestName]);
                      return;
                    }
                    else {
                      if(modelObj.hash) {
                        client[req.requestName].lastHash = modelObj.hash;
                      }
                      responseObj = {
                        r: "OK",
                        o: modelObj,
                        n: req.requestName
                      };
                    }
                    socket = send(JSON.stringify(responseObj));
                    poll(client[req.requestName]);
                  }
                });
              };

              var poll = function(request) {
                if(!request) {
                  return;
                }
                request.timeoutId = setTimeout(function() {
                  if(!socket || socket.readyState === 'closed') {
                    ss.log(msgLogName,'Client Disconnected. Stopping updates'.yellow);
                    stopPolling(req.socketId, req.requestName);
                    return;
                  }
                  try {
                    updateModel();
                  }
                  catch(e) {
                    handleError(e);
                  }
                }, pollFreq);
              };

              client[req.requestName] = {};

              var res = {};
              res.m = req.method;
              res.r = "OK";
              res.i = "Subscribed to model";
              res.n = req.requestName;
              ss.log("<-".green,res.r.green,msgLogName,res.i);
              send(JSON.stringify(res));

              process.nextTick(function() {
                try {
                  updateModel();
                }
                catch(e) {
                  handleError(e);
                }
              });
            }
            catch(e) {
              try {
                stopPolling(req.socketId,req.requestName);
              }
              catch(e) {
                ss.log(msgLogName, "Could not stop polling in an error case. Not always a problem: ", e);
              }
              handleError(e);
            }
          }
          else if(req.method === "UNLINK") {
            try {
              stopPolling(req.socketId,req.requestName);
            } 
            catch(e) {
              ss.log("Could not unsubscribe from ".red, JSON.stringify(req));
              handleError(e);
              return;
            }
            var res = {};
            res.m = req.method;
            res.r = "OK";
            res.i = "Unsubscribed from model";
            res.n = req.requestName;
            send(JSON.stringify(res));
            ss.log("<-".green,res.r.green,msgLogName,res.i);
          }
          else {
            handleError("Invalid method");
          }
        }
      };
    }
  };
};

var loadFile = function(name) {
  var fileName = path.join(__dirname, '../client', name);
  return fs.readFileSync(fileName, 'utf8');
};

var stopPolling = function(clientId,modelId) {
  if(!clients) {
    throw new Error("No clients");
  }
  var client = clients[clientId];
  if(!client) {
    throw new Error("No such client");
  }
  var model = client[modelId];
  if(!model) {
    throw new Error("No such model subscription");
  }
  var timeoutId = model.timeoutId;
  if(timeoutId) {
    clearTimeout(timeoutId);
  }
  delete clients[clientId][modelId]
};
