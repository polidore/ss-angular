exports.actions = function(req,res,ss) {
  var crypto = require('crypto');
  var intervalId = {};

  return {
    on: function() {
      intervalId = setInterval(function() {
        crypto.randomBytes(16, function(ex,buf) {
          var message = 'Message from space: ' + buf;
          ss.publish.all('ss-example', message);
        });
      }, 3000);
      console.log("Interval Id: %s", intervalId);
      res("Receiving SpaceMail"); 
    },
    off: function(reason) {
      console.log("Received reason: %s", reason);
      console.log("Interval Id: %s", intervalId);
      clearInterval(intervalId);
      res("Ignoring SpaceMail");
    }
  };
}
