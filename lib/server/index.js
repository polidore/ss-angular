var fs = require('fs'),
    path = require('path');

var clients = {};
//replace this with apitree 
var models = {
  testModel: {
    a: 7,
    b: 5000,
    pollingFreq: 2000
  }
};

module.exports = function(responderId, config, ss) {
  var name = config && config.name || 'model';

  ss.client.send('mod','ssAngular', loadFile('ssAngular.js')); //angular integrations
  ss.client.send('mod', 'synced-model', loadFile('client.js'));
  ss.client.send('code', 'init', "require('synced-model')("+responderId+", {}, require('socketstream').send("+responderId+"));");

  return {
    name: name,
    interfaces: function(middleware) {
      return {
        websocket: function(msg, meta, send) {
          var req = JSON.parse(msg);

          if(req.method === 'LINK') {
            if(models[req.model]) { //model exists
              var modelName = req.model;
              var model = models[modelName];

              if(clients[req.id]) { //client already exists
                ss.log("Existing client");
                if(clients[req.id][req.model]) { //already syncing model
                  req.response = 'ERROR';
                  req.info = "Already syncing model";
                  send(JSON.stringify(req));

                  ss.log(req.response.red,req.info,req.model,req.id);
                }
              }
              else {
                clients[req.id] = {};
              }

              var client = clients[req.id];

              client[req.model] = setInterval(function() {
                ss.log("->".green, "Updating model");
                model = models[modelName];
                model.a = model.a*2;
                model.timeStamp = Date.now();
                var res = {
                  response: "OK",
                  id: req.id,
                  model: model
                };
                send(JSON.stringify(res));
              }, model.pollingFreq);
              req.response = "OK";
              req.info = "Subscribed to model";
              req.model = model;
              ss.log(req.response.green,req.info);

              send(JSON.stringify(req));
            }
            else {
              req.response = 'ERROR';
              req.info = "No such model";
              send(JSON.stringify(req));

              ss.log(req.response.red, req.info, req.model);
            }
          }
          else if(method === "UNLINK") {
            var intervalId = clients[req.id][req.model];
            if(intervalId) {
              clearInterval(intervalId);

              req.response = "OK";
              req.info = "Unlinked";
              send(JSON.stringify(req));

              ss.log(req.response.green,req.info,req.id,req.model);
            }
          }
          else {
            req.response = "ERROR";
            req.info = "Unsupported API";
            send(JSON.stringify(req));
            ss.log(req.response.red,req.info,req.method);
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
