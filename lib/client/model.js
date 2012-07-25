//client script for model syncing.

var ss = require('socketstream');

module.exports = function(responderId, config, send) {
  ss.registerApi('linkModel', function() {
    var args = Array.prototype.slice.call(arguments);
    var modelName = args[0];

    if(modelName && modelName.length > 0) {
      console.log("Syncing model " + modelName + " with the server");
      //create json message and send it!

