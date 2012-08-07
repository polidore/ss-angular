var module = angular.module('ssAngular',[]);

module.factory('pubsub', function($rootScope) {
  //override the $on function
  var old$on = $rootScope.$on;
  Object.getPrototypeOf($rootScope).$on = function(name, listener) {
    if(name.length > 3 && name.substr(0,3) === 'ss-') {
      ss.event.on(name, function(message) {
        $rootScope.$apply(function() {
          $rootScope.$broadcast(name, message);
        });
      });
    }
    //make sure to call angular's version
    old$on.apply(this, arguments);
  };
});

module.factory('rpc', function($q,$rootScope) {
  return function(command) {
    var args = Array.prototype.slice.apply(arguments);
    var deferred = $q.defer();
    ss.rpc.apply(ss, [command].concat(args.slice(1,args.length)).concat(function(response) {
      $rootScope.$apply(function() {
        deferred.resolve(response);
      });
    }));
    return deferred.promise;
  };
});

module.factory('model', function($rootScope) {
  Object.getPrototypeOf($rootScope).linkModel = function(name, params) {
    var scope = this;
    if(scope[name]) {
      throw new Error("Cannot subscribe to the same model twice in the same scope, even with different parameters");
    }
    ss.linkModel(name, params, function(modelObj) {
      scope.$apply(function(scope) {
        scope[name] = modelObj;
      });
    });
  };
  Object.getPrototypeOf($rootScope).unlinkModel = function(name, params) {
    var scope = this;
    if(!scope[name]) {
      throw new Error("Not subscribed to this model in this scope");
    }
    ss.unlinkModel(name, params);
    scope[name] = null;
  };
});
