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

    stack = [];

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
          fn = mw.apply(mw, args.splice(1));
          stack.push(fn);
        }
        else {
          throw new Error("Middleware function " + nameOrModule " not found.");
        }
      }
      catch(e) {
        chan(e,null); //not sure about this
      }
    }
    
    var file = getBranchFromTree(api,des.name,true);
  }
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


