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
  return function() {};
});

module.factory('rpc', function($q,$rootScope) {
  return function(command) {
    var deferred = $q.defer();
    ss.rpc.apply(ss, [command].concat(arguments.slice(1,arguments.length-1)), function(response) {
      $rootScope.$apply(function() {
        deferred.resolve(response);
      });
    });
    return deferred.promise;
  };
});
