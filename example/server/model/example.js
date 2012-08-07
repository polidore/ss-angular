//des describes the model and has the middleware
//chan is a channel on which to post the updated model object

var names = ['Tom','Dick','Harry'];

exports.make = function(des,chan,ss) {
  //des.use if middleware required
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      var obj = {
        hasBall: names[Math.floor(Math.random()*3-0.001)],
        leadingBy: Math.floor(Math.random()*100),
        serverTime: Date.now(),
        preferredName: p.name
      };
      chan(obj);
    }
  };
};
