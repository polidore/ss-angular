var module = angular.module('ssAngular',[]);

module.factory('pubsub', ['$rootScope', function($rootScope) {
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
}]);

module.factory('rpc', ['$q','$rootScope', function($q,$rootScope) {
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
}]);

module.factory('model', ['$rootScope', function($rootScope) {
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
}]);

module.factory('session', ['$log', function($log) {
  $log.log('Initializing the session');
  return {
    authenticated: false,
    userName: '',
    logout: function() {
      this.session.authenticated = false;
    }
  }
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

  this.$get = ['$rootScope','$location', 'session', '$q', '$log', function($rootScope, $location, session, $q, $log) {
    $rootScope.$on('$routeChangeSuccess', function(current, previous) {
      if(!session.authenticated) { 
        var targetPath = $location.path();
        if(targetPath.indexOf(loginPath) < 0) {
          $log.log("User not logged in. Redirecting");
          $location.path(loginPath);
        } //otherwise, we're already logging in
      }
    });
    return {
      login: function(user,password) {
        var deferred = $q.defer();
        ss.rpc(authServiceModule + ".authenticate", user, password, function(response) {
          $rootScope.$apply(function() {
            if(response) {
              session.authenticated = true;
              userName = user;
              deferred.resolve("Logged in");
            }
            else {
              session.authenticated = false;
              deferred.reject("Invalid");
            }
          });
        });
        return deferred.promise;
      },
      logout: function() {
        var deferred = $q.defer();
        ss.rpc(authServiceModule + ".logout", function() {
          $rootScope.$apply(function() {
            session.authenticated = false;
            session.userName = null;
            deferred.resolve("Success");
          });
        });
        return deferred.promise;
      }
    }
  }];
});
