angular.module('ssAngular',[])
  .factory('pubsub', function($rootScope) {
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
