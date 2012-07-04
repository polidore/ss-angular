angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub) {
    $scope.messages = []
    $scope.$on('ss-example', function(event,msg) {
      $scope.messages.push(msg);
    });
  });
