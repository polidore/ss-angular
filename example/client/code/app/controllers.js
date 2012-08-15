angular.module('exampleApp', ['ssAngular'])
  .config(function(authProvider,$routeProvider,$locationProvider) {
    authProvider.authServiceModule('example');
    authProvider.loginPath('/login');
    $routeProvider.
      when('/login', {controller:'AuthCtrl', templateUrl:'login.html'}).
      when('/app', {controller:'SSCtrl', templateUrl:'app.html'}).
      otherwise({redirectTo:'/app'});
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

    $scope.$on('$destroy', function() {
      if($scope.streaming) {
        rpc('example.off', 'Navigated away');
      }
    });

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
        var newPath = '/app';
        if($scope.redirectPath) {
          newPath = $scope.redirectPath;
        }

        $location.path(newPath);
      }, function(reason) {
        $log.log(reason);
        $scope.showError = true;
        $scope.errorMsg = "Invalid login. The username and pass for the example app is user/pass";
      });
    };
  });
