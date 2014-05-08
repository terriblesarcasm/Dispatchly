var app = angular.module('myApp', ['ui.router','ui.bootstrap','firebase', 'ui.utils'])

.factory('Groupies', function ($http) {
    var groupies = {};

    return { 
        getgroupies: function(group_id) {
            return $http.get('/db/loadgroup/?group_id=' + group_id).then(function(response) {
                groupies = response.data;
                return groupies;
            });
        }
    }
})

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

.factory('Twilio', function($http) {
	return {
		sendTwilioAlert: function(alert) {
			return $http.get('/api/twilio?group=' + alert.group + '&code=' + alert.code)
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
		url: "/groupChat/{group}",
		templateUrl: "public/partials/group-chat.temp",
		controller: "FirebaseController"
	})
	.state('group', {
		url: "/group/{group}",
		templateUrl: "public/partials/group.temp",
		controller: "GroupCtrl"
	})
	.state('sendAlert', {
		url: "/sendAlert/{group}",
		templateUrl: "public/partials/send-alert.temp",
		controller: "SendAlertCtrl"
	})
	.state('confirmAlert', {
		url: "/confirmAlert/{group}/{code}",

		templateUrl: "public/partials/confirm-alert.temp",
		controller: "ConfirmAlertCtrl"
	});
})

.controller('HeaderController', function ($scope, $window, $location, User, Group) {
	User.setuser().then(function(response) {
		$scope.user = response;
	});

	$scope.group = Group.getGroup();

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


.controller('CreateGroupCtrl', function ($scope, $window, $location, $http, $firebase) {

	$scope.createGroup = function (group) {
		// using Firebase
	  	var URL = "https://dispatchninja.firebaseIO.com/groups/" + group.name;
	    $scope.groups = $firebase(new Firebase(URL));
	    console.log($scope.groups.$getIndex());
		// check if group name already exists

		if($scope.groups.$getIndex() == "[]"){
			// create group
			console.log('no group currently exists');
		    $scope.groups.$set({group_id: group.name, password: group.password, address: group.address, zipcode: group.zipcode});
		    // insert redirect here
		}
		else{
			console.log('this group name already exists');
		}

	}


/* Using MongoDB

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
*/
})


.controller('SendAlertCtrl', function ($scope, $window, $location, $stateParams) {
	$scope.group = {name: $stateParams.group};
})

.controller('ConfirmAlertCtrl', function ($scope, $window, $location, $stateParams, Twilio) {
	$scope.alert = { group: $stateParams.group, code: $stateParams.code };
	
	$scope.twilioAlert = function() {
		Twilio.sendTwilioAlert($scope.alert).then(function() {
			console.log('inside of alert');
		});
	}
})


.controller('JoinGroupCtrl', function ($scope, $window, $location, $http) {
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


.controller('GroupCtrl', function ($scope, $window, $location, $stateParams, Group, Groupies) {
	console.log('logging the state param: ' + $stateParams.group);
	$scope.group = {name: $stateParams.group};
	Group.setGroup($stateParams.group);

	Groupies.getgroupies($stateParams.group).then(function(response) {
		$scope.groupies = response.users;
		console.log('logging $stateParams.group ' + $scope.groupies);
	});


})

	
/*Firebase, AngularFire */
.controller("FirebaseController", function($scope, $firebase, User, $stateParams) {
	// Get username from factory
	$scope.user = User.getuser();	
	console.log($scope.user);
  	
  	var URL = "https://dispatchninja.firebaseIO.com/" + $stateParams.group;
    $scope.items = $firebase(new Firebase(URL));

	/* write data to Firebase */	
    $scope.addMessage = function(message) {
    	$scope.items.$add({username: $scope.user.name, mes: message});
    	$scope.message = '';
    };

  }
);