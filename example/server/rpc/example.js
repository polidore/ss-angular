var intervalId = {};
var crypto = require('crypto');

exports.actions = function(req,res,ss) {
  req.use('session');

  return {
    on: function() {
      intervalId = setInterval(function() {
        crypto.randomBytes(16, function(ex,buf) {
          var message = 'Message from space: ' + buf;
          ss.publish.all('ss-example', message);
        });
      }, 3000);
      setTimeout(function() {
        res("Receiving SpaceMail"); 
      }, 2000);
      console.log("session data: " + JSON.stringify(req.session));
    },
    off: function(reason) {
      console.log("Received reason: %s", reason);
      clearInterval(intervalId);
      setTimeout(function() {
        res("Ignoring SpaceMail");
      }, 2000);
    },
    authenticate: function(user,pass) {
      ss.log("User", user, "Pass", pass);
      if(user === 'user' && pass === 'pass') {
        ss.log("Successful login");
        req.session.setUserId(user);
        res(true);
      }
      else {
        ss.log("Access denied! The password is user/pass");
        res(false);
      }
    },
    authenticated: function() {
      if(req.session.userId) {
        res(true);
      }
      else {
        res(false);
      }
    },
    logout: function() {
      req.session.setUserId(null);
      res(true);
    }
  };
}
