var intervalId = {};
var crypto = require('crypto');

exports.actions = function(req,res,ss) {
  return {
    on: function() {
      intervalId = setInterval(function() {
        crypto.randomBytes(16, function(ex,buf) {
          var message = 'Message from space: ' + buf;
          ss.publish.all('ss-example', message);
        });
      }, 3000);
      res("Receiving SpaceMail"); 
    },
    off: function(reason) {
      console.log("Received reason: %s", reason);
      clearInterval(intervalId);
      res("Ignoring SpaceMail");
    }
  };
}
