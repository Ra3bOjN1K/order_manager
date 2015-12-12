angular.module('GoogleOauthModule', ['restangular'])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }])
    .controller('BaseCtrl', ['$scope', '$window', function($scope, $window) {
        $scope.isGettingTokenMode = false;

        $scope.model = {
            userEmail: '',
            auth_code: ''
        };

        $scope.getUserToken = function () {
            $scope.isGettingTokenMode = true;
            $window.open($('div.hidden').text(), '_blank');
        };
    }]);
