angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub,rpc) {
    $scope.messages = []
    $scope.streaming = false;
    $scope.intervalId = 0;

    $scope.$on('ss-example', function(event,msg) {
      $scope.messages.push(msg);
    });

    $scope.toggleData = function() {
      if(!$scope.streaming) {
        $scope.streaming = true;
        $scope.intervalId = rpc('example.on');
      }
      else {
        $scope.streaming = false;
        rpc('example.off', $scope.intervalId);
      }
    };
  });
