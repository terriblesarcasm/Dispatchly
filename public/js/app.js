var app = angular.module('myApp', ['ui.router','ui.bootstrap','firebase', 'ui.utils'])

.factory('User', function ($http){
	var user = {};

	var getUserPrivate = function() {
		console.log('in function');
			$http.get('/get/user').success(function(response) {
				console.log(" response: "+response);
				user = response;
				return user;
			});
		}

	return {
		getUser: getUserPrivate
	};
})

.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/");

	$stateProvider
	.state('home', {
		url: "/",
		templateUrl: "public/partials/home.temp",
		controller: "MainCtrl"
	})
	.state('createGroup', {
		url: "/createGroup",
		templateUrl: "public/partials/create-group.temp",
		controller: "CreateGroupCtrl"
	})
	.state('joinGroup', {
		url: "/joinGroup",
		templateUrl: "public/partials/join-group.temp",
		controller: "JoinGroupCtrl"
	})
	.state('groupChat', {
		url: "/groupChat",
		templateUrl: "public/partials/group-chat.temp",
		controller: "FirebaseController"
	});
})

.controller('HeaderController', function ($scope, $window, $location) {
	$scope.isActive = function (viewLocation) { 
        return viewLocation === $location.path();
    };

	$scope.isCollapsed = true;
})

.controller('MainCtrl', function ($scope, $window, $location, $q, $http, User) {
	$scope.user = User.getUser;	

	$scope.call = function (longUrl) {
		
		$http.get('/api/bitly?name=' + longUrl).success(function(response) {
			console.log(response);
			$scope.test = {
				name: 'url',
				shorturl: response.data.url
			};	
		});
	};
})


.controller('CreateGroupCtrl', function ($scope, $window, $location, $q, $http) {
	$scope.createGroup = function (group) {
		$http.get('/db/create-group?name=' + group.name + '&password=' + group.password + '&address=' + group.address + '&zipcode=' + group.zipcode).success(function(response) {
			if (response == '"11000"') {
				$scope.errormsg = 'Group name already exists';
				$scope.error = {flag:true};
				// TODO: redirect back to homepage 
			}
		})
		.error(function(error){
			console.log('error: ' + error);
		});
	};	
})


.controller('JoinGroupCtrl', function ($scope, $window, $location, $q, $http) {
	$scope.joinGroup = function (group) {
		$http.get('/db/join-group?group_id=' + group.group_id + '&password=' + group.password).success(function(response) {
			if (response == 'invalid') {
				$scope.errormsg = 'Invalid group name/password';
				$scope.error = {flag:true}; 
			}
		})
		.error(function(error){
			console.log('error: ' + error);
		});
	};	
})


.controller('PhoneCtrl', function ($scope, $window, $location, $q, $http) {
	$scope.addPhoneNumber = function (input) {
		$http.get('/db/add-phone-number?phonenumber=' + input.phonenumber).success(function(response) {
			if (response == 'invalid') {
				$scope.errormsg = 'Invalid group name/password';
				$scope.error = {flag:true}; 
			}
		})
		.error(function(error){
			console.log('error: ' + error);
		});
	};	
})

	
/*Firebase, AngularFire */
.controller("FirebaseController", ["$scope", "$firebase",
  function($scope, $firebase) {
  	var URL = "https://dispatchninja.firebaseIO.com/";
    $scope.items = $firebase(new Firebase(URL));

	/* write data to Firebase */	
    $scope.addMessage = function(message) {
    	$scope.items.$add({username: 'hardcoded', mes: message});
    	$scope.message = '';
    };

    /* do stuff when after the initial data is loaded */
	$scope.items.$on("loaded", function() {
	  console.log("Initial data received!");
	    /* check to see if remote data has changed */
	    $scope.items.$on("change", function() {
			console.log("A remote change was applied locally!");
		});
	});    


  }
]);