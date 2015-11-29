angular.module('CalendarApp', ['ui.calendar'])
    .directive('calendarStyle', function ($rootScope) {
        return {
            link: function (scope, element, attrs) {
                $rootScope.$on('calendarRendered', function (event, data) {
                    element.addClass('panel panel-default');

                    var fcToolbar = $(element).find('.fc-toolbar');
                    fcToolbar.addClass('panel-heading');
                    fcToolbar.find('.fc-left').find('button').addClass('calendar-view-btn');

                    $(element).find('.fc-view-container').addClass('panel-body');

                    var fcView = $(element).find('.fc-view');
                    fcView.find('.fc-widget-header').addClass('week-days');

                    var today = $(element).find('.fc-day.today');
                    today.attr('id', 'today');
                    //today.append('<div class="today-border-wrapper"></div>');
                    //
                    //var todayBorderWrapper = today.find('.today-border-wrapper');
                    //todayBorderWrapper.height(today.height() - 3);
                    //todayBorderWrapper.width(today.width() - 2);
                })
            }
        }
    })
    .controller('CalendarCtrl', [
        '$rootScope', '$scope', '$timeout', 'ngDialog', 'OrderService', 'Auth', 'uiCalendarConfig',
        function ($rootScope, $scope, $timeout, ngDialog, OrderService, Auth, uiCalendarConfig) {

            OrderService.loadOrders().finally(function () {
                $rootScope.$broadcast('basePageLoaded')
            });

            $scope.$on('orderService:list:updated', function (event, data) {
                $scope.events.addEventList(data);
            });

            $scope.$on('ngDialog.closed', function () {
                $scope.eventWindow.closeOrderWindow()
            });

            $scope.events = {
                list: [],

                addEventList: function (modelOrders) {
                    $timeout(function () {
                        $scope.events.list.length = 0;
                    }).then(function () {
                        angular.forEach(modelOrders, function (order) {
                            $scope.events.addEvent(order);
                        })
                    })
                },

                addEvent: function (modelOrder) {
                    $scope.events.list.push({
                        id: modelOrder.id,
                        title: modelOrder.program.title,
                        start: getStartDateTime(),
                        end: getEndDateTime()
                    });

                    function getStartDateTime() {
                        return modelOrder.celebrate_date + ' ' + modelOrder.celebrate_time;
                    }

                    function getEndDateTime() {
                        var start = moment(
                            modelOrder.celebrate_date + ' ' + modelOrder.celebrate_time,
                            'YYYY-MM-DD HH:mm'
                        );
                        return start.add(modelOrder.duration, 'm').format('YYYY-MM-DD HH:mm');
                    }
                },

                createEvent: function (date, jsEvent, view) {
                    if (Auth.hasPermission('add_order') && !$scope.calendar.isDateInPast(date)) {
                        $scope.eventWindow.showOrderWindow(date, jsEvent, view)
                    }
                },

                showEvent: function (calEvent, jsEvent, view) {
                    $scope.eventWindow.showOrderWindow(calEvent.start, jsEvent, view, calEvent.id)
                }
            };

            $scope.calendar = {
                isDateInPast: function (date) {
                    return date < moment(Date.now()).startOf('day');
                },

                isToday: function (date) {
                    return angular.equals(date.format('YYYY-MM-DD'), moment(Date.now()).format('YYYY-MM-DD'));
                },

                renderCellDay: function (date, cell) {
                    if ($scope.calendar.isToday(date)) {
                        cell.addClass('today');
                    }
                },

                renderEvent: function (event, element, view) {
                    if ($scope.calendar.isDateInPast(event.start)) {
                        element.addClass('event-in-past');
                    }

                    if ($scope.calendar.isToday(event.start)) {
                        element.addClass('event-today');
                    }
                }
            };

            $scope.eventWindow = {
                instance: null,
                checkedDate: null,
                checkedOrderId: null,
                showOrderWindow: function (date, jsEvent, view, order_id) {
                    $scope.eventWindow.checkedDate = date.toDate();
                    $scope.eventWindow.checkedOrderId = order_id !== undefined ? order_id : null;

                    $scope.eventWindow.instance = ngDialog.open({
                        template: 'order_template.html',
                        showClose: false,
                        closeByDocument: false,
                        scope: $scope
                    });
                },
                closeOrderWindow: function (date, jsEvent, view) {
                    $scope.eventWindow.checkedDate = null;
                    $scope.eventWindow.checkedOrderId = null;
                },
                getWindowTitle: function () {
                    if ($scope.eventWindow.checkedDate) {
                        return moment($scope.eventWindow.checkedDate).format('DD MMMM YYYY');
                    }
                    else {
                        return ''
                    }
                }
            };

            $scope.uiConfig = {
                calendar: {
                    aspectRatio: 2.5,
                    editable: false,
                    firstDay: 1,
                    header: {
                        left: 'month agendaWeek agendaDay',
                        center: 'title',
                        right: 'today prev,next'
                    },
                    timezone: 'Europe/Minsk',
                    lang: 'ru',
                    eventLimit: 2,
                    handleWindowResize: false,
                    dayRender: $scope.calendar.renderCellDay,
                    eventRender: $scope.calendar.renderEvent,
                    dayClick: $scope.events.createEvent,
                    events: $scope.events.list,
                    eventClick: $scope.events.showEvent,
                    eventAfterAllRender: function (view) {
                        $rootScope.$broadcast('calendarRendered', [view])
                    }
                }
            };

            $rootScope.$on('renderCalendar', function() {
                uiCalendarConfig.calendars.calendar.fullCalendar('render');
            });

            $scope.eventSources = [];
        }]);
