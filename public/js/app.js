var app = angular.module('myApp', ['ui.router','ui.bootstrap','firebase', 'ui.utils', 'ngAnimate'])

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
	.state('respondAlert', {
		url: "/respondAlert/{group}/{user}/{code}",
		templateUrl: "public/partials/respond-alert.temp",
		controller: "RespondAlertCtrl"
	})
	.state('confirmAlert', {
		url: "/confirmAlert/{group}/{code}",
		templateUrl: "public/partials/confirm-alert.temp",
		controller: "ConfirmAlertCtrl"
	})
	.state('inviteGroup', {
		url: "/inviteGroup/{group}",
		templateUrl: "public/partials/invite-group.temp",
		controller: "InviteGroupCtrl"
	});
})


.run(function($rootScope, User, $state, $location) {
	//console.log("app run");
	
	// listen for the state start / change
	$rootScope.$on('$stateChangeStart', 
	function(event, toState, toParams, fromState, fromParams){ 
		// check if the interior homepage has been loaded

		if (toState.url == "/") {
			var user = User.getuser();

			if (user !== null && !isObjectEmpty(user)) {
				var groups = user.groups;
				if (groups.length == 1) {
					//window.location = '/#/group/' + User.getgroups();
					$state.go('group', {group: User.getgroups()});
					event.preventDefault();
				} else {
					console.log('else');
					//should just go to the state 'Default'
				}
			} else {
				User.setuser().then(function(user) {
					if (user && user.groups.length == 1) {
						//window.location = '/#/group/' + User.getgroups();
						$state.go('group', {group: User.getgroups()});
						event.preventDefault();
					} else {
						console.log('else2');
						//should just go to the state 'Default'
					}
				});
			}
		}
	})
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
		},
		add_group_to_user: function(group_id) {
			return $http.get('/db/add-group-to-user/?group_id=' + group_id).then(function(response) {
				group_id = response.data;
				return group_id;
			});
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

.factory('Twilio', function ($http) {
	return {
		sendTwilioAlert: function(alert) {
			return $http.get('/api/twilio?group=' + alert.group + '&code=' + alert.code)
		}
	}
})

.factory('Group', function ($http) {
	var group = {};
	return {
		setGroup: function(sentGroup) {
			group.name = sentGroup;
		},
		getGroup: function() {
			return group.name;
		},
		updateAvailability: function(group, user, availability) {
			return $http.get('/db/update-status?group=' + group + '&user=' + user + '&availability=' + availability)
		}
	}
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

})

.controller('RespondAlertCtrl', function ($scope, $window, $location, Group, $stateParams) {
		$scope.alert = { group: $stateParams.group, user: $stateParams.user, code: $stateParams.code };
		$scope.updateStatus = function(group, user, availability) {
			Group.updateAvailability(group, user, availability).then(function(response) {
				$location.path('/group/' + group);
			})
		}
})


.controller('JoinGroupCtrl', function ($scope, $window, $location, $firebase, $http, User) {
	$scope.joinGroup = function (group) {
		// initialize Firebase references
		var URL = "https://dispatchninja.firebaseIO.com/groups/" + group.name;
		var groupRef = new Firebase(URL);

		//this should probably be set in the following groupRef.once
		$scope.groups = $firebase(new Firebase(URL));

		// check to make sure group exists
		groupRef.once('value', function(snapshot) {
			if(snapshot.val() === null) {
				// ^ if no group exists
				$scope.error = {flag:true, message: 'Group does not exist or password is wrong.'};
			} else {
				// group exists, check the passwords
				if (group.password == $scope.groups.password) {
					console.log('passwords match');
					
					$scope.users = $firebase(new Firebase(URL + "/users"));
					$scope.users.$add({name: User.getuser().name, availability: null}).then(
						User.add_group_to_user(group.name).then(
							$location.path("/group/"+group.name)));
				}
			}
		})

	};	
})


.controller('CreateGroupCtrl', function ($scope, $window, $location, $http, $firebase, User) {

	$scope.createGroup = function (group) {
		// initialize Firebase references
		var URL = "https://dispatchninja.firebaseIO.com/groups/" + group.name;
		var groupRef = new Firebase(URL);	  	

		//this should probably be set in the following groupRef.once
		$scope.groups = $firebase(new Firebase(URL));

		// check if group name already exists
		groupRef.once('value', function(snapshot) {
		  console.log('snapshot.val() = ' + snapshot.val());

		  if(snapshot.val() === null) {
			// ^ if no group with that name exists
			// create group
			$scope.groups.$set({group_id: group.name, 
								password: group.password, 
								address: group.address, 
								zipcode: group.zipcode//,
//		    					users: [User.getuser().name] //instead of setting it, it may be best to make the array seperately using $add
							});


			// add the user to the Firebase group
			$scope.user_to_group = $firebase(new Firebase(URL + '/users'))
			$scope.user_to_group.$add({name: User.getuser().name, availability: null}).then(
							User.add_group_to_user(group.name).then(
								$location.path("/group/" + group.name)));

			// add group to the user DB (in Mongo)

		  }
		  else{
			// group already exists
			$scope.errormsg = 'Group name already exists';
			$scope.error = {flag:true};
		  }

		});

	}
})


.controller('SendAlertCtrl', function ($scope, $window, $location, $stateParams) {
	$scope.group = {name: $stateParams.group};
})


.controller('ConfirmAlertCtrl', function ($scope, $window, $location, $stateParams, Twilio) {
	$scope.alert = { group: $stateParams.group, code: $stateParams.code };
	
	$scope.twilioAlert = function() {
		Twilio.sendTwilioAlert($scope.alert).then(function() {
			$location.path("/group/" + $stateParams.group);
		});
	}
})


.controller('GroupCtrl', function ($scope, $window, $location, $stateParams, Group, $firebase) {
	// initalize variables / references
	$scope.group = {name: $stateParams.group};
	var URL = "https://dispatchninja.firebaseIO.com/groups/" + $stateParams.group;
	var firebaseusers = $firebase(new Firebase(URL + '/users'));
	$scope.users = firebaseusers;

	//console.log('scope.users = ' + $scope.users);
})


.controller('InviteGroupCtrl', function ($scope, $window, $location, $stateParams, Group) {
	$scope.group = {name: $stateParams.group};
	$scope.sendInvite = function () {
		console.log('sending invite');
	}
})

	
/*Firebase, AngularFire */
.controller("FirebaseController", function($scope, $firebase, User, $stateParams) {
	// Get username from factory
	$scope.user = User.getuser();	
	//console.log($scope.user);
	
	var URL = "https://dispatchninja.firebaseIO.com/groups/" + $stateParams.group + '/chat';
	$scope.items = $firebase(new Firebase(URL));

	/* write data to Firebase */	
	$scope.addMessage = function(message) {
		if (message.trim() != "") {
			$scope.items.$add({username: $scope.user.name, mes: message});
			$scope.message = '';
		}

	};

    /* listen for new messages and scroll the chat window down */
    $scope.items.$on("change", function() {
	    $("#chat_messages").animate({ scrollTop: $('#chat_messages')[0].scrollHeight}, 1000);	
	});

  }
);

function isObjectEmpty(object)
{
	var isEmpty = true;
	for(keys in object) {
		isEmpty = false;
		break; // exiting since we found that the object is not empty
	}
	return isEmpty;
}