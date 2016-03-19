angular.module('CalendarApp', ['ui.calendar'])
    .directive('calendarStyle', function ($rootScope, $timeout, OrderService, uiCalendarConfig) {
        return {
            link: function (scope, element, attrs) {
                var isViewCtrlBtnsInited = false;

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
                    var fcRight = fcToolbar.find('.fc-right');
                    if (!isViewCtrlBtnsInited) {
                        var viewCtrlBtns = fcRight.find('.fc-prev-button, .fc-next-button');
                        viewCtrlBtns.on('click', function () {
                            var view = uiCalendarConfig.calendars.calendar.fullCalendar('getView');
                            var start = view.start.format('YYYY-MM-DD HH:mm');
                            var end = view.end.format('YYYY-MM-DD HH:mm');
                            $timeout(function () {
                                OrderService.loadOrders(true, start, end).then(function () {
                                    //console.log('render --', start + " | " + end);
                                });
                            }, 100);
                        });
                    }
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
        '$rootScope', '$scope', '$timeout', 'ngDialog', 'OrderService', 'ExecutorDayOffService', 'Auth', 'uiCalendarConfig',
        function ($rootScope, $scope, $timeout, ngDialog, OrderService, ExecutorDayOffService, Auth, uiCalendarConfig) {

            ExecutorDayOffService.reloadDaysOff();

            //OrderService.loadOrders().finally(function () {
            //    $rootScope.$broadcast('basePageLoaded')
            //});

            $rootScope.$broadcast('basePageLoaded');

            $scope.$on('orderService:list:updated', function (event, orderList) {
                $scope.events.addEventList(orderList, ExecutorDayOffService.getDaysOff());
            });

            $scope.$on('ExecutorDayOffService:list:updated', function (event, dayOffList) {
                $scope.events.addEventList(OrderService.getOrders(), dayOffList);
            });

            $scope.$on('ngDialog.closed', function () {
                $scope.eventWindow.closeOrderWindow()
            });

            $scope.events = {
                list: [],

                addEventList: function (modelOrders, modelDaysOff) {
                    var events = [];
                    $timeout(function () {
                        angular.forEach(modelDaysOff, function (dayOff) {
                            dayOff.lbl = 'dayOff';
                            events.push($scope.events.prepareEvent(dayOff));
                            //$scope.events.addEvent(dayOff);
                        })
                    }).then(function () {
                        angular.forEach(modelOrders, function (order) {
                            order.lbl = 'order';
                            events.push($scope.events.prepareEvent(order));
                            //$scope.events.addEvent(order);
                        })
                    }).then(function () {
                        //$scope.events.list.length = 0;
                        uiCalendarConfig.calendars.calendar.fullCalendar('removeEvents');
                        uiCalendarConfig.calendars.calendar.fullCalendar('addEventSource', events);
                        //angular.forEach(events, function (item) {
                        //    $scope.events.list.push(item);
                        //});
                    })
                },

                prepareEvent: function (model) {
                    var modelItem = {
                        label: model.lbl
                    };

                    if (model.lbl === 'order') {
                        modelItem.id = model.id;
                        modelItem.title = getEventTitle();
                        modelItem.start = getStartDateTime();
                        modelItem.end = getEndDateTime();
                        modelItem.userIsOnlyServiceExecutor = model.is_only_service_executor;

                        function getEventTitle() {
                            var title = model.program.title;
                            if (model.program_executors && model.program_executors.length > 0) {
                                title += ' - ';
                                angular.forEach(model.program_executors, function (executor) {
                                    title += executor.full_name + ', ';
                                })
                            }
                            return title.trimRight(', ');
                        }

                        function getStartDateTime() {
                            return model.celebrate_date + ' ' + model.celebrate_time;
                        }

                        function getEndDateTime() {
                            var start = moment(
                                model.celebrate_date + ' ' + model.celebrate_time,
                                'YYYY-MM-DD HH:mm'
                            );
                            return start.add(model.duration, 'm').format('YYYY-MM-DD HH:mm');
                        }
                    }
                    else if (model.lbl === 'dayOff') {
                        modelItem.id = model.id;
                        var time_start = model.time_start.substring(0, 5);
                        var time_end = model.time_end.substring(0, 5);
                        if (time_start !== "00:00" && time_end !== "00:00") {
                            modelItem.title = '({0}-{1}) {2}'.format(time_start, time_end, model.user_full_name);
                        }
                        else {
                            modelItem.title = model.user_full_name;
                        }
                        modelItem.start = model.date + ' ' + model.time_start;
                    }
                    return modelItem;
                },

                addEvent: function (model) {
                    $scope.events.list.push($scope.events.prepareEvent(model));
                },

                createEvent: function (date, jsEvent, view) {
                    if (!$scope.calendar.isDateInPast(date)) {
                        if (Auth.hasPermission('add_order')) {
                            $scope.eventWindow.showOrderWindow(date, jsEvent, view)
                        }
                        else {
                            $rootScope.$broadcast('Calendar.showDayOffDialog', date);
                        }
                    }
                },

                showEvent: function (calEvent, jsEvent, view) {
                    if (calEvent.label === 'order') {
                        $scope.eventWindow.showOrderWindow(calEvent.start, jsEvent, view, calEvent.id)
                    }
                    else {
                        $rootScope.$broadcast('Calendar.showDayOffDialog', calEvent.start, calEvent);
                    }
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
                    if (event.label === 'dayOff') {
                        element.addClass('day-off');
                        $(element).find('span.fc-time').remove();
                    }

                    if ($scope.calendar.isDateInPast(event.start)) {
                        element.addClass('event-in-past');
                    }

                    if ($scope.calendar.isToday(event.start)) {
                        element.addClass('event-today');
                    }

                    if (event.userIsOnlyServiceExecutor) {
                        element.addClass('only-service-executor');
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
                    lazyFetching: false,
                    handleWindowResize: false,
                    dayRender: $scope.calendar.renderCellDay,
                    eventRender: $scope.calendar.renderEvent,
                    dayClick: $scope.events.createEvent,
                    events: $scope.events.list,
                    eventClick: $scope.events.showEvent,
                    eventAfterAllRender: function (view) {
                        $rootScope.$broadcast('calendarRendered', [view]);
                        //console.log('all_rendered')
                    }
                }
            };

            $rootScope.$on('renderCalendar', function () {
                uiCalendarConfig.calendars.calendar.fullCalendar('render');
                var view = uiCalendarConfig.calendars.calendar.fullCalendar('getView');
                var start = view.start.format('YYYY-MM-DD HH:mm');
                var end = view.end.format('YYYY-MM-DD HH:mm');
                OrderService.loadOrders(true, start, end).then(function () {
                    //console.log('render', start + " | " + end);
                });
            });

            $scope.eventSources = [];
        }]);
