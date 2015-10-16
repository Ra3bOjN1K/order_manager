function FormatNumber(elem) {
    var val = elem.val().split('.')[0];
    $.each(val.split(''), function (idx, v) {
        if (!$.isNumeric(v)) {
            val = val.replace(v, '')
        }
    });
    elem.val(val);

    return elem
}

function FormatCurrency(elem) {
    elem.formatCurrency({
        symbol: '',
        positiveFormat: '%n %s',
        negativeFormat: '-%n %s',
        digitGroupSymbol: ' ',
        roundToDecimalPlace: 0,
        groupDigits: true
    });

    return elem.val(elem.val().trim())
}

