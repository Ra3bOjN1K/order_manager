angular.module('OrderManagerApp')
    .config(['nyaBsConfigProvider', function (nyaBsConfigProvider) {
        nyaBsConfigProvider.setLocalizedText('ru-Ru', {
            //defaultNoneSelection: 'Выберите вариант из списка',
            defaultNoneSelection: '---',
            noSearchResult: 'Поиск не дал результатов.',
            numberItemSelected: 'Выбрано %d элементов.'
        });
        nyaBsConfigProvider.useLocale('ru-Ru')
    }])
    .config(function (formlyConfigProvider) {

        formlyConfigProvider.setWrapper({
            name: 'validation',
            types: ['input', 'vSelect', 'clientSelect', 'vSelectWithButton'],
            templateUrl: 'error-messages.html'
        });
    })
    .run(function (formlyConfig, formlyValidationMessages) {
        //formlyConfig.extras.errorExistsAndShouldBeVisibleExpression = 'fc.$touched || form.$submitted';
        //formlyValidationMessages.addStringMessage('required', 'This field is required');

        formlyConfig.setType({
            name: 'groupedSelect',
            templateUrl: '/static/form_field_templates/grouped_select_template.html',
            link: function (scope, element, attrs) {
                if (scope.options.templateOptions.multiple) {
                    element.find('ul.dropdown-menu').addClass('multiple-mode');
                }
                else {
                    element.find('ul.dropdown-menu').addClass('single-item-mode');
                }
            }
        });

        formlyConfig.setType({
            name: 'vSelect',
            templateUrl: '/static/form_field_templates/single_select_template.html',
            link: function (scope, element, attrs) {
                if (scope.options.templateOptions.multiple) {
                    element.find('ul.dropdown-menu').addClass('multiple-mode');
                }
                else {
                    element.find('ul.dropdown-menu').addClass('single-item-mode');
                }
            }
        });

        formlyConfig.setType({
            name: 'simpleSelect',
            templateUrl: '/static/form_field_templates/simple_select_template.html',
            link: function (scope, element, attrs) {
                element.find('ul.dropdown-menu').addClass('single-item-mode');
            }
        });

        formlyConfig.setType({
            name: 'manyToManyReadOnlyType',
            templateUrl: '/static/form_field_templates/many_to_many_values_readonly_template.html'
        });

        formlyConfig.setType({
            name: 'textareaWithButtonType',
            templateUrl: '/static/form_field_templates/textarea_with_button_template.html'
        });

        formlyConfig.setType({
            name: 'clientSelect',
            templateUrl: '/static/form_field_templates/client_select_template.html',
            link: function (scope, element, attrs) {
                element.find('ul.dropdown-menu').addClass('single-item-mode');
            }
        });

        formlyConfig.setType({
            name: 'clientReadonlyType',
            templateUrl: '/static/form_field_templates/client_readonly_input_template.html'
        });

        formlyConfig.setType({
            name: 'vSelectWithButton',
            templateUrl: '/static/form_field_templates/single_select_with_button_template.html',
            link: function (scope, element, attrs) {
                if (scope.options.templateOptions.multiple) {
                    element.find('ul.dropdown-menu').addClass('multiple-mode');
                }
                else {
                    element.find('ul.dropdown-menu').addClass('single-item-mode');
                }
            }
        });

        formlyConfig.setType({
            name: 'address',
            templateUrl: '/static/form_field_templates/address_template.html',
            wrapper: ['bootstrapLabel', 'bootstrapHasError']
        });

        //console.log(formlyConfig.getType('input'));

        //formlyConfig.setType({
        //    name: 'timePicker',
        //    templateUrl: '/static/form_field_templates/time_picker_template.html',
        //    wrapper: ['bootstrapLabel', 'bootstrapHasError']
        //});

        formlyConfig.setType({
            name: 'currencyInputType',
            templateUrl: '/static/form_field_templates/currency_input_template.html',
            wrapper: ['bootstrapLabel', 'bootstrapHasError']
        });

        formlyConfig.setType({
            name: 'phoneInputType',
            templateUrl: '/static/form_field_templates/phone_input_template.html',
            wrapper: ['bootstrapLabel', 'bootstrapHasError']
        });

        formlyConfig.setType({
            name: 'dateTimePicker',
            templateUrl: '/static/form_field_templates/datetime_picker_template.html',
            wrapper: ['bootstrapLabel', 'bootstrapHasError']
        });

        formlyConfig.setWrapper({
            name: 'loading',
            templateUrl: 'loading.html'
        });
    })
    .directive('fieldsSeparator', function ($timeout, $rootScope) {
        return {
            link: function (scope, element, attrs) {
                $rootScope.$on('OrderForm.rendered', function() {
                    $timeout(function () {
                        var fields = element.find('.formly-field');
                        fields.splice(-1, 1);
                        fields.after('<hr/>')
                    });
                });
            }
        }
    })
    .directive('optionalDirectives', [function () {
        return {
            compile: function (element, attributes) {
                return {
                    pre: function (scope, iElement, iAttributes, iController, transcludeFn) {
                        var options = scope.options.templateOptions;
                        iElement.removeAttr('optional-directives');
                        if (!!options.multiple) {
                            iAttributes['multiple'] = '';
                        }
                        if (!!options.size) {
                            iAttributes['size'] = options.size;
                        }
                    }
                }
            }
        }
    }])
    .directive('formatPrice', ['$filter', function ($filter) {
        return {
            require: '?ngModel',
            link: function (scope, elem, attrs, ctrl) {
                if (!ctrl) return;


                ctrl.$formatters.unshift(function (a) {
                    return $filter('number')(ctrl.$modelValue)
                });


                ctrl.$parsers.unshift(function (viewValue) {

                    elem.priceFormat({
                        prefix: '',
                        centsSeparator: ',',
                        thousandsSeparator: '.'
                    });

                    return elem[0].value;
                });
            }
        };
    }])
    .factory('DataFormatters', [function () {
        var formatters = {};

        formatters.dateFormatter = function (value) {
            return moment(new Date(value)).format('DD MMMM YYYYг');
        };

        formatters.dateTimeFormatter = function (value) {
            return moment(new Date(value)).format('DD-MM-YYYY HH:mm');
        };

        return formatters
    }])

    .factory('Validators', [function () {
        var validators = {};

        validators.wrongPasswordRemote = {
            expression: function (viewValue, modelValue, scope) {
                return true;
            },
            message: '"Введен не верный пароль"'
        };

        validators.required = {
            expression: function (viewValue, modelValue, scope) {
                var value = viewValue || modelValue;
                value = value === typeof string ? value.trim() : value;
                return !!value;
            },
            message: '"Это обязательное поле!"'
        };

        validators.confirmPassword = {
            expression: function (viewValue, modelValue, scope) {
                var value = modelValue || viewValue;
                return value === scope.model.newPassword;
            },
            message: '"Пароли не совпадают!"'
        };

        return validators;
    }])
    // Application forms

    .factory('OrderForm', [
        '$rootScope', '$q', '$timeout', 'Validators', 'ClientService', 'UserService', 'AdditionalServiceFactory',
        'ProgramService', 'DiscountService', 'DataFormatters',

        function ($rootScope, $q, $timeout, Validators, ClientService, UserService, AdditionalServiceFactory,
                  ProgramService, DiscountService, DataFormatters) {

            var orderForm = {};

            orderForm.getFieldsOptionsReadOnly = function () {

                return [
                    {
                        type: 'clientReadonlyType',
                        key: 'client',
                        id: 'clientId',
                        templateOptions: {
                            label: 'Клиент',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.client;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.client) {
                                ClientService.getClient($scope.model.client.id).then(function (client) {
                                    $scope.model.client = client;
                                })
                            }
                        }
                    },
                    {
                        type: 'manyToManyReadOnlyType',
                        key: 'client_children',
                        id: 'clientChildrenId',
                        templateOptions: {
                            label: 'Именинник(-и)'
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.client_children;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.client_children) {
                                var clientChildren = angular.copy($scope.model.client_children);
                                var birthdayBoys = [];

                                ClientService.getClientChildren($scope.model.client.id).then(function (children) {
                                    angular.forEach(children, function (extChild) {
                                        angular.forEach(clientChildren, function (modelChild) {
                                            if (modelChild.id === extChild.id) {
                                                birthdayBoys.push(extChild.name + ' (' + extChild.age + ')');
                                            }
                                        });
                                    });
                                }).then(function () {
                                    $scope.model.client_children = birthdayBoys;
                                })
                            }
                        }
                    },
                    {
                        type: 'input',
                        key: 'children_num',
                        id: 'childrenNumId',
                        templateOptions: {
                            label: 'Количество детей'
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.children_num;
                        }
                    },
                    {
                        type: 'input',
                        key: 'celebrate_date',
                        id: 'celebrateDateId',
                        templateOptions: {
                            label: 'Дата празника',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.model.celebrate_date = moment($scope.model.celebrate_date).format('DD-MM-YYYY')
                        }
                    },
                    {
                        type: 'input',
                        key: 'celebrate_time',
                        id: 'celebrateTimeId',
                        templateOptions: {
                            label: 'Время начала',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.model.celebrate_time = $scope.model.celebrate_time.split(':').slice(0, -1).join(':')

                        }
                    },
                    {
                        type: 'input',
                        key: 'celebrate_place',
                        id: 'celebratePlaceId',
                        templateOptions: {
                            label: 'Место проведения',
                            disabled: true
                        }
                    },
                    {
                        type: 'address',
                        key: 'address',
                        id: 'addressId',
                        templateOptions: {
                            label: 'Адрес проведения',
                            disabled: true
                        },
                        controller: function ($scope) {
                            if (!$scope.model.address) {
                                $scope.model.address = {}
                            }
                            else if (angular.isString($scope.model.address)) {
                                $scope.model.address = angular.fromJson($scope.model.address);
                            }
                        }
                    },
                    {
                        type: 'input',
                        key: 'program.title',
                        id: 'programTitleId',
                        templateOptions: {
                            id: 'programId',
                            label: 'Программа',
                            disabled: true
                        }
                    },
                    {
                        type: 'input',
                        key: 'duration',
                        id: 'durationId',
                        templateOptions: {
                            id: 'programDurationId',
                            label: 'Продолжительность программы',
                            disabled: true
                        },
                        controller: function ($scope) {
                            if ($scope.model.duration) {
                                $scope.model.duration = $scope.model.duration + ' мин.'
                            }
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'price',
                        id: 'programPriceId',
                        templateOptions: {
                            label: 'Стоимость программы',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.price;
                        }
                    },
                    {
                        type: 'manyToManyReadOnlyType',
                        key: 'program_executors',
                        id: 'programPossibleExecutorsIds',
                        templateOptions: {
                            label: 'Исполнители программы'
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.program_executors;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.program_executors) {
                                ProgramService.getProgram($scope.model.program.id).then(function (program) {

                                    var executorsIds = angular.copy($scope.model.program_executors),
                                        programExecutors = [];

                                    angular.forEach(program.possible_executors, function (executor) {
                                        angular.forEach(executorsIds, function (ex) {
                                            if (ex.id === executor.id) {
                                                programExecutors.push(executor.full_name)
                                            }
                                        });
                                    });
                                    $scope.model.program_executors = programExecutors;
                                });
                            }
                        }
                    },
                    {
                        type: 'manyToManyReadOnlyType',
                        key: 'additional_services',
                        id: 'additionalServicesIds',
                        templateOptions: {
                            label: 'Список дополнительных услуг'
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.additional_services;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.additional_services) {
                                AdditionalServiceFactory.getAllAdditionalServices().then(function (services) {

                                    $scope.formState.additionalServices = services;
                                    var additionalServ = [];

                                    angular.forEach(services, function (service) {
                                        angular.forEach($scope.model.additional_services, function (serv) {
                                            if (serv.id === service.id) {
                                                additionalServ.push(service.title)
                                            }
                                        });
                                    });

                                    $scope.model.additional_services = additionalServ;
                                })
                            }
                        }
                    },
                    {
                        type: 'manyToManyReadOnlyType',
                        key: 'services_executors',
                        id: 'servicesExecutorsIds',
                        templateOptions: {
                            label: 'Исполнители дополнительных услуг'
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.services_executors;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.services_executors) {
                                UserService.reloadExecutors().then(function () {
                                    var resultServExecutors = [];
                                    angular.forEach(UserService.getExecutors(), function (executor) {
                                        angular.forEach($scope.model.services_executors, function (serEx, idx) {
                                            if (executor.id === serEx.id) {
                                                resultServExecutors.push(executor.full_name)
                                            }
                                        })
                                    });
                                    $scope.model.services_executors = resultServExecutors;
                                });
                            }
                        }
                    },
                    {
                        type: 'textarea',
                        key: 'details',
                        id: 'orderDetailsId',
                        templateOptions: {
                            label: 'Дополнительная информация',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.details;
                        }
                    },
                    {
                        type: 'textareaWithButtonType',
                        key: 'executor_comment',
                        id: 'executorCommentId',
                        defaultValue: '',
                        templateOptions: {
                            label: 'Комментарий исполнителя',
                            btnName: 'Сохранить'
                        },
                        controller: function ($scope) {
                            $scope.onButtonClick = function () {
                                $scope.$emit('onSaveCommentClick');
                            }
                        },
                        link: function (scope, elem, attrs, ctrl) {
                            if (!scope.model.client && !scope.model.total_price) {
                                $rootScope.$broadcast('OrderForm.rendered');
                            }
                        }
                    },
                    {
                        type: 'input',
                        key: 'discount.name',
                        id: 'discountId',
                        defaultValue: '',
                        templateOptions: {
                            label: 'Скидка',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.discount;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.discount) {
                                DiscountService.reloadDiscounts().then(function () {
                                    $scope.formState.discounts = DiscountService.getDiscounts();

                                    var origDiscount = {};

                                    $timeout(function () {
                                        var opts = [];
                                        angular.forEach(DiscountService.getDiscounts(), function (discount) {
                                            var item = {
                                                name: discount.name,
                                                value: discount.id
                                            };

                                            if (($scope.model.discount !== undefined) && (item.value === $scope.model.discount.id)) {
                                                origDiscount = item;
                                            }

                                            opts.push(item);
                                        });

                                        $scope.to.options = opts;
                                    }, 500).then(function () {
                                        $scope.model.discount = origDiscount;
                                    })
                                });
                            }
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price',
                        id: 'totalPriceId',
                        templateOptions: {
                            label: 'Стоимость заказа',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.total_price;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.total_price) {
                                $scope.$watchGroup(['model.price', 'model.additional_services'], function (newValues) {
                                    var programPrice = newValues[0];
                                    var sumServicesPrices = 0;
                                    angular.forEach($scope.formState.additionalServices, function (origService) {
                                        angular.forEach($scope.model.additional_services, function (modelService) {
                                            if (origService.id === modelService.value) {
                                                sumServicesPrices += origService.price;
                                            }
                                        })
                                    });
                                    var price = programPrice + sumServicesPrices;
                                    $scope.model.total_price = Math.round(price / 100) * 100;
                                });
                            }
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price_with_discounts',
                        id: 'totalPriceWithDiscountId',
                        templateOptions: {
                            label: 'Стоимость заказа с учетом скидки',
                            disabled: true
                        },
                        hideExpression: function($viewValue, $modelValue, scope) {
                            return !scope.model.total_price_with_discounts;
                        },
                        controller: function ($scope) {
                            if (!!$scope.model.total_price_with_discounts) {
                                $scope.$watchGroup(['model.price', 'model.additional_services', 'model.discount'], function (newValues) {
                                    var programPrice = newValues[0];
                                    var discountPercent = 0;
                                    var sumServicesPrices = 0;

                                    if ($scope.model.discount !== undefined) {
                                        angular.forEach($scope.formState.discounts, function (origDiscount) {
                                            if (origDiscount.id === $scope.model.discount.value) {
                                                discountPercent = origDiscount.value;
                                            }
                                        });
                                    }

                                    angular.forEach($scope.formState.additionalServices, function (origService) {
                                        angular.forEach($scope.model.additional_services, function (modelService) {
                                            if (origService.id === modelService.value) {
                                                sumServicesPrices += origService.price;
                                            }
                                        })
                                    });
                                    var programPriceWithDiscount = programPrice - (programPrice * (discountPercent / 100));
                                    var price = programPriceWithDiscount + sumServicesPrices;
                                    $scope.model.total_price_with_discounts = Math.round(price / 100) * 100;
                                });
                            }
                        },
                        link: function (scope, elem, attrs, ctrl) {
                            $rootScope.$broadcast('OrderForm.rendered');
                        }
                    }
                ];
            };

            orderForm.getFieldsOptions = function (needs_meta) {

                return [
                    {
                        type: 'input',
                        key: 'id',
                        templateOptions: {
                            label: 'ID',
                            disabled: true
                        },
                        hideExpression: '!needs_meta'
                    },
                    {
                        type: 'input',
                        key: 'code',
                        templateOptions: {
                            label: 'Код',
                            disabled: true,
                            hidden: !needs_meta
                        },
                        hideExpression: '!needs_meta'
                    },
                    {
                        type: 'input',
                        key: 'created',
                        templateOptions: {
                            label: 'Дата создания',
                            disabled: true
                        },
                        hideExpression: '!needs_meta',
                        formatters: [DataFormatters.dateTimeFormatter]
                    },
                    {
                        type: 'input',
                        key: 'author.full_name',
                        templateOptions: {
                            label: 'Автор',
                            disabled: true
                        },
                        hideExpression: '!needs_meta'
                    },
                    {
                        type: 'clientSelect',
                        key: 'client',
                        //wrapper: 'loading',
                        templateOptions: {
                            id: 'clientId',
                            label: 'Клиент',
                            size: 6,
                            options: [],
                            btnName: 'Создать',
                            required: true
                        },
                        validators: {
                            'notDefault': {
                                expression: function (viewValue, modelView) {
                                    var value = viewValue || modelView;
                                    if (value !== undefined) {
                                        return value.name !== '---'
                                    }
                                    return false
                                },
                                message: '"Выберите вариант из списка!"'
                            }
                        },
                        controller: function ($scope) {
                            ClientService.loadClients().then(function () {

                                var clients = ClientService.getClients();
                                var initial_client = {};

                                $timeout(function () {
                                    var opts = [{name: '---', value: 0}];
                                    angular.forEach(clients, function (client) {

                                        var item = {
                                            name: client.name,
                                            phone: client.phone,
                                            value: client.id
                                        };

                                        if (($scope.model.client !== undefined) && ($scope.model.client.id === item.value)) {
                                            initial_client = item;
                                        }

                                        opts.push(item);
                                    });
                                    $scope.to.options = opts;
                                }).then(function () {
                                    if (!initial_client.id && !!$scope.model.client) {
                                        ClientService.getClient($scope.model.client.id).then(function (client) {
                                            var item = {
                                                name: client.name,
                                                phone: client.phone,
                                                value: client.id
                                            };
                                            var hasItem = false;
                                            angular.forEach($scope.to.options, function (opt) {
                                                if (opt.value === item.value) {
                                                    hasItem = true;
                                                }
                                            });
                                            if (!hasItem) {
                                                $scope.to.options.push(item);
                                            }
                                            $scope.model.client = item;
                                        })
                                    }
                                    else {
                                        $scope.model.client = initial_client;
                                    }
                                });
                            });

                            $scope.onButtonClick = function () {
                                $scope.$emit('onCreateClientClick');
                            }
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'client_children',
                        templateOptions: {
                            id: 'clientChildrenId',
                            label: 'Именинник(-и)',
                            size: 6,
                            options: [],
                            multiple: true,
                            required: true
                        },
                        validators: {
                            required: Validators.required,
                            'notDefault': {
                                expression: function (viewValue, modelView) {
                                    var value = viewValue;
                                    if (value !== undefined) {
                                        return value.name !== '---'
                                    }
                                    return false
                                },
                                message: '"Выберите вариант из списка!"'
                            }
                        },
                        controller: function ($scope) {
                            var birthdayBoys = [];
                            var client_children = angular.copy($scope.model.client_children);

                            $scope.$watch('model.client', function (newVal) {
                                if (!!newVal && !!newVal.value) {
                                    $timeout(function () {
                                        ClientService.getClientChildren(newVal.value).then(function (children) {
                                            var opts = [];
                                            angular.forEach(children, function (child) {
                                                var item = {
                                                    name: child.name,
                                                    value: child.id
                                                };

                                                if (client_children !== undefined) {
                                                    angular.forEach(client_children, function (child) {
                                                        var child_id = child.value === undefined ? child.id : child.value;
                                                        if (item.value === child_id) {
                                                            birthdayBoys.push(item);
                                                        }
                                                    })
                                                }

                                                opts.push(item)
                                            });
                                            $scope.to.options = opts;
                                        });
                                    }).then(function () {
                                        $scope.model.client_children = birthdayBoys;
                                    })
                                }
                                else {
                                    $scope.to.options = [];
                                }
                            })
                        }
                    },
                    {
                        type: 'input',
                        key: 'children_num',
                        defaultValue: 1,
                        templateOptions: {
                            id: 'childrenNumId',
                            label: 'Количество детей',
                            type: 'number',
                            min: 1
                        }
                    },
                    {
                        type: 'dateTimePicker',
                        key: 'celebrate_datetime',
                        templateOptions: {
                            label: 'Дата празника',
                            required: true
                        },
                        controller: function ($scope) {
                            $scope.open = {
                                isOpenDateTime: false,
                                openPicker: function () {
                                    $scope.open.isOpenDateTime = true;
                                }
                            };

                            $scope.dateOptions = {
                                showWeeks: false,
                                startingDay: 1
                            };

                            $scope.timeOptions = {
                                showMeridian: false
                            };

                            var time = moment($scope.model.celebrate_time, 'HH:mm');
                            $scope.model.celebrate_datetime = moment($scope.model.celebrate_date).set({
                                hour: time.hours(),
                                minute: time.minutes()
                            }).toDate();

                            $scope.$watch('model.celebrate_datetime', function (newVal) {
                                $scope.model.celebrate_date = moment(newVal).format('YYYY-MM-DD');
                                $scope.model.celebrate_time = moment(newVal).format('HH:mm');
                            })
                        }
                    },
                    //{
                    //    type: 'timePicker',
                    //    key: 'celebrate_time',
                    //    templateOptions: {
                    //        label: 'Время начала',
                    //        hstep: 1,
                    //        mstep: 10
                    //    },
                    //    controller: function ($scope) {
                    //        $scope.$watch('model.celebrate_time', function (newVal, oldVal) {
                    //            if (angular.isString(newVal)) {
                    //                var date = new Date();
                    //                var splitedDate = newVal.split(':');
                    //                date.setHours(splitedDate[0]);
                    //                date.setMinutes(splitedDate[1]);
                    //                $scope.model.celebrate_time = date;
                    //            }
                    //        })
                    //    }
                    //},
                    {
                        type: 'simpleSelect',
                        key: 'celebrate_place',
                        defaultValue: 'Квартира',
                        templateOptions: {
                            label: 'Место проведения',
                            options: [],
                            size: 6
                        },
                        controller: function ($scope) {
                            var items = [
                                {'name': 'Квартира', 'value': 1},
                                {'name': 'Детский сад', 'value': 2},
                                {'name': 'Кафе', 'value': 3},
                                {'name': 'Детский центр', 'value': 4},
                                {'name': 'Другое', 'value': 5}
                            ];

                            angular.forEach(items, function (item) {
                                if (angular.equals(item.name, $scope.model.celebrate_place)) {
                                    $scope.model.celebrate_place = item;
                                }
                            });
                            $scope.to.options = items;
                        }
                    },
                    {
                        type: 'address',
                        key: 'address',
                        id: 'address',
                        templateOptions: {
                            label: 'Адрес проведения'
                        },
                        controller: function ($scope) {
                            if (!$scope.model.address) {
                                $scope.model.address = {}
                            }
                            else if (angular.isString($scope.model.address)) {
                                $scope.model.address = angular.fromJson($scope.model.address);
                            }
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'program',
                        templateOptions: {
                            id: 'programId',
                            label: 'Программа',
                            size: 6,
                            options: [],
                            required: true
                        },
                        validators: {
                            'notDefault': {
                                expression: function (viewValue, modelView) {
                                    var value = viewValue || modelView;
                                    if (value !== undefined) {
                                        return value.name !== '---'
                                    }
                                    return false
                                },
                                message: '"Выберите вариант из списка!"'
                            }
                        },
                        controller: function ($scope) {
                            ProgramService.getPrograms().then(function (programs) {
                                var initial_program = $scope.model.program === undefined
                                    ? {}
                                    : {
                                    name: $scope.model.program.title,
                                    value: $scope.model.program.id
                                };

                                $timeout(function () {
                                    var opts = [{name: '---', value: 0}];
                                    angular.forEach(programs, function (program) {
                                        opts.push({
                                            name: program.title,
                                            value: program.id
                                        })
                                    });
                                    $scope.to.options = opts;
                                }).then(function () {
                                    $scope.model.program = initial_program;
                                });
                            });
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'duration',
                        templateOptions: {
                            id: 'programDurationId',
                            label: 'Продолжительность программы',
                            size: 6,
                            options: [],
                            required: true
                        },
                        controller: function ($scope) {

                            var origDurationName = angular.copy($scope.model.duration),
                                origDuration = {};

                            $scope.$watch('model.program', function (newVal) {
                                $scope.model.duration = '';
                                $scope.model.price = 0;

                                if (!!newVal && !!newVal.value) {
                                    ProgramService.getProgramPrices(newVal.value).then(function (prices) {
                                        var price_opts = [];
                                        $scope.formState.programPrices.list = prices;

                                        angular.forEach(prices, function (price) {
                                            var item = {
                                                name: price.duration + ' мин.',
                                                value: price.id
                                            };

                                            if (angular.equals(origDurationName, price.duration)) {
                                                origDuration = item;
                                                origDurationName = '';
                                            }

                                            price_opts.push(item)
                                        });
                                        $scope.to.options = price_opts;
                                        $scope.model.duration = origDuration;
                                    });
                                }
                                else {
                                    $scope.to.options = [];
                                    $scope.formState.programPrices.list = [];
                                }
                            });
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'price',
                        templateOptions: {
                            id: 'programPriceId',
                            label: 'Стоимость программы',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watch('model.duration', function (newVal) {
                                if (!!newVal && !!newVal.value) {
                                    $scope.formState.programPrices.list.some(function (item) {
                                        if (item.id === newVal.value) {
                                            $scope.model.price = item.price;
                                            return true;
                                        }
                                    });
                                }
                                else {
                                    $scope.model.price = '';
                                }
                            });
                        }
                    },
                    {
                        type: 'groupedSelect',
                        key: 'program_executors',
                        templateOptions: {
                            id: 'programPossibleExecutorsIds',
                            label: 'Исполнители программы',
                            size: 6,
                            options: [],
                            multiple: true
                        },
                        controller: function ($scope) {

                            $scope.$watch('model.program', function (newVal) {
                                if (!!newVal && !!newVal.value) {

                                    ProgramService.getProgram(newVal.value).then(function (program) {

                                        var executorsIds = angular.copy($scope.model.program_executors),
                                            programExecutors = [];

                                        $timeout(function () {
                                            var opts = [];
                                            angular.forEach(program.possible_executors, function (executor) {
                                                var item = {
                                                    name: executor.full_name,
                                                    value: executor.id,
                                                    group: executor.role
                                                };

                                                angular.forEach(executorsIds, function (ex) {
                                                    if (ex.id === item.value) {
                                                        programExecutors.push(item);
                                                    }
                                                });

                                                opts.push(item)
                                            });
                                            $scope.to.options = opts;
                                        }).then(function () {
                                            $scope.model.program_executors = programExecutors;
                                        });
                                    });
                                }
                                else {
                                    $scope.to.options = [];
                                }
                            });
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'additional_services',
                        templateOptions: {
                            id: 'additionalServicesIds',
                            label: 'Список дополнительных услуг',
                            size: 6,
                            options: [],
                            multiple: true
                        },
                        controller: function ($scope) {
                            AdditionalServiceFactory.getAllAdditionalServices().then(function (services) {

                                $scope.formState.additionalServices = services;
                                var additionalServ = [];

                                $timeout(function () {
                                    var opts = [];
                                    angular.forEach(services, function (service) {
                                        var item = {
                                            name: service.title,
                                            value: service.id
                                        };

                                        angular.forEach($scope.model.additional_services, function (serv) {
                                            if (serv.id === item.value) {
                                                additionalServ.push(item);
                                            }
                                        });

                                        opts.push(item);
                                    });

                                    $scope.to.options = opts;

                                }).then(function () {
                                    $scope.model.additional_services = additionalServ;
                                })
                            })
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'services_executors',
                        templateOptions: {
                            id: 'servicesExecutorsIds',
                            label: 'Исполнители дополнительных услуг',
                            size: 6,
                            options: [],
                            multiple: true
                        },
                        controller: function ($scope) {

                            var possibleExecutors = [],
                                resultServExecutors = [],
                                origServExec = angular.copy($scope.model.services_executors);

                            $scope.$watch('model.additional_services', function (newVal, oldVal) {
                                $timeout(function () {
                                    angular.forEach($scope.formState.additionalServices, function (formStateService) {

                                        angular.forEach(newVal, function (newValItem) {

                                            if (angular.equals(
                                                    formStateService.id,
                                                    newValItem.id !== undefined ? newValItem.id : newValItem.value)) {

                                                angular.forEach(formStateService.possible_executors, function (executor) {

                                                    var item = executor.full_name === undefined
                                                        ? {name: executor.name, value: executor.value}
                                                        : {name: executor.full_name, value: executor.id};

                                                    possibleExecutors.push(item);
                                                })
                                            }
                                        });
                                    });

                                    return possibleExecutors;

                                }).then(function (possibleExecutors) {

                                    var uniqueExecutors = [];

                                    angular.forEach(possibleExecutors, function (pos_ex) {
                                        var exists = false;

                                        angular.forEach(uniqueExecutors, function (unique_ex) {
                                            if (pos_ex.value === unique_ex.value) {
                                                exists = true
                                            }
                                        });

                                        if (!exists) {

                                            var item = {
                                                name: pos_ex.name,
                                                value: pos_ex.value
                                            };

                                            angular.forEach(origServExec, function (exec) {
                                                var id = exec.id !== undefined ? exec.id : exec.value;
                                                if (id === item.value) {
                                                    resultServExecutors.push(item);
                                                }
                                            });

                                            uniqueExecutors.push(item)
                                        }
                                    });

                                    $scope.to.options = uniqueExecutors;
                                }).then(function () {
                                    $scope.model.services_executors = resultServExecutors;
                                })
                            });

                        }
                    },
                    {
                        type: 'textarea',
                        key: 'details',
                        templateOptions: {
                            id: 'orderDetailsId',
                            label: 'Дополнительная информация'
                        }
                    },
                    {
                        type: 'textarea',
                        key: 'executor_comment',
                        templateOptions: {
                            id: 'executorCommentId',
                            label: 'Комментарий исполнителя'
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'discount',
                        defaultValue: {id: '1'},
                        templateOptions: {
                            id: 'discountId',
                            label: 'Скидка',
                            size: 6,
                            options: []
                        },
                        controller: function ($scope) {
                            DiscountService.reloadDiscounts().then(function () {
                                $scope.formState.discounts = DiscountService.getDiscounts();

                                var origDiscount = {};

                                $timeout(function () {
                                    var opts = [];
                                    angular.forEach($scope.formState.discounts, function (discount) {
                                        var item = {
                                            name: discount.name,
                                            value: discount.id
                                        };

                                        if (($scope.model.discount !== undefined) && (item.value === $scope.model.discount.id)) {
                                            origDiscount = item;
                                        }

                                        opts.push(item);
                                    });

                                    $scope.to.options = opts;
                                }).then(function () {
                                    $scope.model.discount = origDiscount;
                                })
                            });
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price',
                        templateOptions: {
                            id: 'totalPriceId',
                            label: 'Стоимость заказа',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watchGroup(['model.price', 'model.additional_services'], function (newValues) {
                                var programPrice = newValues[0];
                                var sumServicesPrices = 0;
                                angular.forEach($scope.formState.additionalServices, function (origService) {
                                    angular.forEach($scope.model.additional_services, function (modelService) {
                                        if (origService.id === modelService.value) {
                                            sumServicesPrices += origService.price;
                                        }
                                    })
                                });
                                var price = programPrice + sumServicesPrices;
                                $scope.model.total_price = Math.round(price / 100) * 100;
                            });
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price_with_discounts',
                        templateOptions: {
                            id: 'totalPriceWithDiscountId',
                            label: 'Стоимость заказа с учетом скидки',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watchGroup(['model.price', 'model.additional_services', 'model.discount'], function (newValues) {
                                var programPrice = newValues[0];
                                var discountPercent = 0;
                                var sumServicesPrices = 0;

                                if ($scope.model.discount !== undefined) {
                                    angular.forEach($scope.formState.discounts, function (origDiscount) {
                                        if (origDiscount.id === $scope.model.discount.value) {
                                            discountPercent = origDiscount.value;
                                        }
                                    });
                                }

                                angular.forEach($scope.formState.additionalServices, function (origService) {
                                    angular.forEach($scope.model.additional_services, function (modelService) {
                                        if (origService.id === modelService.value) {
                                            sumServicesPrices += origService.price;
                                        }
                                    })
                                });
                                var programPriceWithDiscount = programPrice - (programPrice * (discountPercent / 100));
                                var price = programPriceWithDiscount + sumServicesPrices;
                                $scope.model.total_price_with_discounts = Math.round(price / 100) * 100;
                            });
                        },
                        link: function (scope, elem, attrs, ctrl) {
                            $rootScope.$broadcast('OrderForm.rendered');
                        }
                    }
                ];
            };

            orderForm.convertDataToModel = function (data) {
                var modelData = {};

                modelData.id = data.id;

                modelData.client = {
                    id: data.client.value.toString()
                };

                modelData.children_num = data.children_num;

                modelData.client_children = [];

                if (data.client_children.length > 0) {
                    angular.forEach(data.client_children, function (child) {
                        modelData.client_children.push({
                            id: child.value.toString()
                        });
                    })
                }

                modelData.celebrate_date = moment(data.celebrate_date).format('YYYY-MM-DD');
                modelData.celebrate_time = data.celebrate_time;

                modelData.celebrate_place = data.celebrate_place.name;

                modelData.address = angular.toJson(data.address);
                modelData.program = {id: data.program.value.toString()};

                modelData.program_executors = [];

                if (data.program_executors.length > 0) {
                    angular.forEach(data.program_executors, function (executor) {
                        modelData.program_executors.push({
                            id: executor.value.toString()
                        });
                    })
                }

                modelData.duration = data.duration.name.replace('мин.', '').trim();
                modelData.price = data.price;

                modelData.additional_services = [];

                if (data.additional_services.length > 0) {
                    angular.forEach(data.additional_services, function (service) {
                        modelData.additional_services.push({
                            id: service.value.toString()
                        });
                    })
                }

                modelData.services_executors = [];

                if (data.services_executors.length > 0) {
                    angular.forEach(data.services_executors, function (executor) {
                        modelData.services_executors.push({
                            id: executor.value.toString()
                        });
                    })
                }

                if (data.details !== undefined && data.details) {
                    modelData.details = data.details.trim();
                }

                if (data.executor_comment !== undefined && data.executor_comment) {
                    modelData.executor_comment = data.executor_comment.trim();
                }

                modelData.discount = {id: data.discount.value};
                modelData.total_price = data.total_price;
                modelData.total_price_with_discounts = data.total_price_with_discounts;

                return modelData;
            };

            return orderForm;
        }])
    .factory('ClientForm', [function () {
        var clientForm = {};

        clientForm.getFieldsOptions = function () {
            return [
                {
                    type: 'input',
                    key: 'name',
                    templateOptions: {
                        id: 'clientNameId',
                        label: 'Имя клиента',
                        required: true
                    }
                },
                {
                    type: 'phoneInputType',
                    key: 'phone',
                    templateOptions: {
                        id: 'clientPhoneId',
                        label: 'Телефон клиента',
                        required: true
                    },
                    controller: function ($scope) {
                        $scope.$watch('model.phone', function (newVal) {
                            if (newVal !== undefined) {
                                $scope.model.phone = $scope.model.phone.trimPhoneCountryCode()
                            }
                        })
                    }
                },
                {
                    type: 'input',
                    key: 'child_name',
                    templateOptions: {
                        id: 'clientChildNameId',
                        label: 'Имя ребенка',
                        required: true
                    }
                },
                {
                    type: 'input',
                    key: 'child_age',
                    templateOptions: {
                        id: 'clientChildAgeId',
                        label: 'Лет ребенку',
                        required: true
                    }
                }
            ]
        };

        return clientForm;
    }])
    .factory('ClientFullForm', ['Validators', function (Validators) {
        var clientForm = {};

        clientForm.getFieldsOptions = function (isEditMode) {

            isEditMode = isEditMode ? isEditMode !== undefined : false;

            return [
                {
                    type: 'input',
                    key: 'name',
                    id: 'clientNameId',
                    templateOptions: {
                        label: 'Имя',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'phoneInputType',
                    key: 'phone',
                    id: 'clientPhoneId',
                    templateOptions: {
                        label: 'Телефон',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    },
                    controller: function ($scope) {
                        $scope.$watch('model.phone', function (newVal) {
                            if (newVal !== undefined) {
                                $scope.model.phone = $scope.model.phone.trimPhoneCountryCode()
                            }
                        })
                    }
                },
                {
                    type: 'phoneInputType',
                    key: 'phone_2',
                    id: 'clientPhone2Id',
                    templateOptions: {
                        label: 'Доп. телефон',
                        disabled: !isEditMode
                    },
                    controller: function ($scope) {
                        $scope.$watch('model.phone_2', function (newVal) {
                            if (newVal !== undefined && !!newVal) {
                                $scope.model.phone_2 = $scope.model.phone_2.trimPhoneCountryCode()
                            }
                        })
                    }
                },
                {
                    type: 'input',
                    key: 'email',
                    id: 'clientEmailId',
                    templateOptions: {
                        label: 'Email',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'input',
                    key: 'vk_link',
                    id: 'clientVKId',
                    templateOptions: {
                        label: 'VK-аккаунт',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'input',
                    key: 'odnoklassniki_link',
                    id: 'clientOKId',
                    templateOptions: {
                        label: 'Одноклассники',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'input',
                    key: 'instagram_link',
                    id: 'clientInstagramId',
                    templateOptions: {
                        label: 'Instagram',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'input',
                    key: 'facebook_link',
                    id: 'clientFacebookId',
                    templateOptions: {
                        label: 'Facebook',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'input',
                    key: 'secondby_link',
                    id: 'clientSecondById',
                    templateOptions: {
                        label: 'SecondBy',
                        disabled: !isEditMode
                    }
                },
                {
                    type: 'textarea',
                    key: 'comments',
                    id: 'clientCommentId',
                    templateOptions: {
                        label: 'Комментарий о клиенте'
                    }
                }
            ]
        };

        clientForm.convertDataToModel = function (data) {
            var modelData = {};

            modelData.id = data.id;
            modelData.name = data.name;
            modelData.phone = data.phone.addPhoneCountryCode();
            modelData.phone_2 = !!data.phone_2 ? data.phone_2.addPhoneCountryCode() : "";
            modelData.email = data.email;
            modelData.vk_link = data.vk_link;
            modelData.odnoklassniki_link = data.odnoklassniki_link;
            modelData.instagram_link = data.instagram_link;
            modelData.facebook_link = data.facebook_link;
            modelData.secondby_link = data.secondby_link;
            modelData.comments = data.comments;

            return modelData;
        };

        return clientForm;
    }])
    .factory('ChangePasswordForm', ['Validators', function (Validators) {

        var changePasswordForm = {};

        changePasswordForm.getFieldsOptions = function () {
            return [
                {
                    type: 'input',
                    key: 'oldPassword',
                    id: 'oldPwd',
                    templateOptions: {
                        label: 'Старый пароль',
                        type: 'password'
                    },
                    validators: {
                        wrongPassword: Validators.wrongPasswordRemote,
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'newPassword',
                    id: 'newPwd',
                    templateOptions: {
                        label: 'Новый пароль',
                        type: 'password'
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'confirmNewPassword',
                    id: 'confirmPwd',
                    templateOptions: {
                        label: 'Подтверждение нового пароля',
                        type: 'password'
                    },
                    validators: {
                        confirmPassword: Validators.confirmPassword,
                        required: Validators.required
                    }
                }
            ]
        };

        return changePasswordForm;
    }])
    .factory('UserProfileForm', ['$timeout', function ($timeout) {

        var userProfileForm = {};

        userProfileForm.getFieldsOptions = function (readonly) {
            return [
                {
                    type: 'input',
                    key: 'username',
                    id: 'username',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Логин пользователя',
                        required: !readonly,
                        disabled: readonly
                    }
                },
                {
                    type: 'input',
                    key: 'first_name',
                    id: 'first_name',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Имя пользователя',
                        required: !readonly,
                        disabled: readonly
                    }
                },
                {
                    type: 'input',
                    key: 'last_name',
                    id: 'last_name',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Фамилия пользователя',
                        required: !readonly,
                        disabled: readonly
                    }
                },
                {
                    type: 'input',
                    key: 'email',
                    id: 'email',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Email',
                        type: 'email',
                        required: !readonly,
                        disabled: readonly
                    }
                },
                {
                    type: 'input',
                    key: 'phone',
                    id: 'phone',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Телефон',
                        required: !readonly,
                        disabled: readonly
                    },
                    controller: function ($scope) {
                        $scope.$watch('model.phone', function (newVal) {
                            if (newVal !== undefined) {
                                $scope.model.phone = $scope.model.phone.trimPhoneCountryCode()
                            }
                        })
                    }
                },
                {
                    type: readonly ? 'input' : 'vSelect',
                    key: 'role',
                    id: 'role',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Должность',
                        required: !readonly,
                        disabled: readonly,
                        options: []
                    },
                    controller: function ($scope) {
                        if (!readonly) {
                            var roles = [
                                {name: 'Менеджер', value: 'manager'},
                                {name: 'Аниматор', value: 'animator'},
                                {name: 'Фотограф', value: 'photographer'}
                            ];

                            $scope.to.options = roles;

                            var origRole = angular.copy($scope.model.role);

                            $timeout(function () {
                                angular.forEach(roles, function (role) {
                                    if (role.name === origRole) {
                                        $scope.model.role = role;
                                    }
                                });
                            });
                        }
                    }
                },
                {
                    type: 'textarea',
                    key: 'address',
                    id: 'address',
                    className: readonly ? 'userprofile-readonly-field' : '',
                    templateOptions: {
                        label: 'Адрес',
                        required: !readonly,
                        disabled: readonly
                    },
                    controller: function ($scope) {
                        //if (!$scope.model.address) {
                        //    $scope.model.address = {}
                        //}
                        //else if (angular.isString($scope.model.address)) {
                        //    $scope.model.address = angular.fromJson($scope.model.address);
                        //}
                    }
                }
            ]
        };

        userProfileForm.convertDataToModel = function (data) {
            var modelData = {};

            modelData.user = data.id;
            modelData.username = data.username;
            modelData.first_name = data.first_name;
            modelData.last_name = data.last_name;
            modelData.email = data.email;
            modelData.phone = data.phone.addPhoneCountryCode();
            modelData.address = data.address;
            modelData.role = data.role.value;

            return modelData;
        };

        return userProfileForm;
    }])
    .factory('ProgramForm', ['$timeout', 'Validators', 'UserService', function ($timeout, Validators, UserService) {
        var programForm = {};

        programForm.getFieldsOptions = function (isEditMode, row) {

            isEditMode = isEditMode ? isEditMode !== undefined : false;

            return [
                {
                    type: 'input',
                    key: 'title',
                    id: 'programTitleId',
                    templateOptions: {
                        label: 'Название программы',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'characters',
                    id: 'programCharactersId',
                    templateOptions: {
                        label: 'Герои программы',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'num_executors',
                    id: 'numExecutorsId',
                    templateOptions: {
                        label: 'Кол-во исполнителей',
                        type: 'number',
                        disabled: !isEditMode
                    }
                },
                {
                    type: isEditMode ? 'groupedSelect' : 'manyToManyReadOnlyType',
                    key: 'possible_executors',
                    id: 'possibleExecutorsIds',
                    templateOptions: {
                        label: 'Возможные исполнители программы',
                        size: 6,
                        options: [],
                        multiple: true
                    },
                    controller: function ($scope) {

                        var executors = UserService.getExecutors(),
                            programExecutors = [];

                        $scope.model.possible_executors = [];

                        $timeout(function () {
                            var opts = [];
                            angular.forEach(executors, function (executor) {
                                var item = {
                                    name: executor.full_name,
                                    value: executor.id,
                                    group: executor.role
                                };

                                angular.forEach($scope.formState.possibleExecutors, function (ex) {
                                    if (ex.id === item.value) {
                                        programExecutors.push(isEditMode ? item : item.name);
                                    }
                                });

                                opts.push(item)
                            });
                            $scope.to.options = opts;
                        }).then(function () {
                            $scope.model.possible_executors = programExecutors;
                        });
                    }
                }
            ]

        };

        programForm.convertDataToModel = function (data) {
            var modelData = {};

            modelData.id = data.id;
            modelData.title = data.title;
            modelData.characters = data.characters;
            modelData.num_executors = data.num_executors;

            var possibleExecutorsIds = [];

            angular.forEach(data.possible_executors, function (ex) {
                possibleExecutorsIds.push({
                    id: ex.value
                })
            });

            modelData.possible_executors = possibleExecutorsIds;

            return modelData;
        };

        return programForm;
    }])
    .factory('AdditionalServiceForm', ['$timeout', 'Validators', 'UserService', function ($timeout, Validators, UserService) {
        var additionalServiceForm = {};

        additionalServiceForm.getFieldsOptions = function (isEditMode, row) {

            isEditMode = isEditMode ? isEditMode !== undefined : false;

            return [
                {
                    type: 'input',
                    key: 'title',
                    id: 'additionalServiceTitleId',
                    templateOptions: {
                        label: 'Название услуги',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'price',
                    id: 'additionalServicePriceId',
                    templateOptions: {
                        label: 'Стоимость услуги',
                        disabled: !isEditMode
                    },
                    validators: {
                        required: Validators.required
                    }
                },
                {
                    type: 'input',
                    key: 'num_executors',
                    id: 'numExecutorsId',
                    templateOptions: {
                        label: 'Кол-во исполнителей',
                        type: 'number',
                        disabled: !isEditMode
                    }
                },
                {
                    type: isEditMode ? 'groupedSelect' : 'manyToManyReadOnlyType',
                    key: 'possible_executors',
                    id: 'possibleExecutorsIds',
                    templateOptions: {
                        label: 'Возможные исполнители программы',
                        size: 6,
                        options: [],
                        multiple: true
                    },
                    controller: function ($scope) {

                        var executors = UserService.getExecutors(),
                            programExecutors = [];

                        $scope.model.possible_executors = [];

                        $timeout(function () {
                            var opts = [];
                            angular.forEach(executors, function (executor) {
                                var item = {
                                    name: executor.full_name,
                                    value: executor.id,
                                    group: executor.role
                                };

                                angular.forEach($scope.formState.possibleExecutors, function (ex) {
                                    if (ex.id === item.value) {
                                        programExecutors.push(isEditMode ? item : item.name);
                                    }
                                });

                                opts.push(item)
                            });
                            $scope.to.options = opts;
                        }).then(function () {
                            $scope.model.possible_executors = programExecutors;
                        });
                    }
                }
            ]

        };

        additionalServiceForm.convertDataToModel = function (data) {
            var modelData = {};

            modelData.id = data.id;
            modelData.title = data.title;
            modelData.price = data.price;
            modelData.num_executors = data.num_executors;

            var possibleExecutorsIds = [];

            angular.forEach(data.possible_executors, function (ex) {
                possibleExecutorsIds.push({
                    id: ex.value
                })
            });

            modelData.possible_executors = possibleExecutorsIds;

            return modelData;
        };

        return additionalServiceForm;
    }]);
