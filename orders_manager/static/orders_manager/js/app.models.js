angular.module('OrderManagerApp')
    .factory('OrderService', [
        '$rootScope', '$q', '$timeout', 'Restangular', function ($rootScope, $q, $timeout, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _orderService = restAngular.all('orders');
            var _loadingOrdersPromise = null;
            var _allOrders = [];

            $rootScope.$watchCollection(function () {
                return _allOrders;
            }, function (newVal, oldVal) {
                $rootScope.$broadcast('orderService:list:updated', newVal)
            });

            return {
                loadOrders: function (reloadIfExists) {

                    if (!!_loadingOrdersPromise) {
                        return _loadingOrdersPromise;
                    }

                    function _loadOrders() {
                        _loadingOrdersPromise = _orderService.getList().then(function (orders) {
                                _allOrders = orders;
                            })
                            .finally(function () {
                                _loadingOrdersPromise = null;
                            })
                    }

                    if (_allOrders.length === 0) {
                        _loadOrders();
                    }
                    else {
                        if (reloadIfExists !== undefined && reloadIfExists) {
                            _allOrders = [];
                            _loadOrders();
                        }
                        else {
                            return $q.when();
                        }
                    }

                    return _loadingOrdersPromise;
                },

                getOrder: function (id) {
                    return !!id ? _orderService.get(id) : $q.when({});
                },

                getOrders: function () {
                    return _allOrders;
                },

                createOrder: function (order) {
                    return _orderService.post(order).then(function (order) {
                        _allOrders.push(order);
                    });
                },

                updateOrder: function (order) {
                    return _orderService.post(order).then(function (data) {
                        angular.forEach(_allOrders, function (order, idx) {
                            if (data.id === order.id) {
                                _allOrders[idx] = data
                            }
                        });
                    });
                },

                saveExecutorComment: function (orderId, comment) {
                    return _orderService.all('executor_comment').post({
                        id: orderId,
                        executor_comment: comment
                    }).then(function (data) {
                        angular.forEach(_allOrders, function (order, idx) {
                            if (data.id === order.id) {
                                _allOrders[idx] = data
                            }
                        });
                    })
                },

                deleteOrder: function (order_id) {
                    var orders = angular.copy(_allOrders);
                    angular.forEach(orders, function (order, idx) {
                        if (order.id === order_id) {
                            order.remove();
                            _allOrders.splice(idx, 1)
                        }
                    });
                },

                getClientsFromOrdersForPeriod: function (dateRange) {
                    var deferred = $q.defer();
                    _orderService.getList({'date_range': dateRange}).then(function (clients) {
                        deferred.resolve(clients);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },

            }
        }
    ])
    .factory('UserService', [
        'Restangular', function (Restangular, $timeout) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _userService = restAngular.all('users');

            var _allUserProfiles = [];
            var _allExecutors = [];

            return {
                loadExecutors: function () {
                    if (_allExecutors.length > 0) {
                        return $q.when();
                    }
                    return this.reloadExecutors();
                },

                reloadAllProfiles: function () {
                    return _userService.getList().then(function (data) {
                        _allUserProfiles = data;
                    })
                },

                getAllUserProfiles: function () {
                    return _allUserProfiles;
                },

                reloadExecutors: function () {
                    return _userService.getList({'filters': {'group': 'executor'}}).then(function (data) {
                        _allExecutors = data;
                    })
                },

                getExecutors: function () {
                    return _allExecutors;
                },

                changePassword: function (pwds) {
                    return _userService.all('password').post(pwds)
                },

                saveUserProfile: function (user) {
                    return _userService.post(user)
                },

                deleteUserProfile: function (userId) {
                    return _userService.post({'mode': 'delete', 'user_id': userId})
                }
            }
        }
    ])
    .factory('ClientService', [
        '$q', 'Restangular', function ($q, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _clientService = restAngular.all('clients');

            var _allClients = [];

            return {
                loadClients: function () {
                    if (_allClients.length > 0) {
                        return $q.when();
                    }
                    return this.reloadClients();
                },

                reloadClients: function () {
                    return _clientService.getList().then(function (data) {
                        _allClients = data;
                    })
                },

                getClients: function () {
                    return _allClients;
                },

                getClient: function (id) {
                    return _clientService.get(id);
                },

                getClientChildren: function (clientId) {
                    return restAngular.one('clients', clientId).all('children').getList()
                },

                saveClient: function (client) {
                    client.phone = client.phone.toString();
                    if (client.phone_2 !== undefined && !!client.phone_2) {
                        client.phone_2 = client.phone_2.toString().addPhoneCountryCode()
                    }
                    return _clientService.post(client)
                },

                deleteClient: function (clientId) {
                    return _clientService.post({'mode': 'delete', 'client_id': clientId})
                },

                saveClientChildren: function (data) {
                    return restAngular.one('clients', data.client).post('children', data)
                },

                deleteClientChild: function (clientId, childId) {
                    return restAngular.one('clients', clientId).all('children').post({
                        'mode': 'delete',
                        'child_id': childId
                    })
                }
            }
        }
    ])
    .factory('ProgramService', [
        'Restangular', function (Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _programService = restAngular.all('programs');

            return {
                getPrograms: function () {
                    return _programService.getList();
                },

                getProgram: function (id) {
                    return _programService.get(id);
                },

                saveProgram: function (program) {
                    return _programService.post(program)
                },

                deleteProgram: function (programId) {
                    return _programService.post({'mode': 'delete', 'program_id': programId})
                },

                getProgramPrices: function (programId) {
                    return restAngular.one('programs', programId).all('prices').getList()
                },

                saveProgramPrice: function (data) {
                    return restAngular.one('programs', data.program).post('prices', data)
                },

                deleteProgramPrice: function (programId, priceId) {
                    return restAngular.one('programs', programId).all('prices').post({
                        'mode': 'delete',
                        'price_id': priceId
                    })
                }
            }
        }
    ])
    .factory('AdditionalServiceFactory', [
        'Restangular', function (Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _additionalServiceFactory = restAngular.all('additional_services');

            return {
                getAllAdditionalServices: function () {
                    return _additionalServiceFactory.getList();
                },

                saveAdditionalService: function (additional_service) {
                    return _additionalServiceFactory.post(additional_service)
                },

                deleteAdditionalService: function (additionalServiceId) {
                    return _additionalServiceFactory.post({
                        'mode': 'delete',
                        'additional_service_id': additionalServiceId
                    })
                }
            }
        }
    ])
    .factory('DiscountService', [
        'Restangular', function (Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _discountService = restAngular.all('discounts');

            var _allDiscounts = [];

            return {
                reloadDiscounts: function () {
                    return _discountService.getList().then(function (data) {
                        _allDiscounts = data;
                    })
                },

                getDiscounts: function () {
                    return _allDiscounts;
                },

                saveDiscount: function (discount) {
                    return _discountService.post(discount)
                },

                deleteDiscount: function (discountId) {
                    return _discountService.post({'mode': 'delete', 'id': discountId})
                }
            }
        }
    ])
    .factory('ExecutorDayOffService', [
        '$q', '$rootScope', 'Restangular', function ($q, $rootScope, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });

            var _dayoffService = restAngular.all('days_off');
            var _allDaysOff = [];

            $rootScope.$watchCollection(function () {
                return _allDaysOff;
            }, function (newVal) {
                $rootScope.$broadcast('ExecutorDayOffService:list:updated', newVal)
            });

            return {
                reloadDaysOff: function () {
                    return _dayoffService.getList().then(function (data) {
                        _allDaysOff = data;
                    })
                },

                getDaysOff: function () {
                    return _allDaysOff;
                },

                getDayOff: function (id) {
                    return !!id ? _allDaysOff.get(id) : $q.when({});
                },

                saveDayOff: function (dayOff) {
                    return _dayoffService.post(dayOff).then(function (item) {
                        _allDaysOff.push(item);
                    })
                },

                updateDayOff: function (dayOff) {
                    return _dayoffService.post(dayOff).then(function (data) {
                        angular.forEach(_allDaysOff, function (daysOffItem, idx) {
                            if (data.id === daysOffItem.id) {
                                _allDaysOff[idx] = data
                            }
                        });
                    });
                },

                deleteDayOff: function (dayOffId) {
                    return _dayoffService.post({'mode': 'delete', 'id': dayOffId}).then(function () {
                        angular.forEach(_allDaysOff, function (dayOff, idx) {
                            if (dayOff.id === dayOffId) {
                                _allDaysOff.splice(idx, 1)
                            }
                        });
                    })
                }
            }
        }
    ])
    .factory('AnimatorDebtService', [
        '$q', '$rootScope', 'Restangular', function ($q, $rootScope, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });
            var _animatorDebtService = restAngular.all('animator_debts');

            return {
                getAllDebts: function () {
                    return _animatorDebtService.getList();
                },
                getMyDebts: function () {
                    return _animatorDebtService.customGET('', {'filter': 'my_only'});
                },
                payDebt: function (debtId) {
                    return _animatorDebtService.post({action: 'pay_debt', debt_id: debtId});
                }
            }
        }])
    .factory('StatisticService', [
        '$q', '$rootScope', 'Restangular', function ($q, $rootScope, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });
            var _animatorDebtService = restAngular.all('statistic');

            return {
                getStatisticInfo: function (periodRange) {
                    var deferred = $q.defer();
                    _animatorDebtService.customGET('', {
                        'start': periodRange.start,
                        'end': periodRange.end
                    }).then(function (stats) {
                        deferred.resolve(stats);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                getOrderSourcesStatistic: function () {
                    var deferred = $q.defer();
                    _animatorDebtService.customGET('', {'type': 'order_sources'}).then(function (stats) {
                        deferred.resolve(stats);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                }
            }
        }])
    .factory('SmsDeliveryService', [
        '$q', '$rootScope', 'Restangular', function ($q, $rootScope, Restangular) {
            var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1/');
                RestangularConfigurer.setRequestSuffix('/');
            });
            var _smsDeliveryService = restAngular.all('sms_delivery');

            return {
                getDeliveryEvents: function () {
                    var deferred = $q.defer();
                    _smsDeliveryService.customGET('', {'target': 'events'}).then(function (events) {
                        deferred.resolve(events);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                getMessagesForDeliver: function () {
                    var deferred = $q.defer();
                    _smsDeliveryService.customGET('', {'target': 'messages'}).then(function (messages) {
                        deferred.resolve(messages);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                saveDeliverEvent: function (event) {
                    var deferred = $q.defer();
                    _smsDeliveryService.post({
                        'target': 'event',
                        'action': 'save',
                        'data': event
                    }).then(function (data) {
                        deferred.resolve(data);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                deleteDeliverEvent: function (eventId) {
                    var deferred = $q.defer();
                    _smsDeliveryService.post({
                        'target': 'event',
                        'action': 'delete',
                        'event_id': eventId
                    }).then(function () {
                        deferred.resolve();
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                sendMessages: function (messages, mode) {
                    var deferred = $q.defer();
                    _smsDeliveryService.post({
                        'action': 'send',
                        'mode': mode,
                        'messages': messages
                    }).then(function (res) {
                        deferred.resolve(res);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                getApiSettings: function () {
                    var deferred = $q.defer();
                    _smsDeliveryService.post({
                        'target': 'api_settings',
                        'action': 'get'
                    }).then(function (res) {
                        deferred.resolve(res);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                },
                saveApiSettings: function (settings) {
                    var deferred = $q.defer();
                    _smsDeliveryService.post({
                        'target': 'api_settings',
                        'action': 'save',
                        'settings': settings
                    }).then(function (res) {
                        deferred.resolve(res);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                }
            }
    }]);
