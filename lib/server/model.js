'use strict';
var pathlib = require('path');
var apiTree = require('apitree');

module.exports = function(ss, middleware) {
  var dir = pathlib.join(ss.root, 'server/model');
  var api = apiTree.createApiTree(dir);

  //a model description and a channel for updates
  var model = function(des, chan) {
    if(!des.modelName || typeof(des.modelName) != "string") {
      throw new Error("Model description must have a name in string form: " + JSON.stringify(des));
    }

    var stack = [];

    //allow middleware
    des.use = function(nameOrModule) {
      try {
        var args = Array.prototype.slice.call(arguments);

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
    
    var file = getBranchFromTree(api,des.modelName);
    if(!file) {
      throw new Error("Unable to find model " + des.modelName);
    }
    if(!file.make) {
      throw new Error("Model must have a make function");
    }

    //cb adds some error checking before returning control to interface
    var cb = function(obj) {
      var args = Array.prototype.slice.call(arguments);
      if(args.length != 1) {
        throw new Error("Invalid arguments to channel. Must send a single object");
      }
      chan(null, obj);
    };

    //populate middleware
    var readyModel = file.make(des,cb,ss);

    var main = function() {
      var method = readyModel.poll;

      if(!method) {
        chan(new Error("Model must have a make.poll function"));
      }
      else if(typeof(method) != "function") {
        chan(new Error("Poll must be a function"));
      }
      else {
        method.call(method,des.params);
      }
    };

    stack.push(main);

    var exec = function(req, res, i) {
      if(i == undefined) {
        i = 0;
      }
      stack[i].call(stack, req, res, function() {
        try {
          exec(req,res,i+1);
        }
        catch(e) {
          chan(e);
        }
      });
    };
    try {
      exec(des,cb);
    }
    catch(e) {
      chan(e);
    }
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
