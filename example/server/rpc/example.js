exports.actions = function(req,res,ss) {
  var crypto = require('crypto');

  return {
    on: function() {
      var intervalId = setInterval(function() {
        crypto.randomBytes(16, function(ex,buf) {
          var message = 'Message from space: ' + buf;
          ss.publish.all('ss-example', message);
        });
      }, 3000);
      res(42); //intervalId is a complex object. great.
    },
    off: function(intervalId) {
      console.log("Received intervalId: %s", intervalId);
      clearInterval(intervalId);
    }
  };
}
