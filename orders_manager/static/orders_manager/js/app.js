angular.module('OrderManagerApp', [
        'ngStorage', 'ngAnimate', 'ngMessages', 'ngDialog', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', 'ui.grid',
        'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.pagination', 'ui.grid.selection', 'CalendarApp', 'restangular',
        'formly', 'formlyBootstrap', 'nya.bootstrap.select', 'ng-slide-down', 'ui.mask'])

    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }])
    .run(function () {
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
    })
    .factory('ConfirmationDialog', ['ngDialog', function (ngDialog) {
        return {
            openDialog: function (message) {
                return ngDialog.openConfirm({
                    template: 'confirmation_template.html',
                    showClose: false,
                    closeByDocument: false,
                    data: {
                        msg: message
                    }
                })
            }
        }
    }])
    .filter('debug', function () {
        return function (input) {
            if (input === '') return 'empty string';
            return input ? input : ('' + input);
        };
    })
    .directive('contentLoader', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
        return {
            link: function (scope, element, attrs) {
                $(element).hide();

                scope.$watch('basePage.loading', function (newVal) {
                    $timeout(function () {
                        if (newVal === false) {
                            $('#calendar').hide();
                            $('.loading-blinds').fadeOut(300);
                            element.removeClass('hidden');
                            $(element).fadeIn(400);
                            $timeout(function () {
                                $('#calendar').fadeIn(500);
                            }, 600).then(function () {
                                $rootScope.$broadcast('renderCalendar')
                            });
                        }
                    }, 1000);
                })
            }
        }
    }])
    .directive('showDialogContentLoading', ['$timeout', function ($timeout) {
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
    }])
    .directive('collapsedItem', function ($compile) {
        return {
            link: function (scope, element, attrs) {
                scope[attrs.collapsedItem] = {
                    isCollapsed: true
                };

                function collapse(isCollapsed) {
                    var i = element.find('i');
                    var container = element.next('div');

                    if (i) {
                        i.attr('class', isCollapsed ? 'fa fa-angle-left' : 'fa fa-angle-down');
                    }
                    if (container) {
                        container.attr('uib-collapse', isCollapsed);
                    }
                }

                collapse(scope[attrs.collapsedItem].isCollapsed);

                element.bind('click', function () {
                    $('.page-container').on('click', function (event) {
                        scope[attrs.collapsedItem].isCollapsed = true;
                        scope.$apply('scope[attrs.collapsedItem].isCollapsed');
                        collapse(scope[attrs.collapsedItem].isCollapsed);
                        $compile(element.contents())(scope);
                    });

                    scope[attrs.collapsedItem].isCollapsed = !scope[attrs.collapsedItem].isCollapsed;
                    scope.$apply('scope[attrs.collapsedItem].isCollapsed');
                    collapse(scope[attrs.collapsedItem].isCollapsed);
                    $compile(element.contents())(scope);
                    return false;
                });
            },
            restrict: 'A'
        }
    })
    .directive('onCustomPeriodRange', ['$document', '$timeout', function ($document, $timeout) {
        return {
            scope: {
                setRange: '&onCustomPeriodRange'
            },
            link: function (scope, element, attrs) {
                $timeout(function () {
                    var dateStartEl = $document.find('.custom-date-start');
                    var dateEndEl = $document.find('.custom-date-end');
                    element.on('click', function () {
                        var start = dateStartEl.val();
                        var end = dateEndEl.val();
                        if (!!start && !!end) {
                            scope.setRange({
                                'range': {
                                    'start': moment(start, 'DD.MM.YYYY').format('YYYY-MM-DD HH:mm'),
                                    'end': moment(end, 'DD.MM.YYYY').format('YYYY-MM-DD HH:mm')
                                }
                            });
                        }
                    })
                })
            },
            restrict: 'A'
        }
    }])
    .directive('drawSourceDifPercent', ['$document', '$timeout', '$compile', function ($document, $timeout, $compile) {
        function calculatePercent(fVal, sVal) {
            var f = parseInt(fVal);
            var s = parseInt(sVal);
            if (f === 0 && s === 0) {
                return 0;
            }
            else if (s === 0) {
                return 100;
            }
            return parseInt(((f - s) / s) * 100);
        }

        function getCellTemplate(currentValue, percent) {
            if (percent !== 0) {
                var styleClass = percent > 0 ? "up" : "down";
                var icon = percent > 0
                    ? "<i class=\"fa fa-long-arrow-up\"></i>"
                    : "<i class=\"fa fa-long-arrow-down\"></i>";
                return "<div class=\"cell-content\">" +
                    "<div class=\"count-val\">" + currentValue + "</div>" +
                    "<div class=\"diff-percent-wrapper " + styleClass + "\">" +
                    icon + "<span class=\"percent-val\">" + Math.abs(percent) + "</span>" +
                    "</div></div>"
            }
            else {
                return "<div class=\"cell-content\">" +
                    "<div class=\"count-val\">" + currentValue + "</div>" +
                    "<div class=\"diff-percent-wrapper\"></div></div>"
            }
        }

        return {
            link: function (scope, element, attrs) {
                $timeout(function () {
                    var sourceRows = $(element).find('tr');
                    angular.forEach(sourceRows, function (fRow, idx) {
                        if (sourceRows.length > idx + 1) {
                            var sRow = $(sourceRows[idx + 1]);
                            var sCells = sRow.find('td.source-num');
                            angular.forEach($(fRow).find('td.source-num'), function (cell, i) {
                                cell = $(cell);
                                var diff_percent = calculatePercent(cell.text(), $(sCells[i]).text());
                                cell.html(getCellTemplate(cell.text(), diff_percent));
                                //$compile($(cell).contents())(scope);
                            })
                        }
                    })
                })
            },
            restrict: 'A'
        }
    }])
    .filter('formatPrice', function () {
        return function (input) {
            var num_str = input.toString();
            var result = num_str.split(/(?=(?:...)*$)/).join(' ');
            return result
        };
    })
    .controller('ApplicationCtrl', ['$scope', '$timeout', 'Auth', 'ngDialog', function ($scope, $timeout, Auth, ngDialog) {

        $scope.basePage = {
            loading: true
        };

        $scope.$on('basePageLoaded', function () {
            $scope.basePage.loading = false;
        });

        $scope.$on('Calendar.showDayOffDialog', function (event, date, dayOff) {
            $scope.dlgManager.dayOff.showDlg(date, dayOff);
        });

        $scope.auth = {
            hasPermission: function (permission) {
                return Auth.hasPermission(permission)
            }
        };

        $scope.dlgManager = {
            changePwd: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'change_password_template.html',
                        showClose: false,
                        closeByDocument: false
                    });
                }
            },
            dayOff: {
                showDlg: function (date, dayOff) {
                    $scope.checkedDate = date;
                    $scope.checkedDayOff = dayOff;

                    $scope.dayOffDialog = ngDialog.open({
                        template: 'dayoff_template.html',
                        showClose: false,
                        closeByDocument: false,
                        scope: $scope
                    });
                }
            },
            userProfile: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'userprofile_template.html',
                        showClose: false,
                        closeByDocument: false
                    });
                }
            },
            clients: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'clients_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            programsHandbook: {
                showDlg: function () {
                    $timeout(function () {
                        ngDialog.open({
                            template: 'programs_handbook_template.html',
                            showClose: false,
                            closeByDocument: false
                        })
                    });
                }
            },
            additionalServicesHandbook: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'additional_services_handbook_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            discountsHandbook: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'discounts_handbook_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            usersManager: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'users_manager_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            smsDelivery: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'sms_delivery_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            animatorDebt: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'animator_debts_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            },
            statistic: {
                showDlg: function () {
                    ngDialog.open({
                        template: 'statistic_template.html',
                        showClose: false,
                        closeByDocument: false
                    })
                }
            }
        }
    }])
    .controller('ExecutorDayOffCtrl', [
        '$scope', 'ExecutorDayOffForm', 'ExecutorDayOffService',
        function ($scope, ExecutorDayOffForm, ExecutorDayOffService) {

            var vm = this;

            var checkedDayOffId = $scope.checkedDayOff !== undefined ? $scope.checkedDayOff.id : 0;

            ExecutorDayOffService.getDayOff(checkedDayOffId).then(function (data) {
                vm.model = data;
                if (vm.model.date === undefined) {
                    vm.model.date = $scope.checkedDate;
                }
                vm.fields = ExecutorDayOffForm.getFieldsOptions();
            });

            vm.onSetDayOffSubmit = function () {
                if (vm.form.$valid) {
                    var convertedData = ExecutorDayOffForm.convertDataToModel(vm.model);
                    if (!!convertedData.id) {
                        ExecutorDayOffService.updateDayOff(convertedData).then(function () {
                            $scope.dayOffDialog.close();
                        });
                    }
                    else {
                        ExecutorDayOffService.saveDayOff(convertedData).then(function () {
                            $scope.dayOffDialog.close();
                        });
                    }
                }
            };

            vm.onDayOffDelete = function () {
                ExecutorDayOffService.deleteDayOff(vm.model.id).then(function () {
                    $scope.dayOffDialog.close();
                })
            }
        }])
    .controller('UserChangePwdCtrl', [
        '$window', 'ngDialog', 'UserService', 'ChangePasswordForm',
        function ($window, ngDialog, UserService, ChangePasswordForm) {

            var vm = this;

            vm.model = {
                oldPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            };

            vm.fields = ChangePasswordForm.getFieldsOptions();

            vm.onChangePasswordSubmit = function () {
                if (vm.form.$valid) {
                    UserService.changePassword({
                        old_password: vm.model.oldPassword,
                        new_password: vm.model.newPassword,
                        confirm_new_password: vm.model.confirmNewPassword
                    }).then(function (data) {
                        if (data.errors && data.errors.length) {
                            angular.forEach(data.errors, function (error) {
                                if (error.old_password) {
                                    vm.form.oldPwd.$setValidity('wrongPassword', false)
                                }
                                else if (error.form) {
                                    vm.form.$setValidity('notFilled', false)
                                }
                            })
                        }
                        else {
                            ngDialog.closeAll();
                            $window.location.href = '/login/'
                        }
                    })
                }
            }
        }])
    .controller('UserProfileCtrl', ['Auth', 'UserProfileForm', function (Auth, UserProfileForm) {
        var vm = this;

        vm.model = Auth.getUser();

        vm.readonly = true;

        vm.fields = UserProfileForm.getFieldsOptions(vm.readonly);

        vm.onSaveUserProfileSubmit = function () {
            if (vm.form.$valid) {
                console.log(vm.model)
            }
        }
    }])
    .controller('ClientsCtrl', [
        '$q', '$scope', '$timeout', '$interval', 'ConfirmationDialog', 'ClientService', 'ClientFullForm', 'uiGridConstants',
        function ($q, $scope, $timeout, $interval, ConfirmationDialog, ClientService, ClientFullForm, uiGridConstants) {

            var vm = this;

            vm.loadingEvent = true;

            vm.gridOptions = {
                enablePaginationControls: false,
                paginationPageSize: 12,
                enableColumnMenus: false,
                enableRowSelection: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                modifierKeysToMultiSelect: false,
                noUnselect: true,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                columnDefs: [
                    {
                        name: 'id',
                        displayName: 'ID',
                        width: 45,
                        enableSorting: false
                    },
                    {
                        name: 'name',
                        displayName: 'Имя',
                        width: 285
                    },
                    {
                        name: 'phone',
                        displayName: 'Телефон',
                        enableSorting: false,
                        width: 150
                    },
                    {
                        name: 'row-control',
                        displayName: '',
                        enableSorting: false,
                        enableCellEdit: false,
                        cellClass: 'ctrl-btns-wrapper',
                        cellTemplate: 'client-row-ctrl-btns-template.html'
                    }
                ]
            };

            vm.gridOptions.onRegisterApi = function (gridApi) {
                vm.gridApi = gridApi;
                vm.gridApi.grid.registerRowsProcessor(vm.singleFilter, 200);

                vm.gridApi.selection.on.rowSelectionChanged(null, function (row) {
                    $timeout(function () {
                        vm.client.selectedClient = angular.copy(row.entity);
                        if ((!vm.detailsMode.clientDetails && !vm.detailsMode.clientChildren) || row.entity.id === undefined) {
                            vm.detailsMode.setClientDetailsMode();
                        }
                        else if (vm.detailsMode.clientChildren) {
                            vm.clientChildrenMode.initClientChildrenGrid(row)
                        }

                        vm.clientEditMode.deactivate();

                        if (vm.form !== undefined) {
                            vm.formOptions = {};
                            vm.form.$setPristine();
                            vm.form.$setUntouched();
                            vm.formFields = vm.clientEditMode.getFormFields();
                            vm.originalFormFields = angular.copy(vm.formFields);
                        }

                        vm.client.isNewClient = !row.entity.id;
                    });
                });
            };

            vm.detailsMode = {
                clientDetails: false,
                clientChildren: false,

                setClientDetailsMode: function () {
                    vm.detailsMode.clientChildren = false;
                    vm.detailsMode.clientDetails = true;
                },

                setClientChildrenMode: function (row) {
                    vm.detailsMode.clientDetails = false;
                    vm.detailsMode.clientChildren = true;
                    vm.clientChildrenMode.initClientChildrenGrid(row)
                }
            };

            vm.client = {
                selectedClient: null,
                isNewClient: false,
                addNewRow: function () {
                    vm.gridOptions.data.unshift({
                        name: 'Новый клиент',
                        phone: ''
                    });

                    $timeout(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    });

                    $timeout(function () {
                        vm.clientEditMode.activate();
                    }, 200);
                },
                updateRow: function (data) {
                    var firstRow = vm.gridOptions.data.length > 0 ? vm.gridOptions.data[0] : null;
                    if (firstRow && !firstRow.id) {
                        vm.gridOptions.data.shift();
                        vm.gridOptions.data.push(data);
                        vm.gridApi.grid.refresh();
                    }
                    else {
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(data.id, row.id)) {
                                vm.gridOptions.data[idx] = data;
                                vm.gridApi.grid.refresh();
                            }
                        })
                    }
                },
                deleteClient: function (delRow) {
                    ConfirmationDialog.openDialog('Вы действительно хотите удалить заказчика?').then(function success() {
                        ClientService.deleteClient(delRow.entity.id).then(function () {
                            angular.forEach(vm.gridOptions.data, function (row, idx) {
                                if (angular.equals(delRow.entity.id, row.id)) {
                                    vm.gridOptions.data.splice(idx, 1);
                                    vm.gridApi.grid.refresh();

                                    if (vm.gridOptions.data.length > 0) {
                                        vm.gridApi.selection.selectRow(vm.gridOptions.data[idx - 1]);
                                    }
                                }
                            })
                        })
                    });
                }
            };

            vm.clientEditMode = {
                isActiveMode: false,
                activate: function () {
                    vm.clientEditMode.isActiveMode = true;
                    vm.formFields = vm.clientEditMode.getFormFields()
                },
                deactivate: function () {
                    vm.clientEditMode.isActiveMode = false;
                    vm.formFields = vm.clientEditMode.getFormFields()
                },
                toggleActivate: function () {
                    if (!vm.detailsMode.clientDetails) {
                        vm.detailsMode.setClientDetailsMode()
                    }
                    else {
                        vm.clientEditMode.isActiveMode
                            ? vm.clientEditMode.deactivate()
                            : vm.clientEditMode.activate();
                    }
                },
                getFormFields: function () {
                    return ClientFullForm.getFieldsOptions(vm.clientEditMode.isActiveMode);
                },
                cancelEdit: function () {
                    var row = vm.gridApi.selection.getSelectedRows()[0];
                    vm.client.selectedClient = angular.copy(row);
                    vm.form.$setPristine();
                    vm.form.$setUntouched();
                    //vm.clientEditMode.deactivate();
                },
                deleteNewClient: function () {
                    var gridRow = vm.gridApi.selection.getSelectedRows()[0];
                    angular.forEach(vm.gridOptions.data, function (row, idx) {
                        if (angular.equals(gridRow, row)) {
                            vm.gridOptions.data.splice(idx, 1);
                            $timeout(function () {
                                vm.gridApi.grid.refresh();
                                if (vm.gridOptions.data.length > 0) {
                                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                                }
                            })
                        }
                    })
                },
                saveClient: function () {
                    ClientService.saveClient(ClientFullForm.convertDataToModel(vm.client.selectedClient)).then(function (data) {
                        vm.client.updateRow(data);
                        vm.clientEditMode.deactivate();
                        $timeout(function () {
                            vm.gridApi.selection.selectRow(data);
                        });
                    })
                }
            };

            vm.clientChildrenMode = {
                isActiveMode: false,
                isEditChildren: false,
                activate: function () {
                    vm.clientChildrenMode.isActiveMode = true;
                },
                deactivate: function () {
                    vm.clientChildrenMode.isActiveMode = false;
                },
                toggleActivate: function () {
                    vm.clientChildrenMode.isActiveMode
                        ? vm.clientChildrenMode.deactivate()
                        : vm.clientChildrenMode.activate();
                },
                initClientChildrenGrid: function (row) {
                    vm.childrenGridOptions = {
                        //enablePaginationControls: false,
                        //paginationPageSize: 12,
                        enableColumnMenus: false,
                        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                        columnDefs: [
                            {
                                name: 'name',
                                displayName: 'Имя',
                                width: 210,
                                enableCellEdit: true
                            },
                            {
                                name: 'birthday',
                                displayName: 'Дата рождения',
                                enableSorting: false,
                                width: 140,
                                cellClass: 'birthday-cell',
                                enableCellEdit: true
                            },
                            {
                                name: 'row-control',
                                displayName: '',
                                enableSorting: false,
                                cellClass: 'ctrl-btns-wrapper',
                                cellTemplate: 'children-row-ctrl-btns-template.html'
                            }
                        ]
                    };

                    vm.childrenGridOptions.onRegisterApi = function (gridApi) {
                        $scope.gridApi = gridApi;
                        gridApi.rowEdit.on.saveRow($scope, vm.clientChildrenMode.saveRow);
                    };

                    if (row.entity.id !== undefined) {
                        ClientService.getClientChildren(row.entity.id).then(function (data) {
                            vm.childrenGridOptions.data = data;
                        })
                    }
                    else {
                        vm.childrenGridOptions.data = []
                    }
                },
                addChildRow: function () {
                    vm.childrenGridOptions.data.unshift({
                        name: 'Новая запись',
                        birthday: ''
                    });
                },
                saveRow: function (rowEntity) {
                    var childName = rowEntity.name.trim(),
                        childBirthday = rowEntity.birthday,
                        childId = rowEntity.id,
                        parentId = vm.client.selectedClient.id;

                    var promise = $q.defer();

                    $scope.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);

                    if (childName && childBirthday && parentId) {
                        ClientService.saveClientChildren({
                            id: childId,
                            name: childName,
                            birthday: childBirthday,
                            client: parentId
                        }).then(function success() {
                            promise.resolve()
                        }, function error(data) {
                            promise.reject(data)
                        });
                    }
                    else {
                        promise.reject()
                    }

                },
                deleteClientChild: function (delRow) {

                    function _deleteChildrenRow() {
                        angular.forEach(vm.childrenGridOptions.data, function (row, idx) {
                            if (angular.equals(delRow.entity, row)) {
                                vm.childrenGridOptions.data.splice(idx, 1);
                                $scope.gridApi.grid.refresh();
                            }
                        })
                    }

                    ConfirmationDialog.openDialog('Вы действительно хотите удалить запись?').then(function success() {
                        if (delRow.entity.id !== undefined) {
                            var parentId = vm.client.selectedClient.id;
                            ClientService.deleteClientChild(parentId, delRow.entity.id).then(function () {
                                _deleteChildrenRow();
                            })
                        }
                        else {
                            _deleteChildrenRow();
                        }
                    })
                }
            };

            vm.filterSearchWord = '';

            vm.filter = function () {
                vm.gridApi.grid.refresh();
            };

            vm.singleFilter = function (renderableRows) {
                var matcher = new RegExp(vm.filterSearchWord);
                renderableRows.forEach(function (row) {
                    var match = false;
                    ['name', 'phone'].forEach(function (field) {
                        if (row.entity[field].match(matcher)) {
                            match = true;
                        }
                    });
                    if (!match) {
                        row.visible = false;
                    }
                });
                return renderableRows;
            };

            ClientService.reloadClients().then(function () {
                vm.gridOptions.data = ClientService.getClients();

                $timeout(function () {
                    vm.loadingEvent = false;
                }, 500);

                $timeout(function () {
                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                }, 200);
            })
        }])
    .controller('ProgramsHandbookCtrl', [
        '$q', '$scope', '$timeout', '$interval', 'ConfirmationDialog', 'UserService', 'ProgramService', 'ProgramForm', 'uiGridConstants',
        function ($q, $scope, $timeout, $interval, ConfirmationDialog, UserService, ProgramService, ProgramForm, uiGridConstants) {

            var vm = this;

            vm.loadingEvent = true;

            vm.gridOptions = {
                enablePaginationControls: false,
                paginationPageSize: 12,
                enableColumnMenus: false,
                enableRowSelection: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                modifierKeysToMultiSelect: false,
                noUnselect: true,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                columnDefs: [
                    {
                        name: 'id',
                        displayName: 'ID',
                        width: 45,
                        enableSorting: false
                    },
                    {
                        name: 'title',
                        displayName: 'Название',
                        width: 435
                    },
                    {
                        name: 'row-control',
                        displayName: '',
                        enableSorting: false,
                        enableCellEdit: false,
                        cellClass: 'ctrl-btns-wrapper',
                        cellTemplate: 'program-row-ctrl-btns-template.html'
                    }
                ]
            };

            vm.gridOptions.onRegisterApi = function (gridApi) {
                vm.gridApi = gridApi;
                vm.gridApi.grid.registerRowsProcessor(vm.singleFilter, 200);

                UserService.reloadExecutors().then(function () {
                    vm.gridApi.selection.on.rowSelectionChanged(null, function (row) {
                        $timeout(function () {
                            vm.program.selectedProgram = angular.copy(row.entity);

                            if ((!vm.detailsMode.programDetails && !vm.detailsMode.programPrices) || row.entity.id === undefined) {
                                vm.detailsMode.setProgramDetailsMode();
                            }
                            else if (vm.detailsMode.programPrices) {
                                vm.programPricesMode.initProgramPricesGrid(row)
                            }

                            vm.programEditMode.deactivate();

                            vm.formOptions = {
                                formState: {
                                    possibleExecutors: row.entity.possible_executors
                                }
                            };

                            if (vm.form !== undefined) {
                                vm.form.$setPristine();
                                vm.form.$setUntouched();
                            }

                            vm.formFields = vm.programEditMode.getFormFields();
                            vm.originalFormFields = angular.copy(vm.formFields);

                            vm.program.isNewProgram = !row.entity.id;

                        }, 100);

                    });
                });
            };

            vm.detailsMode = {
                programDetails: false,
                programPrices: false,

                setProgramDetailsMode: function () {
                    vm.detailsMode.programPrices = false;
                    vm.detailsMode.programDetails = true;
                },

                setProgramPricesMode: function (row) {
                    vm.detailsMode.programDetails = false;
                    vm.detailsMode.programPrices = true;
                    vm.programPricesMode.initProgramPricesGrid(row)
                }
            };

            vm.program = {
                selectedProgram: null,
                isNewProgram: false,
                addNewRow: function () {
                    vm.gridOptions.data.unshift({
                        title: 'Новая программа'
                    });

                    $timeout(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    });

                    $timeout(function () {
                        vm.programEditMode.activate();
                    }, 200);
                },
                updateRow: function (data) {
                    var firstRow = vm.gridOptions.data.length > 0 ? vm.gridOptions.data[0] : null;
                    if (firstRow && !firstRow.id) {
                        vm.gridOptions.data.shift();
                        vm.gridOptions.data.push(data);
                        vm.gridApi.grid.refresh();
                    }
                    else {
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(data.id, row.id)) {
                                vm.gridOptions.data[idx] = data;
                                vm.gridApi.grid.refresh();
                            }
                        })
                    }
                },
                deleteProgram: function (delRow) {
                    if (delRow.entity.id) {
                        ConfirmationDialog.openDialog('Вы действительно хотите удалить программу?').then(function success() {
                            ProgramService.deleteProgram(delRow.entity.id).then(function () {
                                angular.forEach(vm.gridOptions.data, function (row, idx) {
                                    if (angular.equals(delRow.entity.id, row.id)) {
                                        vm.gridOptions.data.splice(idx, 1);
                                        vm.gridApi.grid.refresh();

                                        if (vm.gridOptions.data.length > 0) {
                                            vm.gridApi.selection.selectRow(vm.gridOptions.data[idx - 1]);
                                        }
                                    }
                                })
                            })
                        });
                    }
                    else {
                        vm.programEditMode.deleteNewProgram();
                    }
                }
            };

            vm.programEditMode = {
                isActiveMode: false,
                activate: function () {
                    vm.programEditMode.isActiveMode = true;
                    vm.formFields = vm.programEditMode.getFormFields()
                },
                deactivate: function () {
                    vm.programEditMode.isActiveMode = false;
                    vm.formFields = vm.programEditMode.getFormFields()
                },
                toggleActivate: function () {
                    if (!vm.detailsMode.programDetails) {
                        vm.detailsMode.setProgramDetailsMode()
                    }
                    else {
                        vm.programEditMode.isActiveMode
                            ? vm.programEditMode.deactivate()
                            : vm.programEditMode.activate();
                    }
                },
                getFormFields: function () {
                    return ProgramForm.getFieldsOptions(vm.programEditMode.isActiveMode, vm.program.selectedProgram);
                },
                cancelEdit: function () {
                    var row = vm.gridApi.selection.getSelectedRows()[0];
                    vm.program.selectedProgram = angular.copy(row);
                    vm.form.$setPristine();
                    vm.form.$setUntouched();
                    vm.programEditMode.deactivate();
                },
                deleteNewProgram: function () {
                    var gridRow = vm.gridApi.selection.getSelectedRows()[0];
                    angular.forEach(vm.gridOptions.data, function (row, idx) {
                        if (angular.equals(gridRow, row)) {
                            vm.gridOptions.data.splice(idx, 1);
                            $timeout(function () {
                                vm.gridApi.grid.refresh();
                                if (vm.gridOptions.data.length > 0) {
                                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                                }
                            })
                        }
                    })
                },
                saveProgram: function () {
                    ProgramService.saveProgram(ProgramForm.convertDataToModel(vm.program.selectedProgram)).then(function (data) {
                        vm.program.updateRow(data);
                        vm.programEditMode.deactivate();
                        $timeout(function () {
                            vm.gridApi.selection.selectRow(data);
                        });
                    })
                }
            };

            vm.programPricesMode = {
                isActiveMode: false,
                isEditPrice: false,
                activate: function () {
                    vm.programPricesMode.isActiveMode = true;
                },
                deactivate: function () {
                    vm.programPricesMode.isActiveMode = false;
                },
                toggleActivate: function () {
                    vm.programPricesMode.isActiveMode
                        ? vm.programPricesMode.deactivate()
                        : vm.programPricesMode.activate();
                },
                initProgramPricesGrid: function (row) {
                    vm.pricesGridOptions = {
                        enableColumnMenus: false,
                        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                        columnDefs: [
                            {
                                name: 'duration',
                                displayName: 'Продолж. (мин)',
                                headerCellClass: 'header-style',
                                width: 120,
                                enableCellEdit: true
                            },
                            {
                                name: 'price',
                                displayName: 'Стоимость (руб.)',
                                headerCellClass: 'header-style',
                                enableSorting: false,
                                width: 120,
                                enableCellEdit: true
                            },
                            {
                                name: 'executor_rate',
                                displayName: 'Ставка исполнителя (руб.)',
                                headerCellClass: 'header-style',
                                enableSorting: false,
                                width: 117,
                                enableCellEdit: true
                            },
                            {
                                name: 'row-control',
                                displayName: '',
                                enableSorting: false,
                                cellClass: 'ctrl-btns-wrapper',
                                cellTemplate: 'price-row-ctrl-btns-template.html'
                            }
                        ]
                    };

                    vm.pricesGridOptions.onRegisterApi = function (gridApi) {
                        $scope.gridApi = gridApi;
                        gridApi.rowEdit.on.saveRow($scope, vm.programPricesMode.saveRow);
                    };

                    if (row.entity.id !== undefined) {
                        ProgramService.getProgramPrices(row.entity.id).then(function (data) {
                            vm.pricesGridOptions.data = data;
                        })
                    }
                    else {
                        vm.pricesGridOptions.data = []
                    }
                },
                addPriceRow: function () {
                    vm.pricesGridOptions.data.unshift({
                        duration: 0,
                        price: 0
                    });
                },
                saveRow: function (rowEntity) {
                    var duration = rowEntity.duration,
                        price = rowEntity.price,
                        programId = vm.program.selectedProgram.id;

                    var promise = $q.defer();

                    $scope.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);

                    if (duration && price && programId) {
                        var executorRate = !!rowEntity.executor_rate ? rowEntity.executor_rate : 0;
                        ProgramService.saveProgramPrice({
                            duration: duration,
                            price: price,
                            program: programId,
                            executor_rate: executorRate
                        }).then(function success() {
                            promise.resolve()
                        }, function error(data) {
                            promise.reject(data)
                        });
                    }
                    else {
                        promise.reject()
                    }

                },
                deleteProgramPrice: function (delRow) {

                    function _deletePriceRow() {
                        angular.forEach(vm.pricesGridOptions.data, function (row, idx) {
                            if (angular.equals(delRow.entity, row)) {
                                vm.pricesGridOptions.data.splice(idx, 1);
                                $scope.gridApi.grid.refresh();
                            }
                        })
                    }

                    ConfirmationDialog.openDialog('Вы действительно хотите удалить запись?').then(function success() {
                        if (delRow.entity.id !== undefined) {
                            var programId = vm.program.selectedProgram.id;
                            ProgramService.deleteProgramPrice(programId, delRow.entity.id).then(function () {
                                _deletePriceRow();
                            })
                        }
                        else {
                            _deletePriceRow();
                        }
                    })
                }
            };

            vm.filterSearchWord = '';

            vm.filter = function () {
                vm.gridApi.grid.refresh();
            };

            vm.singleFilter = function (renderableRows) {
                var matcher = new RegExp(vm.filterSearchWord);
                renderableRows.forEach(function (row) {
                    var match = false;
                    ['title'].forEach(function (field) {
                        if (row.entity[field].match(matcher)) {
                            match = true;
                        }
                    });
                    if (!match) {
                        row.visible = false;
                    }
                });
                return renderableRows;
            };

            ProgramService.getPrograms().then(function (data) {
                vm.gridOptions.data = data;

                $timeout(function () {
                    vm.loadingEvent = false;
                }, 100);

                $timeout(function () {
                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                }, 200);
            })
        }])
    .controller('AdditionalServicesHandbookCtrl', [
        '$q', '$scope', '$timeout', '$interval', 'ConfirmationDialog', 'UserService', 'AdditionalServiceFactory',
        'AdditionalServiceForm', 'uiGridConstants',

        function ($q, $scope, $timeout, $interval, ConfirmationDialog, UserService, AdditionalService,
                  AdditionalServiceForm, uiGridConstants) {

            var vm = this;

            vm.loadingEvent = true;

            vm.gridOptions = {
                enablePaginationControls: false,
                paginationPageSize: 12,
                enableColumnMenus: false,
                enableRowSelection: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                modifierKeysToMultiSelect: false,
                noUnselect: true,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                columnDefs: [
                    {
                        name: 'id',
                        displayName: 'ID',
                        width: 45,
                        enableSorting: false
                    },
                    {
                        name: 'title',
                        displayName: 'Название',
                        width: 274
                    },
                    {
                        name: 'price',
                        displayName: 'Цена',
                        width: 100
                    },
                    {
                        name: 'executor_rate',
                        displayName: 'Ставка',
                        width: 100
                    },
                    {
                        name: 'row-control',
                        displayName: '',
                        enableSorting: false,
                        enableCellEdit: false,
                        cellClass: 'ctrl-btns-wrapper',
                        cellTemplate: 'additional-services-row-ctrl-btns-template.html'
                    }
                ]
            };

            vm.gridOptions.onRegisterApi = function (gridApi) {
                vm.gridApi = gridApi;
                vm.gridApi.grid.registerRowsProcessor(vm.singleFilter, 200);

                UserService.reloadExecutors().then(function () {
                    vm.gridApi.selection.on.rowSelectionChanged(null, function (row) {
                        $timeout(function () {
                            vm.additServ.selectedAdditServ = angular.copy(row.entity);

                            if (!vm.detailsMode.additServDetails || row.entity.id === undefined) {
                                vm.detailsMode.setAdditServDetailsMode();
                            }

                            vm.additServEditMode.deactivate();

                            vm.formOptions = {
                                formState: {
                                    possibleExecutors: row.entity.possible_executors
                                }
                            };

                            if (vm.form !== undefined) {
                                vm.form.$setPristine();
                                vm.form.$setUntouched();
                            }

                            vm.formFields = vm.additServEditMode.getFormFields();
                            vm.originalFormFields = angular.copy(vm.formFields);

                            vm.additServ.isNewAdditServ = !row.entity.id;
                        });
                    });
                });
            };

            vm.detailsMode = {
                additServDetails: false,

                setAdditServDetailsMode: function () {
                    vm.detailsMode.additServDetails = true;
                }
            };

            vm.additServ = {
                selectedAdditServ: null,
                isNewAdditServ: false,
                addNewRow: function () {
                    vm.gridOptions.data.unshift({
                        title: 'Новая программа'
                    });

                    $timeout(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    });

                    $timeout(function () {
                        vm.additServEditMode.activate();
                    }, 200);
                },
                updateRow: function (data) {
                    var firstRow = vm.gridOptions.data.length > 0 ? vm.gridOptions.data[0] : null;
                    if (firstRow && !firstRow.id) {
                        vm.gridOptions.data.shift();
                        vm.gridOptions.data.push(data);
                        vm.gridApi.grid.refresh();
                    }
                    else {
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(data.id, row.id)) {
                                vm.gridOptions.data[idx] = data;
                                vm.gridApi.grid.refresh();
                            }
                        })
                    }
                },
                deleteAdditServ: function (delRow) {
                    if (delRow.entity.id) {
                        ConfirmationDialog.openDialog('Вы действительно хотите удалить программу?').then(function success() {
                            AdditionalService.deleteAdditionalService(delRow.entity.id).then(function () {
                                angular.forEach(vm.gridOptions.data, function (row, idx) {
                                    if (angular.equals(delRow.entity.id, row.id)) {
                                        vm.gridOptions.data.splice(idx, 1);
                                        vm.gridApi.grid.refresh();

                                        if (vm.gridOptions.data.length > 0) {
                                            vm.gridApi.selection.selectRow(vm.gridOptions.data[idx - 1]);
                                        }
                                    }
                                })
                            })
                        });
                    }
                    else {
                        vm.additServEditMode.deleteNewAdditServ();
                    }
                }
            };

            vm.additServEditMode = {
                isActiveMode: false,
                activate: function () {
                    vm.additServEditMode.isActiveMode = true;
                    vm.formFields = vm.additServEditMode.getFormFields()
                },
                deactivate: function () {
                    vm.additServEditMode.isActiveMode = false;
                    vm.formFields = vm.additServEditMode.getFormFields()
                },
                toggleActivate: function () {
                    vm.additServEditMode.isActiveMode
                        ? vm.additServEditMode.deactivate()
                        : vm.additServEditMode.activate();
                },
                getFormFields: function () {
                    return AdditionalServiceForm.getFieldsOptions(vm.additServEditMode.isActiveMode, vm.additServ.selectedAdditServ);
                },
                cancelEdit: function () {
                    var row = vm.gridApi.selection.getSelectedRows()[0];
                    vm.additServ.selectedAdditServ = angular.copy(row);
                    vm.form.$setPristine();
                    vm.form.$setUntouched();
                    vm.additServEditMode.deactivate();
                },
                deleteNewAdditServ: function () {
                    var gridRow = vm.gridApi.selection.getSelectedRows()[0];
                    angular.forEach(vm.gridOptions.data, function (row, idx) {
                        if (angular.equals(gridRow, row)) {
                            vm.gridOptions.data.splice(idx, 1);
                            $timeout(function () {
                                vm.gridApi.grid.refresh();
                                if (vm.gridOptions.data.length > 0) {
                                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                                }
                            })
                        }
                    })
                },
                saveAdditServ: function () {
                    AdditionalService.saveAdditionalService(
                        AdditionalServiceForm.convertDataToModel(vm.additServ.selectedAdditServ))

                        .then(function (data) {
                            vm.additServ.updateRow(data);
                            vm.additServEditMode.deactivate();
                            $timeout(function () {
                                vm.gridApi.selection.selectRow(data);
                            });
                        })
                }
            };

            vm.filterSearchWord = '';

            vm.filter = function () {
                vm.gridApi.grid.refresh();
            };

            vm.singleFilter = function (renderableRows) {
                var matcher = new RegExp(vm.filterSearchWord);
                renderableRows.forEach(function (row) {
                    var match = false;
                    ['title'].forEach(function (field) {
                        if (row.entity[field].match(matcher)) {
                            match = true;
                        }
                    });
                    if (!match) {
                        row.visible = false;
                    }
                });
                return renderableRows;
            };

            AdditionalService.getAllAdditionalServices().then(function (data) {
                vm.gridOptions.data = data;

                $timeout(function () {
                    vm.loadingEvent = false;
                });

                $timeout(function () {
                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                }, 200);
            })
        }])
    .controller('UsersManagerCtrl', [

        '$q', '$controller', '$scope', '$timeout', '$interval', 'ConfirmationDialog', 'Auth', 'UserService', 'UserProfileForm',
        'uiGridConstants', 'ExecutorDayOffForm', 'ExecutorDayOffService',

        function ($q, $controller, $scope, $timeout, $interval, ConfirmationDialog, Auth, UserService, UserProfileForm,
                  uiGridConstants, ExecutorDayOffForm, ExecutorDayOffService) {

            var vm = this;

            vm.loadingEvent = true;

            vm.auth = {
                hasPermission: function (permission) {
                    return Auth.hasPermission(permission)
                }
            };

            vm.gridOptions = {
                enablePaginationControls: false,
                paginationPageSize: 12,
                enableColumnMenus: false,
                enableRowSelection: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                modifierKeysToMultiSelect: false,
                noUnselect: true,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                columnDefs: [
                    {
                        name: 'id',
                        displayName: 'ID',
                        width: 45,
                        enableSorting: false
                    },
                    {
                        name: 'full_name',
                        displayName: 'Имя',
                        width: 290
                    },
                    {
                        name: 'role',
                        displayName: 'Должность'
                    }
                ]
            };

            if (vm.auth.hasPermission('change_userprofile')) {
                vm.gridOptions.columnDefs.push(
                    {
                        name: 'row-control',
                        displayName: '',
                        enableSorting: false,
                        enableCellEdit: false,
                        cellClass: 'ctrl-btns-wrapper',
                        cellTemplate: 'user-profile-row-ctrl-btns-template.html'
                    }
                );

                vm.gridOptions.columnDefs[2].width = 150;
            }

            vm.gridOptions.onRegisterApi = function (gridApi) {
                vm.gridApi = gridApi;
                vm.gridApi.grid.registerRowsProcessor(vm.singleFilter, 200);

                vm.gridApi.selection.on.rowSelectionChanged(null, function (row) {
                    $timeout(function () {
                        vm.userProfile.selectedUserProfile = angular.copy(row.entity);

                        if (!vm.detailsMode.userProfileDetails || row.entity.id === undefined) {
                            vm.addDayOffMode.deactivate();
                            vm.detailsMode.setUserProfileDetailsMode();
                        }

                        vm.userProfileEditMode.deactivate();

                        vm.formOptions = {};

                        if (vm.form !== undefined) {
                            vm.form.$setPristine();
                            vm.form.$setUntouched();
                        }

                        vm.formFields = vm.userProfileEditMode.getFormFields();
                        vm.originalFormFields = angular.copy(vm.formFields);

                        vm.userProfile.isNewUserProfile = !row.entity.id;
                    });
                });
            };

            vm.detailsMode = {
                userProfileDetails: false,

                setUserProfileDetailsMode: function () {
                    vm.detailsMode.userProfileDetails = true;
                }
            };

            vm.addDayOffMode = {
                isActive: false,

                activate: function () {
                    vm.addDayOffMode.model = {
                        user_profile: vm.userProfile.selectedUserProfile.id
                    };
                    vm.addDayOffMode.formFields = ExecutorDayOffForm.getFieldsOptions();
                    vm.addDayOffMode.isActive = true;
                },

                deactivate: function () {
                    vm.addDayOffMode.isActive = false;
                },

                onSubmit: function () {
                    ExecutorDayOffService.saveDayOff(ExecutorDayOffForm.convertDataToModel(vm.addDayOffMode.model)).then(function () {
                        vm.userProfile.setMode('detailsMode');
                    })
                }
            };

            vm.userProfile = {
                selectedUserProfile: null,
                isNewUserProfile: false,
                isExecutorsHandbook: true,
                setMode: function (mode) {
                    if (mode === 'detailsMode') {
                        if (vm.detailsMode.userProfileDetails) {
                            vm.userProfileEditMode.activate();
                        }
                        else {
                            vm.detailsMode.setUserProfileDetailsMode();
                        }
                        vm.addDayOffMode.deactivate();
                    }
                    else if (mode === 'addDayOffMode') {
                        vm.userProfileEditMode.deactivate();
                        vm.detailsMode.userProfileDetails = false;
                        vm.addDayOffMode.activate();
                    }
                },
                addNewRow: function () {
                    vm.gridOptions.data.unshift({
                        full_name: 'Новый пользователь'
                    });

                    $timeout(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    });

                    $timeout(function () {
                        vm.userProfileEditMode.activate();
                    }, 200);
                },
                updateRow: function (data) {
                    var firstRow = vm.gridOptions.data.length > 0 ? vm.gridOptions.data[0] : null;
                    if (firstRow && !firstRow.id) {
                        vm.gridOptions.data.shift();
                        vm.gridOptions.data.push(data);
                        vm.gridApi.grid.refresh();
                    }
                    else {
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(data.id, row.id)) {
                                vm.gridOptions.data[idx] = data;
                                vm.gridApi.grid.refresh();
                            }
                        })
                    }
                },
                deleteUserProfile: function (delRow) {
                    if (delRow.entity.id) {
                        ConfirmationDialog.openDialog('Вы действительно хотите удалить профиль?').then(function success() {
                            UserService.deleteUserProfile(delRow.entity.id).then(function () {
                                angular.forEach(vm.gridOptions.data, function (row, idx) {
                                    if (angular.equals(delRow.entity.id, row.id)) {
                                        vm.gridOptions.data.splice(idx, 1);
                                        vm.gridApi.grid.refresh();

                                        if (vm.gridOptions.data.length > 0) {
                                            vm.gridApi.selection.selectRow(vm.gridOptions.data[idx - 1]);
                                        }
                                    }
                                })
                            })
                        });
                    }
                    else {
                        vm.userProfileEditMode.deleteNewUserProfile();
                    }
                }
            };

            vm.userProfileEditMode = {
                isActiveMode: false,
                activate: function () {
                    vm.userProfileEditMode.isActiveMode = true;
                    vm.formFields = vm.userProfileEditMode.getFormFields()
                },
                deactivate: function () {
                    vm.userProfileEditMode.isActiveMode = false;
                    vm.formFields = vm.userProfileEditMode.getFormFields()
                },
                toggleActivate: function () {
                    vm.userProfileEditMode.isActiveMode
                        ? vm.userProfileEditMode.deactivate()
                        : vm.userProfileEditMode.activate();
                },
                getFormFields: function () {
                    return UserProfileForm.getFieldsOptions(!vm.userProfileEditMode.isActiveMode, vm.userProfile.selectedUserProfile);
                },
                cancelEdit: function () {
                    var row = vm.gridApi.selection.getSelectedRows()[0];
                    vm.userProfile.selectedUserProfile = angular.copy(row);
                    vm.form.$setPristine();
                    vm.form.$setUntouched();
                    vm.userProfileEditMode.deactivate();
                },
                deleteNewUserProfile: function () {
                    var gridRow = vm.gridApi.selection.getSelectedRows()[0];
                    angular.forEach(vm.gridOptions.data, function (row, idx) {
                        if (angular.equals(gridRow, row)) {
                            vm.gridOptions.data.splice(idx, 1);
                            $timeout(function () {
                                vm.gridApi.grid.refresh();
                                if (vm.gridOptions.data.length > 0) {
                                    vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                                }
                            })
                        }
                    })
                },
                saveUserProfile: function () {
                    UserService.saveUserProfile(
                        UserProfileForm.convertDataToModel(vm.userProfile.selectedUserProfile))

                        .then(function (data) {
                            vm.userProfile.updateRow(data);
                            vm.userProfileEditMode.deactivate();
                            $timeout(function () {
                                vm.gridApi.selection.selectRow(data);
                            });
                        })
                }
            };

            vm.filterSearchWord = '';

            vm.filter = function () {
                vm.gridApi.grid.refresh();
            };

            vm.singleFilter = function (renderableRows) {
                var matcher = new RegExp(vm.filterSearchWord);
                renderableRows.forEach(function (row) {
                    var match = false;
                    ['full_name'].forEach(function (field) {
                        if (row.entity[field].match(matcher)) {
                            match = true;
                        }
                    });
                    if (!match) {
                        row.visible = false;
                    }
                });
                return renderableRows;
            };

            if (vm.auth.hasPermission('see_all_profiles')) {
                UserService.reloadAllProfiles().then(function (data) {
                    vm.gridOptions.data = UserService.getAllUserProfiles();

                    $timeout(function () {
                        vm.loadingEvent = false;
                    });

                    $interval(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    }, 0, 1);
                })
            }
            else {
                UserService.reloadExecutors().then(function (data) {
                    vm.gridOptions.data = UserService.getExecutors();

                    $timeout(function () {
                        vm.loadingEvent = false;
                    });

                    $interval(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    }, 0, 1);
                })
            }
        }])
    .controller('DiscountsHandbookCtrl', [
        '$q', '$scope', '$timeout', '$interval', 'ConfirmationDialog', 'DiscountService', 'uiGridConstants',
        function ($q, $scope, $timeout, $interval, ConfirmationDialog, DiscountService, uiGridConstants) {

            var vm = this;

            vm.loadingEvent = true;

            vm.gridOptions = {
                enablePaginationControls: false,
                paginationPageSize: 6,
                enableColumnMenus: false,
                enableRowSelection: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                modifierKeysToMultiSelect: false,
                noUnselect: true,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                columnDefs: [
                    {
                        name: 'name',
                        displayName: 'Название скидки',
                        width: 462,
                        enableCellEdit: true
                    },
                    {
                        name: 'value',
                        displayName: 'Процент',
                        width: 100,
                        enableCellEdit: true
                    },
                    {
                        name: 'row-control',
                        displayName: '',
                        enableSorting: false,
                        enableCellEdit: false,
                        cellClass: 'ctrl-btns-wrapper',
                        cellTemplate: 'discount-row-ctrl-btns-template.html'
                    }
                ]
            };

            vm.gridOptions.onRegisterApi = function (gridApi) {
                vm.gridApi = gridApi;
                vm.gridApi.grid.registerRowsProcessor(vm.singleFilter, 200);

                vm.gridApi.rowEdit.on.saveRow($scope, vm.discount.saveRow);

                vm.gridApi.selection.on.rowSelectionChanged(null, function (row) {
                    $timeout(function () {
                        vm.discount.selectedDiscount = angular.copy(row.entity);
                        vm.discount.isNewDiscount = !row.entity.id;
                    });
                });
            };

            vm.discount = {
                selectedDiscount: null,
                isNewDiscount: false,
                addNewRow: function () {
                    vm.gridOptions.data.unshift({
                        name: 'Новая скидка'
                    });

                    $timeout(function () {
                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                    });
                },
                updateRow: function (data) {
                    var firstRow = vm.gridOptions.data.length > 0 ? vm.gridOptions.data[0] : null;
                    if (firstRow && !firstRow.id) {
                        vm.gridOptions.data.shift();
                        vm.gridOptions.data.push(data);
                        vm.gridApi.grid.refresh();
                    }
                    else {
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(data.id, row.id)) {
                                vm.gridOptions.data[idx] = data;
                                vm.gridApi.grid.refresh();
                            }
                        })
                    }
                },
                saveRow: function (rowEntity) {
                    var name = rowEntity.name,
                        value = rowEntity.value,
                        id = rowEntity.id;

                    var promise = $q.defer();

                    vm.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);

                    if (name && value) {
                        DiscountService.saveDiscount({
                            id: id,
                            name: name,
                            value: value
                        }).then(function success() {
                            promise.resolve()
                        }, function error(data) {
                            promise.reject(data)
                        });
                    }
                    else {
                        promise.reject()
                    }
                },
                deleteDiscount: function (delRow) {
                    if (delRow.entity.id) {
                        ConfirmationDialog.openDialog('Вы действительно хотите удалить запись?').then(function success() {
                            DiscountService.deleteDiscount(delRow.entity.id).then(function () {
                                angular.forEach(vm.gridOptions.data, function (row, idx) {
                                    if (angular.equals(delRow.entity.id, row.id)) {
                                        vm.gridOptions.data.splice(idx, 1);
                                        vm.gridApi.grid.refresh();

                                        if (vm.gridOptions.data.length > 0) {
                                            vm.gridApi.selection.selectRow(vm.gridOptions.data[idx - 1]);
                                        }
                                    }
                                })
                            })
                        });
                    }
                    else {
                        var gridRow = vm.gridApi.selection.getSelectedRows()[0];
                        angular.forEach(vm.gridOptions.data, function (row, idx) {
                            if (angular.equals(gridRow, row)) {
                                vm.gridOptions.data.splice(idx, 1);
                                $timeout(function () {
                                    vm.gridApi.grid.refresh();
                                    if (vm.gridOptions.data.length > 0) {
                                        vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                                    }
                                })
                            }
                        })
                    }
                }
            };

            vm.filterSearchWord = '';

            vm.filter = function () {
                vm.gridApi.grid.refresh();
            };

            vm.singleFilter = function (renderableRows) {
                var matcher = new RegExp(vm.filterSearchWord);
                renderableRows.forEach(function (row) {
                    var match = false;
                    ['name'].forEach(function (field) {
                        if (row.entity[field].match(matcher)) {
                            match = true;
                        }
                    });
                    if (!match) {
                        row.visible = false;
                    }
                });
                return renderableRows;
            };

            DiscountService.reloadDiscounts().then(function (data) {
                vm.gridOptions.data = DiscountService.getDiscounts();

                $timeout(function () {
                    vm.loadingEvent = false;
                }, 500);

                $interval(function () {
                    if (vm.gridOptions.data.length > 0) vm.gridApi.selection.selectRow(vm.gridOptions.data[0]);
                }, 0, 1);
            })
        }])
    .controller('SmsDeliveryCtrl', [
        '$scope', '$timeout', 'SmsDeliveryService', 'OrderService',
        function ($scope, $timeout, SmsDeliveryService, OrderService) {

            var vm = this;
            vm.event = {
                list: [],
                checked: {
                    id: null,
                    name: '',
                    type: 'before', // before | after
                    days_num: 1,
                    template: ''
                },
                isEventsLoaded: false,
                onNewEventCreate: onNewEventCreate,
                onSelect: onEventSelect,
                onSave: onEventSave,
                onDelete: onEventDelete
            };
            vm.smsMessage = {
                list: [],
                onDisableClick: onDisableMessageClick
            };
            vm.dateRange = {
                dateStart: {
                    val: null,
                    isOpen: false,
                    onDateClick: function () {
                        vm.dateRange.dateEnd.isOpen = false;
                        vm.dateRange.dateStart.isOpen = !vm.dateRange.dateStart.isOpen;
                    }
                },
                dateEnd: {
                    val: null,
                    isOpen: false,
                    onDateClick: function () {
                        vm.dateRange.dateStart.isOpen = false;
                        vm.dateRange.dateEnd.isOpen = !vm.dateRange.dateEnd.isOpen;
                    }
                }
            };
            vm.foundClientList = [];
            vm.msgTextInManualMode = '';
            vm.onScheduledModeSelect = onScheduledModeSelect;
            vm.dateFilterApply = dateFilterApply;
            vm.sendMessagesImScheduledMode = sendMessagesImScheduledMode;
            vm.sendMessagesImManualMode = sendMessagesImManualMode;

            function onScheduledModeSelect() {
                SmsDeliveryService.getDeliveryEvents().then(function (events) {
                    vm.event.list = events;
                    vm.event.isEventsLoaded = true;
                });

                SmsDeliveryService.getMessagesForDeliver().then(function (messages) {
                    vm.smsMessage.list = [];
                    angular.forEach(messages, function (msg) {
                        msg.disabled = false;
                        vm.smsMessage.list.push(msg);
                    });
                });
            }

            function onNewEventCreate() {
                var hasNewEvent = vm.event.list.some(function (e) {
                   return e.id === null;
                });
                if (!hasNewEvent) {
                    var newEvent = {
                        id: null,
                        name: 'Новое имя события',
                        type: 'before',
                        days_num: 1,
                        template: ''
                    };
                    vm.event.list.unshift(newEvent);
                    vm.event.checked = newEvent;
                }
            }

            function onEventSelect(event) {
                vm.event.checked = {
                    id: event.id,
                    name: event.name,
                    type: event.type,
                    days_num: event.days_num,
                    template: event.template
                }
            }

            function onEventSave() {
                SmsDeliveryService.saveDeliverEvent(vm.event.checked).then(function (newEvent) {
                    angular.forEach(vm.event.list, function (item, idx) {
                        if (item.id === null) {
                            vm.event.list.splice(idx, 1);
                        }
                    });

                    var found = vm.event.list.some(function (item, idx) {
                        if (item.id === newEvent.id) {
                            vm.event.list[idx] = newEvent;
                            return true;
                        }
                    });

                    if (!found) {
                        vm.event.list.unshift(newEvent);
                    }
                })
            }

            function onEventDelete(event) {
                if (event.id === null) {
                    vm.event.list.some(function (item, idx) {
                        if (item.id === null) {
                            vm.event.list.splice(idx, 1);
                            return true;
                        }
                    })
                }
                else {
                    SmsDeliveryService.deleteDeliverEvent(event.id).then(function () {
                        vm.event.list.some(function (item, idx) {
                            if (item.id === event.id) {
                                vm.event.list.splice(idx, 1);
                                return true;
                            }
                        })
                    })
                }
            }

            function onDisableMessageClick(message) {
                message.disabled = !message.disabled;
            }

            function dateFilterApply(range) {
                OrderService.getClientsFromOrdersForPeriod(range).then(function (clients) {
                    vm.foundClientList = clients;
                })
            }

            function sendMessagesImManualMode() {
                var targetMsgList = [];
                angular.forEach(vm.foundClientList, function (item) {
                    targetMsgList.push({
                        client_id: parseInt(item.client.id),
                        message: vm.msgTextInManualMode
                    });
                });
                SmsDeliveryService.sendMessages(targetMsgList, 'manual').then(function (res) {
                    console.log(res);
                })
            }

            function sendMessagesImScheduledMode() {
                var targetMsgList = [];
                angular.forEach(vm.smsMessage.list, function (msg) {
                    if (!msg.disabled) {
                        targetMsgList.push({
                            client_id: msg.order.client.id,
                            message: msg.message
                        });
                    }
                });
                SmsDeliveryService.sendMessages(targetMsgList, 'scheduled').then(function (res) {
                    console.log(res);
                })
            }
        }])
    .controller('StatisticPanelCtrl', ['StatisticService', function (StatisticService) {
        var vm = this;
        vm.CURRENT_MONTH = 'current_month';
        vm.LAST_MONTH = 'last_month';
        vm.PREV_MONTH = 'prev_month';
        vm.CURRENT_YEAR = 'current_year';
        vm.CUSTOM_PERIOD = 'custom_period';
        vm.currentPeriod = {};
        vm.statistic = {};
        vm.orderSourcesStatictic = null;
        vm.isStatisticLoaded = false;

        vm.orderSourceList = ['Google', 'Yandex', 'Second', 'VK', 'Посоветовали', 'Повторный', 'Листовка', 'Рассылка',
            'Mail.ru', 'Другое', 'Не задано'];

        vm.customRange = {
            dateStart: {
                val: null,
                isOpen: false,
                onDateClick: function () {
                    vm.customRange.dateEnd.isOpen = false;
                    vm.customRange.dateStart.isOpen = !vm.customRange.dateStart.isOpen;
                }
            },
            dateEnd: {
                val: null,
                isOpen: false,
                onDateClick: function () {
                    vm.customRange.dateStart.isOpen = false;
                    vm.customRange.dateEnd.isOpen = !vm.customRange.dateEnd.isOpen;
                }
            }
        };

        vm.setPeriodRange = setPeriodRange;
        vm.setCustomPeriodRange = setCustomPeriodRange;
        vm.selectOrderSourceTab = onSelectOrderSourceTab;
        vm.getOrderStatByName = getOrderStatByName;

        function onSelectOrderSourceTab() {
            if (!vm.orderSourcesStatictic) {
                StatisticService.getOrderSourcesStatistic().then(function (stats) {
                    vm.orderSourcesStatictic = stats.sources_stats;
                })
            }
        }

        function getOrderStatByName(row, sourceName) {
            var count = 0;
            row.stats.some(function (value, index, _ary) {
                if (angular.equals(value.where_was_found, sourceName)) {
                    count = value.count;
                    return true;
                }
            });
            return count;
        }

        function setCustomPeriodRange(range) {
            vm.currentPeriod.range = range;
            setPeriodRange(vm.CUSTOM_PERIOD);
        }

        function setPeriodRange(periodName) {
            if (angular.equals(periodName, vm.CURRENT_MONTH)) {
                vm.currentPeriod = {
                    name: vm.CURRENT_MONTH,
                    range: getCurrentMonthPeriodRange()
                };
            }
            else if (angular.equals(periodName, vm.LAST_MONTH)) {
                vm.currentPeriod = {
                    name: vm.LAST_MONTH,
                    range: getLastMonthPeriodRange()
                };
            }
            else if (angular.equals(periodName, vm.PREV_MONTH)) {
                vm.currentPeriod = {
                    name: vm.PREV_MONTH,
                    range: getPreviousMonthPeriodRange()
                };
            }
            else if (angular.equals(periodName, vm.CURRENT_YEAR)) {
                vm.currentPeriod = {
                    name: vm.CURRENT_YEAR,
                    range: getCurrentYearPeriodRange()
                };
            }
            else if (angular.equals(periodName, vm.CUSTOM_PERIOD)) {
                vm.currentPeriod.name = null;
            }
            else {
                throw Error('Period name is unavailable!')
            }

            if (!!vm.currentPeriod.range) {
                StatisticService.getStatisticInfo(vm.currentPeriod.range).then(function (statistic) {
                    vm.statistic = statistic;
                    vm.isStatisticLoaded = true;
                })
            }
        }

        function getCurrentMonthPeriodRange() {
            return {
                'start': moment().startOf('month').format('YYYY-MM-DD HH:mm'),
                'end': moment().format('YYYY-MM-DD HH:mm')
            }
        }

        function getLastMonthPeriodRange() {
            return {
                'start': moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm'),
                'end': moment().format('YYYY-MM-DD HH:mm')
            }
        }

        function getPreviousMonthPeriodRange() {
            return {
                'start': moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm'),
                'end': moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm')
            }
        }

        function getCurrentYearPeriodRange() {
            return {
                'start': moment().startOf('year').format('YYYY-MM-DD HH:mm'),
                'end': moment().format('YYYY-MM-DD HH:mm')
            }
        }

        setPeriodRange(vm.CURRENT_MONTH);
    }])
    .controller('AnimatorDebtsCtrl', [
        '$rootScope', 'AnimatorDebtService', 'Auth', function ($rootScope, AnimatorDebtService, Auth) {
            var vm = this;
            vm.debtors = {};
            vm.currentDebtor = {
                name: '',
                debts: [],
                sumAllDebts: 0,
                sumAllOrdersPrices: 0,
                sumAllSalary: 0,
                monthOrdersNum: 0,
                monthSalary: 0
            };
            vm.onCheckDebtor = onCheckDebtor;
            vm.onPayDebt = onPayDebt;
            vm.debtorListIsNotEmpty = debtorListIsNotEmpty;
            vm.isManagerMode = isManagerMode;
            vm.debtorsIsLoaded = false;

            $rootScope.$watch(function () {
                return vm.currentDebtor;
            }, function () {
                var debtSum = 0;
                var orderPriceSum = 0;
                var allSalary = 0;

                angular.forEach(vm.currentDebtor.debts, function (d) {
                    debtSum += d.debt;
                    orderPriceSum += d.program_price;
                    allSalary += d.animator_salary;
                    vm.currentDebtor.monthOrdersNum = d.animator_month_salary_info.celebrations_num;
                    vm.currentDebtor.monthSalary = d.animator_month_salary_info.salary;
                });
                vm.currentDebtor.sumAllDebts = debtSum;
                vm.currentDebtor.sumAllOrdersPrices = orderPriceSum;
                vm.currentDebtor.sumAllSalary = allSalary;
            }, true);

            function onCheckDebtor(debtorName) {
                vm.currentDebtor.name = debtorName;
                vm.currentDebtor.debts = vm.debtors[debtorName];
            }

            function onPayDebt(debt) {
                AnimatorDebtService.payDebt(debt.id);
            }

            function debtorListIsNotEmpty() {
                return Object.keys(vm.debtors).length > 0;
            }

            function isManagerMode() {
                return Auth.isSuperuserOrManager();
            }

            function loadDebtors() {
                vm.debtors = {};

                var debtsPromise = Auth.isSuperuserOrManager()
                    ? AnimatorDebtService.getAllDebts()
                    : AnimatorDebtService.getMyDebts();

                debtsPromise.then(function (data) {
                    angular.forEach(data, function (debt) {
                        if (vm.debtors[debt.executor.full_name] === undefined) {
                            vm.debtors[debt.executor.full_name] = [];
                        }
                        var services = '';
                        angular.forEach(debt.order.additional_services_executors, function (item) {
                            services += (' + ' + item.service_name);
                        });
                        vm.debtors[debt.executor.full_name].push({
                            'id': debt.id,
                            'date': moment(debt.order.celebrate_date + ' ' + debt.order.celebrate_time).format('DD-MM-YYYY HH:mm'),
                            'program': debt.order.program.title + services,
                            'program_price': debt.order.total_price_with_discounts,
                            'debt': debt.debt,
                            'animator_salary': debt.animator_salary,
                            'animator_month_salary_info': debt.animator_month_salary_info,
                            'paid': debt.paid
                        });
                    });
                    if (debtorListIsNotEmpty()) {
                        var debtorName = Object.keys(vm.debtors)[0];
                        vm.onCheckDebtor(debtorName);
                    }
                    vm.debtorsIsLoaded = true;
                });
            }

            loadDebtors();
        }]);

