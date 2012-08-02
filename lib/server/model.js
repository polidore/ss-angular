pathlib = require('path');
apiTree = require('apitree');

module.exports = function(ss, middleware) {
  var dir = pathlib.join(ss.root, 'server/model');
  var api = apiTree.createApiTree(dir);

  //a model description and a channel for updates
  var model = function(des, chan) {
    if(!des.name || typeof(des.name) != "string") {
      throw new Error("Model description must have a name in string form");
    }
    if(des.params && !(des.params instanceof Array)) {
      throw new Error("Params must be supplied as an array");
    }

    var stack = [];

    //allow middleware
    des.use = function(nameOrModule) {
      try {
        args = Array.prototype.slice.call(arguments);

        var mw;
        if(typeof(nameOrModule) == 'function') {
          mw = nameOrModule;
        }
        else {
          mw = getBranchFromTree(middleware, nameOrModule);
        }
        
        if(mw) {
          var fn = mw.apply(mw, args.splice(1));
          stack.push(fn);
        }
        else {
          throw new Error("Middleware function " + nameOrModule + " not found.");
        }
      }
      catch(e) {
        chan(e,null); //not sure about this
      }
    };
    
    var file = getBranchFromTree(api,des.name);
    if(!file) {
      throw new Error("Unable to find model " + des.name);
    }
    if(!file.make) {
      throw new Error("Model must have a make function");
    }

    //cb adds some error checking before returning control to interface
    var cb = function(obj) {
      if(args.length != 1) {
        throw new Error("Invalid arguments to channel. Must send a single object");
      }
      chan(obj);
    };

    //populate middleware
    var readyModel = file.make(des,chan,ss);

    var main = function() {
      var method = readyModel.poll;

      if(!method) {
        throw new Error("Model must have a make.poll function");
      }
      if(typeof(method) != "function") {
        throw new Error("Poll must be a function");
      }

      method.apply(method,des.params);
    };

    stack.push(main);

    var exec = function(req, res, i) {
      if(i === null) {
        i = 0;
      }
      stack[i].call(stack, req, res, function() {
        exec(req,res,i+1);
      });
    };
    exec(des,cb);
  };

  return model;
};

var getBranchFromTree = function(tree,stringMethod,module) {
  if(module) {
    if(stringMethod.indexOf(".") < 0) {
      throw new Error("Cannot find module of " + stringMethod);
    }
    stringMethod = stringMethod.substr(0,stringMethod.lastIndexOf("."));
  }
  return eval("tree." + stringMethod);
};
