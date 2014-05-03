var app = angular.module('myApp', ['ngRoute','ui.bootstrap','firebase', 'ui.bootstrap.collapsewide'])

.config(['$routeProvider', '$locationProvider', 
    function ($routeProvider, $locationProvider) {
        $routeProvider.
		when('/', {
			templateUrl: '/public/partials/main.temp',
			controller: 'MainCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
		$locationProvider.html5Mode(true);
}])

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