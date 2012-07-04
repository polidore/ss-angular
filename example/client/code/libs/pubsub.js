angular.module('ssAngular',['ng'])
  .factory('pubsub', function($rootScope) {
    //override the $on function
    var old$on = $rootScope.prototype.$on;
    $rootScope.protoype.$on = function(name, listener) {
      if(name.length > 3 && name.substr(0,3) === 'ss-') {
        ss.event.on(name, function(message) {
          scope.$apply(function() {
            scope.$broadcast(name, message);
          });
        });
      }
      //make sure to call angular's version
      old$on.apply(this, arguments);
    };
  });
