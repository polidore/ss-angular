angular.module('ssAngular',[])
  .factory('rpc', function($q) {
    return function(scope) {
      scope.rpc = function(command) {
        ss.rpc.apply(ss, [command].concat(arguments.slice(1,arguments.length-1)), function(response) {
          scope.$apply(function() {
            arguments[arguments.length-1](response);
          });
        });
      };
    };
  });
