# Approach

Create an angular service that can be injected into controllers similar to the angular REST resource library.

# Installing

* Create a new socketstream app
* Edit its package.json to add `ss-angular` as a dependency:

```javascript
"dependencies": {
  "socketstream": "0.3.3",
  "ss-angular": "0.x.x"
}
```

* run `npm install`
* Reference the ss-angular request responder in your app.js:

```javascript
ss.responders.add(require('ss-angular'));
```

This will install the backend request responder, and inject the client library for models specifically and some other wrappers around existing SocketStream features for use in AngularJS.

Add the following to your `client/code/app/entry.js` above the `ss.server.on` line

```javascript
require('ssAngular');
require('/controllers');
```

Then define your angular controllres in `client/code/app/controllers.js`

You also have to make sure that you have angular.js in your `client/code/lib`

# Running Example

If you clone this repo, there is an example.  To run it, just cd to the example dir and run `npm install`

# Model

This is the real value of this library.  If you declare a model in `server/model`, ss-angular will poll it every `pollFreq` seconds and push deltas to the client.  This is a read-only mechanism.  In the near future, updates will be incremental, but as of version 0.4, it just pushes the entire object on each update whether it has changed or not.  

It's implemented as a request responder, and it is similar to SocketStream's rpc library.  It supports middleware in the same manner as rpc as well.

## Server

Define a model in the `server/model` directory. I called this one example.js:

```javascript
//des describes the model and has the middleware
//chan is a channel on which to post the updated model object

var names = ['Tom','Dick','Harry'];

exports.make = function(des,chan,ss) {
  //des.use if middleware required
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(where) { //where is a JSON where clause
      var obj = {
        hash: Math.floor(d.getSeconds() / 5.0), //only update every 5 seconds even though polled every second
        hasBall: names[Math.floor(Math.random()*3-0.001)],
        leadingBy: Math.floor(Math.random()*100),
        serverTime: Date.now(),
        filter: where //silly
      };
      chan(obj);
    }
  };
};
```

## Client

This library does expose a raw ss API called `linkModel` and `unlinkModel`.  You just pass it the model name and parameters and it passes you back an object every N seconds.  From the ss-angular client library:

```javascript
ss.linkModel(name, params, function(modelObj) {
    scope[name] = modelObj;
});
```

But it's much more fun if you use it via angular! I've exposed a new API in the ssAngular module, and you can use it in angular controllers like this: 

```javascript
angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',['$scope','model',function($scope,model) {
    $scope.linkModel('example',{id: 1234}, 'modelData'); 
      //this creates $scope.modelData and updates it with data in the example model filtered by id 1234
      //the modelData param is optional. If omitted, the model will exists as 'example' on the scope.
  }]);
```

It's that simple.  You define your app's module, the ssAngular dependency and then inject model into your controller's dependencies.  In this case, example is the name of the file I created in `server/model` and it will be the name of the model on angular's $scope. Here's the html that uses this controller:


```html
<table>
  <thead>
    <tr>
      <th>Has Ball</th>
      <th>Leading By</th>
      <th>Server Time</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{modelData.hasBall}}</td>
      <td>{{modelData.leadingBy}}</td>
      <td>{{modelData.serverTime}}</td>
    </tr>
  </tbody>
</table>
```

The data in curly brackets will be automatically updated.  The link is created by simply mentioning example in the `linkModel` command.

Important note: you can only subscribe to a named model once in a given scope, even if you use a different where clause.  The idea here is that scopes are fairly narrow, and I'd prefer to refer to the model data without the where clause for simplicity.  If I allow multiple subscriptions to the same model with different where clauses in the same scope, then I have to make you refer to the model by `name/where` and that's ugly in the HTML.  Just create a lot of scopes and keep your model context broad enough that it "fills" a scope.

The library will automatically unsubscribe from your model when the scope that created it is destroyed.

# Authentication

Angular doesn't have great support for authentication.  I added a few nice things that you can use to integrate with the sessions functionality in socket stream.  This logic works nicely with the angular `$routeProvider`. 

## Client

Define your routes and backend authentication service module:

```javascript
angular.module('exampleApp', ['ssAngular'])
  .config(['authProvider','$routeProvider','$locationProvider',function(authProvider,$routeProvider,$locationProvider) {
    authProvider.authServiceModule('example');
    authProvider.loginPath('/login');
    $routeProvider.
      when('/login', {controller:'AuthCtrl', templateUrl:'login.html'}).
      when('/app', {controller:'SSCtrl', templateUrl:'app.html'}).
      otherwise({redirectTo:'/app'});
    $locationProvider.html5Mode(true);
  }])
```

The login path is the path that users should be redirected to if they are not logged in.

Use the auth.authenticate and auth.logout functions:

```javascript
  .controller('AuthCtrl',['$scope', '$location', '$log', 'auth', function($scope, $location, $log, auth) {
    $scope.processAuth = function() {
      $scope.showError = false;
      var promise = auth.login($scope.user, $scope.password);
      promise.then(function(reason) {
        var newPath = '/app';
        if($scope.redirectPath) {
          newPath = $scope.redirectPath; //this is saved if ssAngular redirects to login due to lack of authentication
        }
        $location.path(newPath);
      }, function(reason) {
        $scope.showError = true;
        $scope.errorMsg = "Invalid login";
      });
    };
  });
```

This is a controller for a form that asks the user for a username and password. It passes it to the server using the auth service and it awaits the response as a `$q` promise.

Find out if the user is logged in using `$scope.authenticated`:

```html
<div ng-show="authenticated">
//...
</div>
```

I put this around the template used for one of my routes.

## Server

In the rpc file referenced in the configuration of the auth provider, you must have this interface: 

```javascript
    authenticate: function(user,pass) {
      ss.log("User", user, "Pass", pass);
      if(user === 'user' && pass === 'pass') {
        ss.log("Successful login");
        req.session.setUserId(user);
        res(true);
      }
      else {
        ss.log("Access denied! The password is user/pass");
        res(false);
      }
    },
    authenticated: function() { //this just returns whether the session is valid. allows the user to remain logged in after browser is closed
      if(req.session.userId) {
        res(true);
      }
      else {
        res(false);
      }
    },
    logout: function() {
      req.session.setUserId(null);
      res(true);
    }
```

# Pub Sub

Once you have injected this module into your app and the pubsub service into your scope, you can simply create subscriptions to scope events using angular's API, and if they are prefixed with ss-, this library will subscribe for events from scoket stream with the same name.  When socketstream pushes events, they will be wrapped into Angular scope events on the appropriate scope. 

This method allows you to target the events to the right part of your app and to keep in an "angular" mindset while gaining from socketstream. 

See the example app.  The controller looks like this: 

```javascript
angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',['$scrope','pubsub',function($scope,pubsub) {
    $scope.messages = []
      $scope.$on('ss-example', function(event,msg) {
        $scope.messages.push(msg);
      });
    }]);
```

# RPC

This is handled with the promise API in angular ($q).  You just assign a rpc call to a $scope object, and the value will be assigned when the rpc returns and the GUI updated.  You don't use a callback.  For example:

```javascript
angular.module('exampleApp', ['ssAngular'])
  .controller('SSCtrl',['$scope','pubsub','rpc',function($scope,pubsub,rpc) {
    $scope.streaming = false;
    $scope.status = "";

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
  }]);
```

Here we're assigning the return value of the socketstream services we've defined to $scope.status directly. As you can see, you can pass params or not, but you can't define a callback.  If you really need a callback, just call socketstream directly!


# License

ss-angular is released under the MIT license.
