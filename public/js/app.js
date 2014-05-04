var app = angular.module('myApp', ['ngRoute','ui.bootstrap','firebase'])

.config(['$routeProvider', '$locationProvider', 
    function ($routeProvider, $locationProvider) {
        $routeProvider.
		when('/', {
			templateUrl: '/public/partials/home.temp',
			controller: 'MainCtrl'
		}).
		when('/create-group', {
			templateUrl: '/public/partials/create-group.temp',
			controller: 'CreateGroupCtrl'
		}).
		when('/join-group', {
			templateUrl: '/public/partials/join-group.temp',
			controller: 'JoinGroupCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
		$locationProvider.html5Mode(true);
}])

.controller('HeaderController', function ($scope, $window, $location) {
	$scope.isActive = function (viewLocation) { 
        return viewLocation === $location.path();
    };

	$scope.isCollapsed = true;
})

.controller('MainCtrl', function ($scope, $window, $location, $q, $http) {
	$scope.test = {
		name: 'test',
		shorturl: '',
		longUrl: ''
	}

	$scope.call = function (longUrl) {
		
		$http.get('/api/bitly?name=' + longUrl).success(function(response) {
			console.log(response);
			$scope.test = {
				name: 'url',
				shorturl: response.data.url
			}	
		});
	}
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
	}	
})


.controller('JoinGroupCtrl', function ($scope, $window, $location, $q, $http) {
	$scope.joinGroup = function (group) {
		$http.get('/db/join-group?group_id=' + group.group_id + '&password=' + group.password).success(function(response) {
			if (response == '"11000"') {
				$scope.errormsg = 'Invalid username/password';
				$scope.error = {flag:true}; 
			}
		})
		.error(function(error){
			console.log('error: ' + error);
		});
	}	
})

	
/*Firebase, AngularFire */
.controller("FirebaseController", ["$scope", "$firebase",
  function($scope, $firebase) {
  	var URL = "https://testing-node.firebaseio.com/";
    $scope.items = $firebase(new Firebase(URL));

	/* write data to Firebase */	
    $scope.addMessage = function(message) {
    	$scope.items.$add({mes: message});
    	$scope.message = '';
    }

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