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
    .run(function ($rootScope, formlyConfig, formlyValidationMessages) {
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
            name: 'additionalServicesSelect',
            templateUrl: '/static/form_field_templates/addit_serv_single_select_template.html',
            link: function (scope, element, attrs) {
                if (scope.options.templateOptions.multiple) {
                    element.find('ul.dropdown-menu').addClass('multiple-mode');
                }
                else {
                    element.find('ul.dropdown-menu').addClass('single-item-mode');
                }
            },
            controller: function ($scope) {
                $scope.$watch('fields', function (newVal) {
                    //console.log(newVal);
                }, true)
            }
        });

        formlyConfig.setType({
            name: 'repeatSection',
            templateUrl: '/static/form_field_templates/repeatSection.html',
            controller: function ($scope, $timeout) {
                $scope.formOptions = {formState: $scope.formState};
                //$scope.addNew = addNew;
                $scope.copyFields = copyFields;
                //$scope.init = init;
                //
                //function init() {
                //    $scope.fields = copyFields($scope.to.fields)
                //}

                function copyFields(fields) {
                    fields = angular.copy(fields);
                    addRandomIds(fields);
                    return fields;
                }

                //function addNew() {
                //    $scope.model[$scope.options.key] = $scope.model[$scope.options.key] || [];
                //    var repeatSection = $scope.model[$scope.options.key];
                //    var lastSection = repeatSection[repeatSection.length - 1];
                //    var newSection = {};
                //    if (lastSection) {
                //        newSection = angular.copy(lastSection);
                //    }
                //    repeatSection.push(newSection);
                //}

                var unique = 1;

                function addRandomIds(fields) {
                    unique++;
                    angular.forEach(fields, function (field, index) {
                        if (field.templateOptions && field.templateOptions.fields) {
                            addRandomIds(field.templateOptions.fields);
                        }
                        field.id = field.id || (field.key + '_' + index + '_' + unique + getRandomInt(0, 9999));
                    });
                }

                function getRandomInt(min, max) {
                    return Math.floor(Math.random() * (max - min)) + min;
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
            name: 'clientChildrenSelect',
            templateUrl: '/static/form_field_templates/client_children_select_template.html',
            link: function (scope, element, attrs) {
                if (scope.options.templateOptions.multiple) {
                    element.find('ul.dropdown-menu').addClass('multiple-mode');
                }
                else {
                    element.find('ul.dropdown-menu').addClass('single-item-mode');
                }

                if (scope.model) {

                    var dropdownToggle = $(element).find('.dropdown-toggle');
                    var nuaSelect = $(element).find('.nya-bs-select');

                    scope.$watch(function () {
                        return dropdownToggle.text();
                    }, function (newVal, oldVal) {
                        if (!angular.equals(newVal, '--- ') && !angular.equals(newVal, oldVal)) {
                            if (nuaSelect.hasClass('open')) {
                                nuaSelect.triggerHandler('blur');
                            }

                            nuaSelect.find('.nya-bs-option').on('click', function () {
                                nuaSelect.removeClass('open');
                            });
                        }
                    });
                }
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

        formlyConfig.setType({
            name: 'timePicker',
            templateUrl: '/static/form_field_templates/time_picker_template.html',
            wrapper: ['bootstrapLabel', 'bootstrapHasError']
        });

        formlyConfig.setType({
            name: 'datePicker',
            templateUrl: '/static/form_field_templates/date_picker_template.html',
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
                $rootScope.$on('OrderForm.rendered', function () {
                    $timeout(function () {
                        var fields = element.find('.formly-field');
                        fields.splice(-1, 1);
                        fields.after('<hr/>');
                    });
                    $timeout(function () {
                        var repeatSectionHr = $(element).find('.service-executor').next();
                        repeatSectionHr.remove()
                    }, 500)
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
    .directive('dtTimeLimit', [function () {
        return {
            link: function (scope, elem, attrs, ctrl) {

                var hoursInput = null;

                scope.$watch(function () {
                    hoursInput = $('input[ng-model="hours"]');
                    if (hoursInput.length > 0) {
                        return hoursInput.val();
                    }
                    return false;
                }, function (newVal, oldVal) {
                    if (!angular.equals(newVal, oldVal)) {
                        var hours = parseInt(newVal);
                        hours = hours >= 8 ? hours : 8;
                        hours = hours <= 23 ? hours : 23;
                        hours = hours < 10 ? '0' + hours : hours.toString();
                        //var hoursScope = hoursInput.scope();
                        //hoursScope.hours = hours;
                    }
                });
            }
        }
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
        'ProgramService', 'DiscountService', 'DataFormatters', '$document',

        function ($rootScope, $q, $timeout, Validators, ClientService, UserService, AdditionalServiceFactory,
                  ProgramService, DiscountService, DataFormatters, $document) {

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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        key: 'additional_services_executors',
                        id: 'additionalServicesIds',
                        templateOptions: {
                            label: 'Список дополнительных услуг'
                        },
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return scope.model.additional_services_executors === undefined || scope.model.additional_services_executors.length === 0;
                        },
                        controller: function ($scope) {
                            AdditionalServiceFactory.getAllAdditionalServices().then(function (services) {

                                $scope.formState.additionalServices = services;
                                var addit_serv_executs = angular.copy($scope.model.additional_services_executors);
                                var additionalServ = [];

                                $timeout(function () {
                                    angular.forEach(services, function (service) {
                                        angular.forEach(addit_serv_executs, function (serv) {
                                            if (serv.id === service.id) {
                                                additionalServ.push({
                                                    name: service.title,
                                                    value: service.id,
                                                    executors: serv.executors || []
                                                });
                                            }
                                        });
                                    });

                                }).then(function () {
                                    $timeout(function () {
                                        $scope.model.additional_services_executors = additionalServ;
                                        $scope.formState.additionalServicesChanged = true;
                                    })
                                })
                            })
                        }
                    },
                    {
                        type: 'repeatSection',
                        key: 'additional_services_executors',
                        templateOptions: {
                            label: 'Исполнители дополнительных услуг',
                            fields: [
                                {
                                    type: 'manyToManyReadOnlyType',
                                    key: 'executors',
                                    className: 'service-executor',
                                    templateOptions: {
                                        id: 'servicesExecutorsIds'
                                    },
                                    controller: function ($scope) {
                                        $scope.$watch('formState.additionalServicesChanged', function () {
                                            var executor_items = [],
                                                checked_executors = angular.copy($scope.model.executors);

                                            $timeout(function () {
                                                angular.forEach($scope.formState.additionalServices, function (serv) {

                                                    var model_serv_id = $scope.model.value || $scope.model.id;

                                                    if (model_serv_id === serv.id) {

                                                        $scope.to.label = serv.title;

                                                        angular.forEach(serv.possible_executors, function (pos_exec) {
                                                            angular.forEach(checked_executors, function (ex) {
                                                                if (angular.equals(ex.id || ex.value, pos_exec.id)) {
                                                                    executor_items.push({
                                                                        name: pos_exec.full_name,
                                                                        value: pos_exec.id
                                                                    })
                                                                }
                                                            });
                                                        });
                                                    }
                                                });

                                            })
                                                .then(function () {
                                                    $timeout(function () {
                                                        $scope.model.executors = executor_items;
                                                    }, 800)
                                                });
                                        });
                                    }
                                }
                            ]
                        },
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return scope.model.additional_services_executors === undefined || scope.model.additional_services_executors.length === 0;
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return !scope.model.details;
                        }
                    },
                    {
                        type: 'textareaWithButtonType',
                        key: 'executor_comment',
                        id: 'executorCommentId',
                        defaultValue: '',
                        className: 'executor-comment',
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
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
                        key: 'cost_of_the_way',
                        templateOptions: {
                            id: 'costWayId',
                            label: 'Стоимость дороги',
                            disabled: true
                        },
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return !scope.model.cost_of_the_way;
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return !scope.model.total_price;
                        },
                        controller: function ($scope) {
                            if (!$scope.model.total_price) {
                                $scope.model.total_price = 0;
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
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return !scope.model.total_price_with_discounts;
                        },
                        controller: function ($scope) {
                            if (!$scope.model.total_price_with_discounts) {
                                $scope.model.total_price_with_discounts = 0;
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
                        className: 'order-client-select',
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
                        controller: function ($scope, $sce) {

                            if (!!$scope.model.client) {
                                ClientService.getClient($scope.model.client.id).then(function (client) {
                                    $timeout(function () {
                                        var item = {
                                            name: client.name,
                                            phone: client.phone,
                                            phone2: client.phone_2,
                                            value: client.id
                                        };
                                        $scope.to.options = [item];
                                        $scope.model.client = item;
                                    })
                                })
                            }
                            else {
                                $scope.model.client = {};
                            }


                            //ClientService.loadClients().then(function () {
                            //
                            //    var clients = ClientService.getClients();
                            //    var initial_client = {};
                            //
                            //    $timeout(function () {
                            //        var opts = [{name: '---', value: 0}];
                            //        angular.forEach(clients, function (client) {
                            //
                            //            var item = {
                            //                name: client.name,
                            //                phone: client.phone,
                            //                phone2: client.phone_2,
                            //                value: client.id
                            //            };
                            //
                            //            if (($scope.model.client !== undefined) && ($scope.model.client.id === item.value)) {
                            //                initial_client = item;
                            //            }
                            //
                            //            opts.push(item);
                            //        });
                            //        $scope.to.options = opts;
                            //    }).then(function () {
                            //        if (!initial_client.id && !!$scope.model.client) {
                            //            ClientService.getClient($scope.model.client.id).then(function (client) {
                            //                var item = {
                            //                    name: client.name,
                            //                    phone: client.phone,
                            //                    phone2: client.phone_2,
                            //                    value: client.id
                            //                };
                            //                var hasItem = false;
                            //                angular.forEach($scope.to.options, function (opt) {
                            //                    if (opt.value === item.value) {
                            //                        hasItem = true;
                            //                    }
                            //                });
                            //                if (!hasItem) {
                            //                    $scope.to.options.push(item);
                            //                }
                            //                $scope.model.client = item;
                            //            })
                            //        }
                            //        else {
                            //            $scope.model.client = initial_client;
                            //        }
                            //    });
                            //});

                            $scope.onButtonClick = function () {
                                $scope.$emit('onCreateClientClick', $scope.model.client);
                            }
                        }
                    },
                    {
                        type: 'clientChildrenSelect',
                        key: 'client_children',
                        className: 'order-client-children-select',
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

                            var client_id = 0;

                            if ($scope.model.client !== undefined) {
                                client_id = angular.copy($scope.model.client.id);
                            }

                            var client_children = angular.copy($scope.model.client_children);

                            $scope.$watch('model.client', function (newVal) {
                                if (!!newVal && !!newVal.value) {

                                    var birthdayBoys = [];
                                    var newClientId = newVal.id || newVal.value;

                                    if (client_id !== newClientId) {
                                        client_children = undefined;
                                        $scope.model.client_children = [];
                                    }

                                    $timeout(function () {
                                        ClientService.getClientChildren(newVal.value).then(function (children) {
                                            var opts = [];
                                            angular.forEach(children, function (child) {
                                                var item = {
                                                    name: child.name,
                                                    value: child.id,
                                                    age: child.age
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

                                        $timeout(function () {
                                            if (birthdayBoys.length === 0 && $scope.to.options.length === 1) {
                                                birthdayBoys.push($scope.to.options[0]);
                                            }

                                            $scope.model.client_children = birthdayBoys;
                                        }, 200)
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
                        className: 'children-num-input',
                        templateOptions: {
                            id: 'childrenNumId',
                            label: 'Количество детей',
                            min: 1
                        }
                    },
                    {
                        type: 'dateTimePicker',
                        key: 'celebrate_datetime',
                        className: 'celebrate-datetime-select',
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

                            $scope.model.celebrate_datetime = moment().toDate();

                            $scope.$watch('model.celebrate_datetime', function (newVal, oldVal) {
                                if (newVal instanceof Date) {
                                    var hour = moment(newVal).hours();
                                    if (hour < 8 || hour > 23) {
                                        hour = hour >= 8 ? hour : 8;
                                        hour = hour <= 23 ? hour : 23;
                                        $scope.model.celebrate_datetime = moment(newVal).hours(hour).toDate();
                                    }
                                    $scope.model.celebrate_date = moment(newVal).format('YYYY-MM-DD');
                                    $scope.model.celebrate_time = moment(newVal).format('HH:mm');
                                }
                            });

                            var time = moment($scope.model.celebrate_time, 'HH:mm');
                            $scope.model.celebrate_datetime = moment($scope.model.celebrate_date).set({
                                hour: time.hours(),
                                minute: time.minutes()
                            }).toDate();
                        }
                    },
                    {
                        type: 'simpleSelect',
                        key: 'celebrate_place',
                        defaultValue: 'Квартира',
                        className: 'celebrate-place-select',
                        templateOptions: {
                            label: 'Место проведения',
                            options: [],
                            size: 6
                        },
                        controller: function ($scope) {
                            var items = [
                                {'name': 'Квартира', 'value': 1},
                                {'name': 'Детский сад', 'value': 2},
                                {'name': 'Школа', 'value': 3},
                                {'name': 'Кафе', 'value': 4},
                                {'name': 'Детский центр', 'value': 5},
                                {'name': 'Другое', 'value': 6}
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
                            label: 'Адрес'
                        },
                        controller: function ($scope) {
                            if (!$scope.model.address) {
                                $scope.model.address = {city: 'Минск'}
                            }
                            else if (angular.isString($scope.model.address)) {
                                $scope.model.address = angular.fromJson($scope.model.address);
                            }
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'program',
                        className: 'order-program-select',
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
                                    : { name: $scope.model.program.title, value: $scope.model.program.id };

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
                        className: 'order-program-duration-input',
                        templateOptions: {
                            id: 'programDurationId',
                            label: 'Длит.',
                            size: 6,
                            options: [],
                            required: true
                        },
                        controller: function ($scope) {

                            var origDurationName = angular.copy($scope.model.duration),
                                origDuration = {};

                            var programId = !!$scope.model.program
                                ? $scope.model.program.value || $scope.model.program.id
                                : null;

                            $scope.formState.programPrices.oldPrice = {
                                'programId': programId,
                                'duration': $scope.model.duration,
                                'price': $scope.model.price
                            };

                            $scope.$watch('model.program', function (newVal) {
                                $scope.model.duration = '';
                                $scope.model.price = 0;

                                if (!!newVal && !!newVal.value) {
                                    ProgramService.getProgramPrices(newVal.value).then(function (prices) {
                                        var price_opts = [];
                                        var cpPrices = [];
                                        angular.forEach(prices, function (item) {
                                            if (item.duration === 60) {
                                                cpPrices.unshift(item);
                                            }
                                            else {
                                                cpPrices.push(item);
                                            }
                                        });
                                        $scope.formState.programPrices.list = cpPrices;

                                        angular.forEach(cpPrices, function (price) {
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
                        className: 'order-program-price-input',
                        templateOptions: {
                            id: 'programPriceId',
                            label: 'Стоимость',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watch('model.duration', function (newVal) {
                                if (!!newVal && !!newVal.value) {
                                    $scope.formState.programPrices.list.some(function (item) {
                                        var durationMatch = newVal.name.match(/[\d]+/);
                                        if (item.id === newVal.value) {
                                            $scope.formState.programPrices.newPrice = {
                                                'programId': $scope.model.program.value || $scope.model.program.id,
                                                'duration': !!durationMatch ? parseInt(durationMatch[0]) : 0,
                                                'price': item.price
                                            }
                                        }
                                    });

                                    $scope.model.price = programPriceHasBeenChangedUnderOrderUpdateMode()
                                        ? $scope.formState.programPrices.oldPrice.price
                                        : $scope.formState.programPrices.newPrice.price
                                }
                                else {
                                    $scope.model.price = 0;
                                }
                            });

                            function programPriceHasBeenChangedUnderOrderUpdateMode() {
                                var isSameProgram = $scope.formState.programPrices.oldPrice.programId === $scope.formState.programPrices.newPrice.programId;
                                var isSameDuration = $scope.formState.programPrices.oldPrice.duration === $scope.formState.programPrices.newPrice.duration;
                                var isEqualsPrices = $scope.formState.programPrices.oldPrice.price === $scope.formState.programPrices.newPrice.price;
                                return !!$scope.model.id && isSameProgram && isSameDuration && !isEqualsPrices;
                            }
                        }
                    },
                    {
                        type: 'groupedSelect',
                        key: 'program_executors',
                        className: 'order-program-executors-select',
                        templateOptions: {
                            id: 'programPossibleExecutorsIds',
                            label: 'Исполнители',
                            size: 6,
                            options: [],
                            multiple: true
                        },
                        link: function(scope, el, attrs, ctrl) {
                            scope.$watch('to.options', function (value) {
                                var wrapper = $(el).find('.dropdown-menu.open');
                                //$(wrapper).removeClass('pull-left');
                                $(wrapper).addClass('pull-right');
                            })
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
                                            $timeout(function () {

                                                if (programExecutors.length === 0 && $scope.to.options.length === 1) {
                                                    programExecutors.push($scope.to.options[0]);
                                                }

                                                $scope.model.program_executors = programExecutors;

                                            }, 200);
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
                        type: 'additionalServicesSelect',
                        key: 'additional_services_executors',
                        className: 'order-additional-services-select',
                        templateOptions: {
                            id: 'additionalServicesIds',
                            label: 'Список дополнительных услуг',
                            size: 6,
                            options: [],
                            multiple: true
                        },
                        link: function(scope, el, attrs, ctrl) {
                            scope.$watch('to.options', function (value) {
                                var aOpt = $(el).find('ul.dropdown-menu').find('li.nya-bs-option').find('a');
                                aOpt.on('click', function () {
                                    var servName = $(this).text().trim();
                                    scope.$emit('onClickedAdditionalServiceItem:' + servName);
                                    $timeout(function () {
                                        var executorsElems = $($document).find('.service-executor').find('div.dropdown-menu.open');
                                        angular.forEach(executorsElems, function (item, idx) {
                                            if ((idx + 1) % 3 === 0) {
                                                $(item).addClass('pull-right');
                                            }
                                        })
                                    })
                                })
                            })
                        },
                        controller: function ($rootScope, $scope) {

                            AdditionalServiceFactory.getAllAdditionalServices().then(function (services) {

                                $scope.formState.additionalServices = services;
                                var addit_serv_executs = angular.copy($scope.model.additional_services_executors);
                                var additionalServ = [];

                                $timeout(function () {
                                    var opts = [];
                                    angular.forEach(services, function (service) {
                                        var item = {
                                            name: service.title + ' (' + service.price + ' руб.)',
                                            value: service.id,
                                            executors: []
                                        };

                                        angular.forEach(addit_serv_executs, function (serv) {
                                            if (serv.id === item.value) {
                                                item.executors = serv.executors;
                                                additionalServ.push(item);
                                            }
                                        });

                                        opts.push(item);
                                    });

                                    $scope.to.options = opts;

                                }).then(function () {
                                    $scope.model.additional_services_executors = additionalServ;
                                })
                            });
                        }
                    },
                    {
                        type: 'repeatSection',
                        key: 'additional_services_executors',
                        className: 'order-additional-services-executors-select',
                        templateOptions: {
                            label: 'Исполнители дополнительных услуг',
                            fields: [
                                {
                                    type: 'vSelect',
                                    key: 'executors',
                                    className: 'service-executor',
                                    templateOptions: {
                                        id: 'servicesExecutorsIds',
                                        label: 'Исполнители дополнительных услуг',
                                        size: 6,
                                        options: [],
                                        multiple: true
                                    },
                                    controller: function ($scope, $rootScope) {
                                        var executor_items = [],
                                            opts = [],
                                            checked_executors = angular.copy($scope.model.executors);

                                        $rootScope.$on('onClickedAdditionalServiceItem:' + $scope.model.name, function () {
                                            $scope.model.executors = [];
                                        });


                                        $timeout(function () {
                                            angular.forEach($scope.formState.additionalServices, function (serv) {

                                                var model_serv_id = $scope.model.value || $scope.model.id;

                                                if (model_serv_id === serv.id) {

                                                    $scope.to.label = serv.title;

                                                    angular.forEach(serv.possible_executors, function (pos_exec) {
                                                        var item = {
                                                            name: pos_exec.full_name,
                                                            value: pos_exec.id
                                                        };

                                                        angular.forEach(checked_executors, function (ex) {
                                                            if (angular.equals(ex.id || ex.value, item.value)) {
                                                                executor_items.push(item)
                                                            }
                                                        });

                                                        if (serv.possible_executors.length === 1) {
                                                            executor_items.push(item);
                                                        }

                                                        opts.push(item);
                                                    });
                                                }
                                            }, 300);

                                            $scope.to.options = opts;

                                        }).then(function () {
                                            $timeout(function () {
                                                $scope.model.executors = executor_items;
                                            })
                                        });
                                    }
                                }
                            ]
                        },
                        hideExpression: function ($viewValue, $modelValue, scope) {
                            return scope.model.additional_services_executors === undefined || scope.model.additional_services_executors.length === 0;
                        }
                    },
                    {
                        type: 'textarea',
                        key: 'details',
                        className: 'order-details-textarea',
                        templateOptions: {
                            id: 'orderDetailsId',
                            label: 'Дополнительная информация'
                        }
                    },
                    {
                        type: 'textarea',
                        key: 'executor_comment',
                        className: 'order-executor-comment-textarea',
                        templateOptions: {
                            id: 'executorCommentId',
                            label: 'Комментарий исполнителя'
                        }
                    },
                    {
                        type: 'simpleSelect',
                        key: 'where_was_found',
                        className: 'order-how-did-you-know-select',
                        defaultValue: 'Не задано',
                        templateOptions: {
                            label: 'Откуда о нас узнали?',
                            options: [],
                            size: 5
                        },
                        link: function(scope, el, attrs, ctrl) {
                            scope.$watch('to.options', function (value) {
                                var aOpt = $(el).find('div.dropdown-menu');
                                //if (aOpt.length > 0) {
                                //    aOpt.css('bottom: 100% !important; top: auto !important;');
                                //}
                            })
                        },
                        controller: function ($scope) {
                            var items = [
                                {'name': 'Не задано', 'value': 1},
                                {'name': 'Google', 'value': 2},
                                {'name': 'Yandex', 'value': 3},
                                {'name': 'Mail.ru', 'value': 4},
                                {'name': 'Second', 'value': 5},
                                {'name': 'VK', 'value': 6},
                                {'name': 'Посоветовали', 'value': 7},
                                {'name': 'Повторный', 'value': 8},
                                {'name': 'Листовка', 'value': 9},
                                {'name': 'Рассылка', 'value': 10},
                                {'name': 'Другое', 'value': 11}
                            ];

                            angular.forEach(items, function (item) {
                                if (angular.equals(item.name, $scope.model.where_was_found)) {
                                    $scope.model.where_was_found = item;
                                }
                            });
                            $scope.to.options = items;
                        }
                    },
                    {
                        type: 'vSelect',
                        key: 'discount',
                        defaultValue: {id: '1'},
                        className: 'order-discount-select',
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
                        type: 'input',
                        key: 'cost_of_the_way',
                        className: 'order-cost-of-the-way-input',
                        defaultValue: 0,
                        templateOptions: {
                            id: 'costWayId',
                            label: 'Стоимость дороги',
                            type: 'number'
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price',
                        className: 'order-total-price-input',
                        templateOptions: {
                            id: 'totalPriceId',
                            label: 'Стоимость заказа',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watchGroup(['model.price', 'model.additional_services_executors', 'model.cost_of_the_way'],
                                function (newValues) {

                                    var programPrice = newValues[0];
                                    var costOfTheWay = newValues[2];
                                    var sumServicesPrices = 0;
                                    var handledServices = [];

                                    angular.forEach($scope.formState.additionalServices, function (origService) {
                                        angular.forEach($scope.model.additional_services_executors, function (modelService) {
                                            if (origService.id === modelService.value && handledServices.indexOf(modelService.value) === -1) {
                                                sumServicesPrices += origService.price;
                                                handledServices.push(modelService.value);
                                            }
                                        })
                                    });

                                    programPrice = !!programPrice ? parseInt(programPrice) : 0;

                                    var price = programPrice + sumServicesPrices + costOfTheWay;
                                    $scope.model.total_price = Math.round(price / 100) * 100;
                                });
                        }
                    },
                    {
                        type: 'currencyInputType',
                        key: 'total_price_with_discounts',
                        className: 'order-total-price-input-with-discount',
                        templateOptions: {
                            id: 'totalPriceWithDiscountId',
                            label: 'Стоимость заказа с учетом скидки',
                            disabled: true
                        },
                        controller: function ($scope) {
                            $scope.$watchGroup([
                                    'model.price', 'model.additional_services_executors', 'model.discount', 'model.cost_of_the_way'],
                                function (newValues) {
                                    var programPrice = newValues[0];
                                    var discountPercent = 0;
                                    var sumServicesPrices = 0;
                                    var costOfTheWay = newValues[3];
                                    var handledServices = [];

                                    if ($scope.model.discount !== undefined) {
                                        angular.forEach($scope.formState.discounts, function (origDiscount) {
                                            if (origDiscount.id === $scope.model.discount.value) {
                                                discountPercent = origDiscount.value;
                                            }
                                        });
                                    }

                                    angular.forEach($scope.formState.additionalServices, function (origService) {
                                        angular.forEach($scope.model.additional_services_executors, function (modelService) {
                                            if (origService.id === modelService.value && handledServices.indexOf(modelService.value) === -1) {
                                                sumServicesPrices += origService.price;
                                                handledServices.push(modelService.value);
                                            }
                                        })
                                    });

                                    programPrice = !!programPrice ? parseInt(programPrice) : 0;

                                    var programPriceWithDiscount = programPrice - (programPrice * (discountPercent / 100));
                                    var price = programPriceWithDiscount + sumServicesPrices + costOfTheWay;
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

                //modelData.additional_services = [];
                //
                //if (data.additional_services.length > 0) {
                //    angular.forEach(data.additional_services, function (service) {
                //        modelData.additional_services.push({
                //            id: service.value.toString()
                //        });
                //    })
                //}

                modelData.additional_services_executors = [];

                if (data.additional_services_executors.length > 0) {
                    angular.forEach(data.additional_services_executors, function (serv_execs) {
                        var item = {
                            service_id: serv_execs.value,
                            executors: []
                        };

                        angular.forEach(serv_execs.executors, function (ex) {
                            item.executors.push({id: ex.value})
                        });

                        modelData.additional_services_executors.push(item);
                    })
                }

                if (data.details !== undefined && data.details) {
                    modelData.details = data.details.trim();
                }

                if (data.executor_comment !== undefined && data.executor_comment) {
                    modelData.executor_comment = data.executor_comment.trim();
                }

                modelData.where_was_found = !!data.where_was_found.name ? data.where_was_found.name : 'Не задано';
                modelData.cost_of_the_way = !!data.cost_of_the_way ? data.cost_of_the_way : 0;

                modelData.discount = {id: data.discount.value};
                modelData.total_price = data.total_price;
                modelData.total_price_with_discounts = data.total_price_with_discounts;

                return modelData;
            };

            return orderForm;
        }])
    .factory('ExecutorDayOffForm', [function () {
        var dayOffForm = {};

        dayOffForm.getFieldsOptions = function () {
            return [
                {
                    type: 'input',
                    key: 'user_profile',
                    hideExpression: 'true'
                },
                {
                    type: 'datePicker',
                    key: 'date',
                    defaultValue: moment(),
                    templateOptions: {
                        label: 'Дата'
                    },
                    controller: function ($scope) {
                        $scope.isOpenDate = false;

                        $scope.dateOptions = {
                            showWeeks: false,
                            startingDay: 1
                        };

                        if (typeof($scope.model.date) === 'string') {
                            $scope.model.date = moment($scope.model.date, 'YYYY-MM-DD');
                        }

                        $scope.model.date = $scope.model.date.toDate();
                    }
                },
                {
                    type: 'timePicker',
                    key: 'time_start',
                    defaultValue: '00:00',
                    templateOptions: {
                        label: 'с'
                    },
                    controller: function ($scope) {
                        $scope.isOpenTime = false;

                        $scope.timeOptions = {
                            showMeridian: false
                        };

                        var time = moment($scope.model.time_start, 'HH:mm');
                        $scope.model.time_start = moment(moment()).set({
                            hour: time.hours(),
                            minute: time.minutes()
                        }).toDate();
                    }
                },
                {
                    type: 'timePicker',
                    key: 'time_end',
                    defaultValue: '00:00',
                    templateOptions: {
                        label: 'до'
                    },
                    controller: function ($scope) {
                        $scope.isOpenTime = false;

                        $scope.timeOptions = {
                            showMeridian: false
                        };

                        var time = moment($scope.model.time_end, 'HH:mm');
                        $scope.model.time_end = moment(moment()).set({
                            hour: time.hours(),
                            minute: time.minutes()
                        }).toDate();
                    }
                },
                {
                    type: 'input',
                    key: 'created',
                    defaultValue: null,
                    className: 'created-date',
                    templateOptions: {
                        label: 'Создан',
                        disabled: true
                    },
                    controller: function ($scope) {
                        $scope.model.created = moment($scope.model.created).format('DD.MM.YYYY HH:mm');
                    },
                    hideExpression: function ($viewValue, $modelValue, scope) {
                        return !scope.model.created;
                    }
                }
            ]
        };

        dayOffForm.convertDataToModel = function (data) {
            var modelData = {};

            modelData.id = data.id;
            modelData.user_id = data.user_profile;
            modelData.date = moment(data.date).format('YYYY-MM-DD');
            modelData.time_start = moment(data.time_start).format('HH:mm');
            modelData.time_end = moment(data.time_end).format('HH:mm');

            return modelData;
        };

        return dayOffForm;
    }])
    .factory('ClientForm', [function () {
        var clientForm = {};

        clientForm.getFieldsOptions = function (currentClient) {
            return [
                {
                    type: 'input',
                    key: 'name',
                    templateOptions: {
                        id: 'clientNameId',
                        label: 'Имя клиента',
                        required: true
                    },
                    controller: function ($scope) {
                        if (currentClient !== undefined && !!currentClient) {
                            $scope.model.name = currentClient.name;
                        }
                    }
                },
                {
                    type: 'phoneInputType',
                    key: 'phone',
                    className: 'order-client-popup-phone',
                    templateOptions: {
                        id: 'clientPhoneId',
                        label: 'Телефон клиента',
                        required: true
                    },
                    controller: function ($scope) {
                        $scope.model.phone = parseInt($('.order-client-select').find('input').val());

                        if (currentClient !== undefined && currentClient.phone !== undefined) {
                            $scope.model.phone = currentClient.phone.trimPhoneCountryCode();
                        }

                        $scope.$watch('model.phone', function (newVal) {
                            if (newVal !== undefined) {
                                $scope.model.phone = parseInt($scope.model.phone);
                            }
                        })
                    }
                },
                {
                    type: 'phoneInputType',
                    key: 'phone_2',
                    className: 'order-client-popup-phone',
                    templateOptions: {
                        id: 'clientPhoneId',
                        label: 'Доп. телефон',
                        required: false
                    },
                    controller: function ($scope) {
                        $scope.model.phone_2 = '';

                        if (currentClient !== undefined && currentClient.phone2 !== undefined && !!currentClient.phone2) {
                            $scope.model.phone_2 = currentClient.phone2.trimPhoneCountryCode();
                        }

                        $scope.$watch('model.phone_2', function (newVal) {
                            if (newVal !== undefined) {
                                $scope.model.phone_2 = parseInt($scope.model.phone_2);
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
                    hideExpression: function ($viewValue, $modelValue, scope) {
                        return true
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
                    key: 'executor_rate',
                    id: 'additionalServiceExecutorRate',
                    templateOptions: {
                        label: 'Ставка исполнителя',
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
            modelData.executor_rate = data.executor_rate;
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
