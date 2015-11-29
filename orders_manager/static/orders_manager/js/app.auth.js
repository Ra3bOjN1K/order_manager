angular.module('OrderManagerApp')
    .run(['Auth', function(Auth) {
        Auth.loadPermissions()
    }])
    .factory('Auth', ['Restangular', function (Restangular) {
        var restAngular = Restangular.withConfig(function (RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v1/');
            RestangularConfigurer.setRequestSuffix('/');
        });

        var _permissionsService = restAngular.all('permissions');

        var _loadPermPromise = null;

        var _allPermissions = [],
            _user = null;

        return {
            loadPermissions: function() {
                if (!!_loadPermPromise) {
                    return _loadPermPromise
                }

                _loadPermPromise = _permissionsService.getList().then(function(data) {
                    if (data.length > 0) {
                        _user = data[0].user;
                        _allPermissions = data[0].permissions;
                    }
                }).finally(function() {
                    _loadPermPromise = null;
                });

                return _loadPermPromise
            },

            hasPermission: function (permission) {
                function _hasPermission(permission) {
                    var hasPerm = false;
                    angular.forEach(_allPermissions, function(perm) {
                        if (angular.equals(permission, perm)) {
                            hasPerm = true;
                        }
                    });
                    return hasPerm
                }

                if (_loadPermPromise) {
                    _loadPermPromise.then(function() {
                        return _hasPermission(permission)
                    })
                }
                else {
                    return _hasPermission(permission)
                }
            },

            //isSuperuserOrManager: function() {
            //    var hasPriv = !!_user && (_user.role === 'Менеджер' || _user.role === 'Администратор');
            //    return hasPriv
            //},

            getUser: function() {
                return !!_user ? _user : {}
            }
        }
    }]);