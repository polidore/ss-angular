var fs = require('fs'),
    path = require('path');

var clients = {};

module.exports = function(responderId, config, ss) {
  var name = config && config.name || 'model';
  var pollFreq = config && config.pollFreq || 1000;

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

          var msgLogName = ("model:" + req.modelName).grey;

          var handleError = function(e) {
            var message;
            if(meta.clientIp === '127.0.0.1') {
              message = e.stack;
            }
            else {
              message = 'See server-side logs';
            }

            var obj = {e: {message: message}};
            ss.log("<-".red, msgLogName, req.method, req.modelName, e);
            if(e.stack) {
              ss.log(e.stack.split("\n").splice(1).join("\n"));
            }
            send(JSON.stringify(obj));
          };

          if(req.method === 'LINK') {
            try {
              if(clients[req.socketId]) { //client already exists
                ss.log(msgLogName, "Existing client");
                if(clients[req.socketId][req.modelName]) { //already syncing model
                  throw new Error("Duplicate request" + JSON.stringify(req));
                }
              }
              else {
                clients[req.socketId] = {};
              }

              var client = clients[req.socketId];
              client[req.modelName] = setInterval(function() {
                ss.log("->".green, msgLogName, "Updating model");
                model(req, function(err, modelObj) {
                  if(err) {
                    stopPolling(req.socketId,req.modelName);
                    handleError(err);
                  }
                  else {
                    var responseObj = {
                      r: "OK",
                      m: modelObj,
                      n: req.modelName
                    };
                    send(JSON.stringify(responseObj));
                  }
                });
              }, pollFreq);
              req.r = "OK";
              req.i = "Subscribed to model";
              ss.log("<-".green,req.r.green,msgLogName,req.i);
              send(JSON.stringify(req));
            }
            catch(e) {
              try {
                stopPolling(req.socketId,req.modelName);
              }
              catch(e) {
                ss.log(msgLogName, "Could not stop polling in an error case. Not always a problem: ", e);
              }
              handleError(e);
            }
          }
          else if(method === "UNLINK") {
            try {
              stopPolling(req.socketId,req.modelName);
            } 
            catch(e) {
              handlError(e);
              return;
            }
            req.r = "OK";
            req.i = "Unsubscribed from model";
            send(JSON.stringify(req));
            ss.log("<-".green,req.r.green,msgLogName,req.i);
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

var stopPolling = function(clientId,model) {
  if(!clients) {
    throw new Error("No clients");
  }
  var client = clients[clientId];
  if(!client) {
    throw new Error("No such client");
  }
  var intervalId = client[model];
  if(!intervalId) {
    throw new Error("No interval id for client/model");
  }
  clearInterval(intervalId);
};
