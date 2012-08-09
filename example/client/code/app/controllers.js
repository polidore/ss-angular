angular.module('exampleApp', ['ssAngular'])
  .config(function(authProvider,$routeProvider,$locationProvider) {
    authProvider.authServiceModule('example');
    $routeProvider.
      when('/', {controller:'AuthCtrl', templateUrl:'login.html'}).
      when('/app', {controller:'SSCtrl', templateUrl:'app.html'}).
      otherwise({redirectTo:'/'});
    $locationProvider.html5Mode(true);
  })
  .controller('SSCtrl',function($scope,$location,pubsub,rpc,model,auth) {
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
        $scope.linkModel('example', {name: 'Tom'});
      }
      else {
        $scope.streaming = false;
        $scope.messages = [];
        $scope.status = rpc('example.off', 'Too random');
        $scope.unlinkModel('example', {name: 'Tom'});
      }
    };

    $scope.logout = function() {
      var promise = auth.logout();
      promise.then(function() { 
        $location.path("/"); 
      });
    }
  })
  .controller('AuthCtrl',function($scope, $location, $log, auth) {
    $scope.processAuth = function() {
      $scope.showError = false;
      var promise = auth.login($scope.user, $scope.password);
      promise.then(function(reason) {
        $log.log(reason);
        $location.path('/app');
      }, function(reason) {
        $log.log(reason);
        $scope.showError = true;
        $scope.errorMsg = "Invalid login";
      });
    };
  });
