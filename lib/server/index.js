var clients = {};
var fs = require('fs'),
    path = require('path');

module.exports = function(responderId, config, ss) {
  var name = config && config.name || 'model';

  //config.model:
  // name
  // query
  // pollingFreq
  var models = config.models;

  ss.client.send('lib','ss-angular', loadFile('ssAngular.js')); //angular integrations
  ss.client.send('mod', 'model', loadFile('model.js'));
  ss.client.send('code', 'init', "require('model')("+responderId+", {}, require('socketstream').send("+responderId+"));");

  return {
    name: name,

    interfaces: function(middleware) {
      return {
        websocket: function(msg, meta, send) {
          req = JSON.parse(msg);

          ss.log('->'.cyan, req.method, req.id);

          if(method === 'LINK') {
            if(models[req.model]) { //model exists
              if(clients[req.id]) { //client already exists
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

              clients[req.id][req.model] = setInterval(function() {
                var model = models[req.model];
                model.a = 123;
                model.timeStamp = Date.now();
                var res = {
                  id: req.id,
                  model: model
                };
                send(JSON.stringify(res));
              },model.pollingFreq);
              req.response = "OK";
              req.info = "Subscribed to model";
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
      }
    }
  }
}

var loadFile = function(name) {
  var fileName = path.join(__dirname, '../client', name);
  return fs.readFileSync(fileName, 'utf8');
}
