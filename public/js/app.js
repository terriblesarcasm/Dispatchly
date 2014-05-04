var app = angular.module('myApp', ['ui.router','ui.bootstrap','firebase', 'ui.utils'])

.factory('User', function ($http) {
    var user = {};

    return { 
        setuser: function() {
            return $http.get('/get/user').then(function(response) {
                user = response.data;
                return user;
            });
        },
        getuser: function() {
            return user;
        },
        getgroups: function() {
        	return user.groups;
        }
    }
})

.factory('Phone', function ($http) {
	return {
		setPhone: function(phone) {
			return $http.get('/db/add-phone-number?phonenumber=' + phone)
		}
	}
})

.factory('Group', function () {
	var group = {};
	return {
		setGroup: function(sentGroup) {
			group.name = sentGroup;
		},
		getGroup: function() {
			console.log('getGroup: ' + group.name)
			return group.name;
		}
	}
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
	})
	.state('group', {
		url: "/group/{group}",
		templateUrl: "public/partials/group.temp",
		controller: "GroupCtrl"
	});
})

.controller('HeaderController', function ($scope, $window, $location, User, Group) {
	User.setuser().then(function(response) {
		$scope.user = response;
	});

	$scope.group = Group.getGroup;

	$scope.isActive = function (viewLocation) { 
        return viewLocation === $location.path();
    };

	$scope.isCollapsed = true;
})

.controller('MainCtrl', function ($scope, $window, $location, $q, $http, User, Phone) {
	if (!$scope.user) {
		User.setuser().then(function(response) {
			$scope.user = response;
		}).then(function() {
			User.getgroups();
		});	
	}

	$scope.setPhone = function (phone) {
		Phone.setPhone(phone).then(function(response) {
			if (response == 'invalid') {
				$scope.errormsg = 'Invalid group name/password';
				$scope.error = {flag:true}; 		
			} else {
				User.setuser().then(function(response) {
					$scope.user = response;
				});	
			}
		})
	}

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
			}
			else {
				// redirect back to homepage 
				$location.path("/");
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
			else {
				// redirect back to homepage 
				$location.path("/");
			}
		})
		.error(function(error){
			console.log('error: ' + error);
		});
	};	
})


.controller('GroupCtrl', function ($scope, $window, $location, $q, $http, $stateParams, Group) {
	console.log('logging the state param: ' + $stateParams.group);
	$scope.group = {name: $stateParams.group};
	Group.setGroup($stateParams.group);

})

	
/*Firebase, AngularFire */
.controller("FirebaseController", ["$scope", "$firebase", "User",
  function($scope, $firebase, User) {
	// Get username from factory
	$scope.user = User.getuser();	
	console.log($scope.user);
  	
  	var URL = "https://dispatchninja.firebaseIO.com/";
    $scope.items = $firebase(new Firebase(URL));

	/* write data to Firebase */	
    $scope.addMessage = function(message) {
    	$scope.items.$add({username: $scope.user.name, mes: message});
    	$scope.message = '';
    };

  }
]);