exports.actions = function(req,res,ss) {
  var crypto = require('crypto');
  var streaming = false;
  var intervalId;

  return {
    toggle: function() {
      streaming = !streaming;
      if(streaming) {
        intervalId = setInterval(function() {
          crypto.randomBytes(16, function(ex,buf) {
            var message = 'Message from space: ' + buf;
            ss.publish.all('ss-example', message);
          });
        }, 3000);
      }
      else {
        clearInterval(intervalId);
      }
      return streaming;
    }
  };
}
