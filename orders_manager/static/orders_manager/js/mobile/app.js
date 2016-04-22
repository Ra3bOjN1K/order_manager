var app = angular.module('OrderManagerApp', ['ui.bootstrap', 'restangular', 'ui.rCalendar', 'ngAnimate', 'formly',
    'formlyBootstrap', 'nya.bootstrap.select', 'ng-slide-down', 'ui.mask', 'ngAnimate', 'ngMessages',
    'ui.bootstrap.datetimepicker']);

//angular.module('OrderManagerApp', [
//    'ngStorage', 'ngDialog', 'ui.grid', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.pagination', 'ui.grid.selection'])


app.directive('showDialogContentLoading', ['$timeout', function ($timeout) {
    return {
        link: function (scope, element, attrs) {
            var parent = $(element).parent();
            var contentLoader = parent.find('.loading-content');
            contentLoader.height(parent.height());
            contentLoader.width(parent.width());

            //$(element).hide();

            scope.$watch('vm.loadingEvent', function (newVal) {
                $timeout(function () {
                    if (newVal === false) {
                        $('.loading-content').fadeOut(500);
                        element.removeClass('hidden');
                        //$(element).fadeIn(200);
                    }
                });
            })
        }
    }
}]);

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);

app.run(function () {
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }

    String.prototype.trimRight = function (charlist) {
        if (charlist === undefined) {
            charlist = "\s";
        }

        return this.replace(new RegExp("[" + charlist + "]+$"), "");
    };

    String.prototype.trimPhoneCountryCode = function () {
        var phoneNum = this.toString();
        if (phoneNum.length >= 12 && (phoneNum.startsWith('375') || phoneNum.startsWith('+375'))) {
            phoneNum = phoneNum.replace(/^\+?375/, '')
        }
        return phoneNum;
    };

    String.prototype.addPhoneCountryCode = function () {
        var phoneNum = this.toString();
        if (phoneNum.length === 9) {
            phoneNum = '375' + phoneNum
        }
        return phoneNum;
    }
});

app.controller('ApplicationCtrl', ['$scope', '$timeout', 'Auth', 'OrderService',

    function ($scope, $timeout, Auth, OrderService) {

        $scope.basePage = {
            loading: true
        };

        $scope.$on('basePageLoaded', function () {
            $scope.basePage.loading = false;
        });

        $scope.auth = {
            hasPermission: function (permission) {
                return Auth.hasPermission(permission)
            }
        };

        $scope.syncGoogleCalendar = function () {
            OrderService.syncGoogleCalendar();
        };
    }]);

app.controller('OrderWindowCtrl', ['OrderWindowService', function (OrderWindowService) {
    var vm = this;

    vm.isOrderWindowOpened = function () {
        return OrderWindowService.isWindowOpened();
    }
}]);

app.controller('CalendarCtrl', ['$rootScope', '$scope', '$timeout', 'OrderService', 'OrderWindowService',

    function ($rootScope, $scope, $timeout, OrderService, OrderWindowService) {
        var vm = this;

        vm.mode = 'day';
        vm.currentCalendarDate = new Date();
        vm.eventSource = [];

        $scope.$watch(function () {
            return vm.currentCalendarDate;
        }, function (date) {
            loadRemoteEvents(date);
        }, true);

        vm.isDayMode = function () {
            return vm.mode === 'day'
        };

        vm.isMonthMode = function () {
            return vm.mode === 'month'
        };

        vm.onDateSelected = function (date) {
            vm.currentCalendarDate = date;
            $scope.$broadcast('eventSourceChanged', vm.eventSource);
        };

        vm.showCheckedDayInfo = function () {
            loadRemoteEvents(vm.currentCalendarDate);
            vm.mode = 'day';
        };

        vm.showMothCalendar = function () {
            clearEvents();
            vm.mode = 'month';
        };

        vm.back = function () {
            vm.currentCalendarDate = new Date();
            loadRemoteEvents(vm.currentCalendarDate);
            vm.mode = 'day';
        };

        vm.createNewOrder = function () {
            OrderWindowService.createOrder();
            OrderWindowService.setCheckedDate(vm.currentCalendarDate);
        };

        vm.editOrder = function (order) {
            OrderWindowService.editOrder(order.id);
            OrderWindowService.setCheckedDate(vm.currentCalendarDate);
        };

        var loadRemoteEvents = function (date) {
            var start = moment(date).startOf('day').format('YYYY-MM-DD HH:mm');
            var end = moment(date).endOf('day').format('YYYY-MM-DD HH:mm');
            clearEvents();
            OrderService.loadOrders(true, start, end).then(function () {
                renderEventSource(OrderService.getOrders());
            });
        };

        var renderEventSource = function (data) {
            var events = [];
            angular.forEach(data, function (item) {
                var executors = '';
                angular.forEach(item.program_executors, function (ex) {
                    if (executors.length > 0) {
                        executors += ', ' + ex.full_name;
                    }
                    else {
                        executors = ex.full_name;
                    }
                });
                var title = item.program.title + ' - ' + executors;
                events.push({
                    'id': item.id,
                    'title': title.slice(0, 50),
                    'startTime': moment(item.celebrate_date + ' ' + item.celebrate_time).toDate(),
                    'endTime': moment(item.celebrate_date + ' ' + item.celebrate_time).add(1, 'hours').toDate()
                })
            });
            vm.eventSource = events;
            $scope.$broadcast('eventSourceChanged', vm.eventSource);
        };

        var clearEvents = function () {
            vm.eventSource = [];
            $scope.$broadcast('eventSourceChanged', vm.eventSource);
        };

        $rootScope.$on('CalendarEventCtrl:onClosedOrderWindow', function () {
            loadRemoteEvents(vm.currentCalendarDate);
        });
    }]);

