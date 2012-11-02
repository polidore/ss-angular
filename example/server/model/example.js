//des describes the model and has the middleware
//chan is a channel on which to post the updated model object

var names = ['Tom','Dick','Harry'];

exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      var d = new Date();
      var obj = {
        hash: Math.floor(d.getSeconds() / 5.0), //only update every 5 seconds even though polled every second
        hasBall: names[Math.floor(Math.random()*3-0.001)],
        leadingBy: Math.floor(Math.random()*100),
        serverTime: d.toString(),
        preferredName: p.name
      };
      chan(obj);
    }
  };
};
