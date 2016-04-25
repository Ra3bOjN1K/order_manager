var app = angular.module('OrderManagerApp');

app.factory('OrderWindowService', [function () {

    var _windowIsOpened = false;
    var _openedOrderId = null;
    var _checkedDate = null;

    return {
        createOrder: function () {
            _windowIsOpened = true;
        },

        editOrder: function (orderId) {
            _windowIsOpened = true;
            _openedOrderId = orderId;
        },

        closeWindow: function () {
            _windowIsOpened = false;
            _openedOrderId = null;
        },

        isWindowOpened: function () {
            return _windowIsOpened;
        },

        getOrderId: function () {
            return _openedOrderId;
        },

        setCheckedDate: function (date) {
            _checkedDate = date;
        },

        getCheckedDate: function () {
            return _checkedDate;
        }
    }
}]);
