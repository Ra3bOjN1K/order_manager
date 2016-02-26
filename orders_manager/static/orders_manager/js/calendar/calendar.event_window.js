angular.module('CalendarApp')
    .controller('CalendarEventCtrl', [
        '$rootScope', '$scope', '$timeout', 'Auth', 'OrderService', 'ClientService', 'OrderForm', 'ClientForm',
        'AnimatorDebtService',
        function ($rootScope, $scope, $timeout, Auth, OrderService, ClientService, OrderForm, ClientForm,
                  AnimatorDebtService) {

            var vm = this;

            vm.loadingEvent = true;

            vm.order = {
                author: "",
                createdDate: "",
                canShowInfo: false,
                hasDebt: false,
                paidDebt: false,
                onPayDebt: onPayDebt
            };

            vm.isManagerMode = function () {
                return Auth.isSuperuserOrManager();
            };

            $rootScope.$on('OrderForm.rendered', function () {
                $timeout(function () {
                    vm.loadingEvent = false;
                }, 1000);
            });

            function onPayDebt() {
                if (vm.model.debt.id > -1) {
                    AnimatorDebtService.payDebt(vm.model.debt.id).then(function () {
                        vm.order.paidDebt = !vm.order.paidDebt;
                    })
                }
            }

            if ($scope.$parent.eventWindow.checkedDate) {
                vm.windowTitle = moment($scope.$parent.eventWindow.checkedDate).format("DD MMMM YYYY");
            }

            OrderService.loadOrders().then(function() {
                vm.readOnly = !(Auth.hasPermission('add_order') && Auth.hasPermission('change_order'));
                vm.canSaveOrder = Auth.hasPermission('add_order') || Auth.hasPermission('change_order');
                vm.canDeleteOrder = Auth.hasPermission('delete_order');
                vm.client = {};
                vm.client.model = {};
                vm.client.expandClientForm = false;

                if (!!$scope.$parent.eventWindow) {
                    OrderService.getOrder($scope.$parent.eventWindow.checkedOrderId).then(function(order) {
                        vm.model = angular.copy(order);
                        vm.model.celebrate_date = $scope.$parent.eventWindow.checkedDate;

                        if (vm.model.debt !== undefined) {
                            vm.order.hasDebt = vm.model.debt.id > -1;
                            vm.order.paidDebt = vm.model.debt.paid;
                        }

                        vm.order.author = getOrderAuthor();
                        vm.order.createdDate = getOrderCreatedDate();
                        vm.order.canShowInfo = vm.model.author !== undefined && vm.model.created !== undefined;

                        if (!!order.code) {
                            vm.windowTitle = moment($scope.$parent.eventWindow.checkedDate).format("DD MMMM YYYY");
                            vm.windowTitle += " | Код заказа: {0}".format(order.code);
                        }

                        vm.options = {
                            formState: {
                                programPrices: {
                                    list: [],
                                    oldPrice: {},
                                    newPrice: {},
                                    checkedPrice: {}
                                },
                                additionalServices: [],
                                discounts: [],
                                address: {}
                            }
                        };

                        if (vm.readOnly) {
                            vm.fields = OrderForm.getFieldsOptionsReadOnly();
                        }
                        else {
                            vm.fields = OrderForm.getFieldsOptions(false);
                        }
                        vm.originalFields = angular.copy(vm.fields);
                        vm.onOrderSubmit = onOrderSubmit;
                        vm.onOrderDelete = onOrderDelete;

                        vm.onCreateClientSubmit = onCreateClientSubmit;
                        vm.onCloseClientForm = onCloseClientForm;

                    });
                }
            });

            function getOrderAuthor() {
                if (vm.model.author !== undefined) {
                    return angular.equals(vm.model.author.role, "Администратор") ? "Администратор" : vm.model.author.full_name;
                }
                return "Unknown";
            }

            function getOrderCreatedDate() {
                return moment(vm.model.created).format("DD.MM.YYYY");
            }


            function onOrderSubmit() {
                if (vm.form.$valid) {
                    var converted_data = OrderForm.convertDataToModel(vm.model);

                    if (!!converted_data.id) {
                        OrderService.updateOrder(converted_data).then(function() {
                            $scope.eventWindow.instance.close();
                        })
                    }
                    else {
                        OrderService.createOrder(converted_data).then(function() {
                            $scope.eventWindow.instance.close();
                        }, function(error) {
                            console.log(error);
                        })
                    }
                }
            }

            function onOrderDelete() {
                OrderService.deleteOrder(vm.model.id);
                $scope.eventWindow.instance.close();
            }

            $scope.$on('onSaveCommentClick', function() {
                if(vm.model.id) {
                    OrderService.saveExecutorComment(vm.model.id, vm.model.executor_comment)
                }
            });

            $scope.$on('onCreateClientClick', function(event, currentClient) {
                vm.client.expandClientForm = true;
                vm.client.fields = ClientForm.getFieldsOptions(currentClient);
            });

            function onCloseClientForm() {
                vm.client = {};
                vm.client.model = {};
                vm.client.expandClientForm = false;
            }

            function onCreateClientSubmit() {
                if (vm.client.form.$valid) {

                    vm.client.model.mode = 'quick_create';
                    vm.client.model.celebrate_date = vm.model.celebrate_date;
                    vm.client.model.phone = vm.client.model.phone.toString().addPhoneCountryCode();
                    if (vm.client.model.phone_2 !== undefined) {
                        vm.client.model.phone_2 = vm.client.model.phone_2.toString().addPhoneCountryCode();
                    }

                    ClientService.saveClient(vm.client.model).then(function(result) {
                        angular.forEach(vm.fields, function(field) {
                            if (field.key === 'client') {
                                var client = {
                                    name: result.name,
                                    value: result.id,
                                    phone: result.phone,
                                    phone2: result.phone_2
                                };
                                ClientService.reloadClients().then(function() {
                                    var clients = ClientService.getClients();
                                    var opts = [];
                                    angular.forEach(clients, function(cl) {
                                        opts.push({
                                            name: cl.name,
                                            value: cl.id,
                                            phone: cl.phone,
                                            phone2: cl.phone_2
                                        })
                                    });
                                    field.templateOptions.options = opts;
                                    vm.model.client = client;
                                }, function(error) {
                                    console.log(error)
                                });
                            }
                        });
                        onCloseClientForm();
                    }, function(error) {
                        console.log(error);
                    });
                }
            }
        }]);
