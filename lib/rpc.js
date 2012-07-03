angular.module('ssAngular',[])
  .factory('rpc', function($q,$rootScope) {
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
