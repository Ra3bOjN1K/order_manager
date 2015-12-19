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

        $scope.isProductionMode = function () {
            return angular.equals($('#is-production-mode').text(), 'True');
        };

        $scope.getUserTokenInNewTab = function () {
            $scope.isGettingTokenMode = true;
            $window.open($('#auth-uri').text(), '_blank');
        };

        $scope.getUserTokenInCurrentTab = function () {
            $window.open($('#auth-uri').text(), '_self');
        };
    }]);
