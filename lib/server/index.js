module.exports = function(responderId, config, ss) {
  var name = config && config.name || 'model';

  //config.model:
  // name
  // query
  // pollingFreq
  var models = config.models;

  return {
    name: name,

    interfaces: function(middleware) {
      return {
        websocket: function(msg, meta, send) {

        }
      }
    }
