'use strict';
var module = angular.module('ssAngular',[]);

module.factory('pubsub', ['$rootScope', function($rootScope) {
  //override the $on function
  var old$on = $rootScope.$on;
  Object.getPrototypeOf($rootScope).$on = function(name, listener) {
    var scope = this;
    if(name.length > 3 && name.substr(0,3) === 'ss-') {
      ss.event.on(name, function(message) {
        scope.$apply(function(s) {
          scope.$broadcast(name, message);
        });
      });
    }
    //make sure to call angular's version
    old$on.apply(this, arguments);
  };
}]);

module.factory('rpc', ['$q','$rootScope', function($q,$rootScope) {
  return function(command) {
    var args = Array.prototype.slice.apply(arguments);
    var deferred = $q.defer();
    ss.rpc.apply(ss, [command].concat(args.slice(1,args.length)).concat(function(response) {
      $rootScope.$apply(function(scope) {
        deferred.resolve(response);
      });
    }));
    return deferred.promise;
  };
}]);

module.factory('model', ['$rootScope', function($rootScope) {
  Object.getPrototypeOf($rootScope).unlinkModel = function(scopeName) {
    var scope = this;

    if(!scope[scopeName] || !scope._models[scopeName]) {
      return;
    }
    ss.unlinkModel(scope._models[scopeName].name, scope._models[scopeName].params);
    delete scope[scopeName];
    delete scope._models[scopeName];
  };

  Object.getPrototypeOf($rootScope).linkModel = function(name, params, scopeName) {
    var scope = this;
    if(typeof params === "string") {
      scopeName = params;
      params = null;
    }
    if(!scopeName) {
      scopeName = name;
    }

    if(scope[scopeName]) {
      return;
    }

    if(!scope._models) {
      scope._models = {};
    }

    scope._models[scopeName] = {name:name,params:params};
    scope[scopeName] = {};

    ss.linkModel(name, params, function(modelObj) {
      scope.$apply(function(scope) {
        scope[scopeName] = modelObj;
      });
    });
    scope.$on('$destroy', function(s) {
      if(scope[scopeName]) {
        scope.unlinkModel(scopeName);
      }
    });
  };
}]);

module.provider('auth', function() {
  var loginPath = '/login';
  var authServiceModule = 'app';

  this.loginPath = function(path) {
    loginPath = path;
    return this;
  };
  this.authServiceModule = function(service) {
    authServiceModule = service;
    return this;
  };

  this.$get = ['$rootScope','$location', '$q', '$log', function($rootScope, $location, $q, $log) {
    var routeResponse = function() {
      if(!$rootScope.authenticated) { 
        var targetPath = $location.path();
        if(targetPath.indexOf(loginPath) < 0) {
          $log.log("User not logged in. Redirecting");
          $rootScope.redirectPath = targetPath;
          $location.path(loginPath);
        } //otherwise, we're already logging in
      }
    };
    $rootScope.$on('$locationChangeStart', function(current, previous) {
      routeResponse();
    });

    if(!$rootScope.authenticated) {
      ss.rpc(authServiceModule + ".authenticated", function(response) {
        $rootScope.$apply(function(scope) {
          $rootScope.authenticated = response;
          routeResponse();
        });
      });
    }

    return {
      login: function(user,password) {
        var deferred = $q.defer();
        ss.rpc(authServiceModule + ".authenticate", user, password, function(response) {
          $rootScope.$apply(function(scope) {
            if(response) {
              scope.authenticated = response;
              deferred.resolve("Logged in");
            }
            else {
              scope.authenticated = null;
              deferred.reject("Invalid");
            }
          });
        });
        return deferred.promise;
      },
      logout: function() {
        var deferred = $q.defer();
        ss.rpc(authServiceModule + ".logout", function() {
          $rootScope.$apply(function(scope) {
            scope.authenticated = null;
            deferred.resolve("Success");
          });
        });
        return deferred.promise;
      }
    };
  }];
});
