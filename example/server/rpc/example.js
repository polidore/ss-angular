exports.actions = function(req,res,ss) {
  return {
    start: function() {
      var crypto = require('crypto');
      setInterval(function() {
        crypto.randomBytes(16, function(ex,buf) {
          var message = 'Message from space: ' + buf;
          ss.publish.all('ss-example', message);
        });
      }, 1000);
    }
  };
}
