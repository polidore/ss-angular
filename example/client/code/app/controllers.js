angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',function($scope,pubsub,rpc,linkModel, unlinkModel) {
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
        linkModel('example', {name: 'Tom'});
      }
      else {
        $scope.streaming = false;
        $scope.messages = [];
        $scope.status = rpc('example.off', 'Too random');
        unlinkModel('example', {name: 'Tom'});
      }
    };
  });
