//des describes the model and has the middleware
//chan is a channel on which to post the updated model object

exports.make = function(des,chan,ss) {
  //des.use if middleware required
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(params) {
      var obj = {};
      chan(obj);
    }
  };
};
