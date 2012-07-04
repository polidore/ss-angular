angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub,rpc) {
    $scope.messages = []
    $scope.$on('ss-example', function(event,msg) {
      $scope.messages.push(msg);
    });
    $scope.toggleData = function() {
      $scope.streamiing = rpc('example.toggle');
    };
  });
