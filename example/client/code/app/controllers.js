angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub) {
    pubsub($scope);

    $scope.messages = []
    $scope.$on('ss-example', function(event,msg) {
      $scope.messages.push(msg);
    });
  });
