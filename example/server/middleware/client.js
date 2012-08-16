exports.auth = function() {
  return function(req, res, next) {
    if(req.session && req.session.userId) {
      return next();
    }
    res(false);
  }
}
