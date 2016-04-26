var app = angular.module('OrderManagerApp');

app.directive('confirmDlg', [function () {
    return {
        link: function (scope, element, attr) {
            var msg = attr.confirmDlg || "Are you sure?";
            var clickAction = attr.confirmedClick;
            element.bind('click', function (event) {
                if (window.confirm(msg)) {
                    scope.$eval(clickAction)
                }
            });
        }
    }
}]);

app.directive('hideSearchboxes', ['$timeout', function ($timeout) {
    return {
        link: function (scope, element, attr) {
            $timeout(function () {
                var searchBoxes = angular.element(element).find('.bs-searchbox').not('.order-client-select' +
                    ' .bs-searchbox');
                searchBoxes.css({'display': 'none'});
            }, 700);
        }
    }
}]);

app.directive('showWeekDay', ['$timeout', function ($timeout) {
    return {
        link: function (scope, element, attr) {
            var header = angular.element(element).find('.calendar-header');
            header.append('<span class="week-day"></span>');
            scope.$watch(function () {
                return moment(scope.vm.currentCalendarDate).locale('ru').format('dddd');
            }, function (weedDay) {
                var daySpan = angular.element(element).find('.week-day');
                daySpan.html(weedDay);
            });
        }
    }
}]);
