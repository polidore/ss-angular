angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub,rpc) {
    $scope.messages = []
    $scope.streaming = false;
    $scope.status = "";

    $scope.$on('ss-example', function(event,msg) {
      $scope.messages.push(msg);
    });

    $scope.toggleData = function() {
      if(!$scope.streaming) {
        $scope.streaming = true;
        $scope.status = rpc('example.on');
      }
      else {
        $scope.streaming = false;
        $scope.status = rpc('example.off', 'Too random');
      }
    };
  });
