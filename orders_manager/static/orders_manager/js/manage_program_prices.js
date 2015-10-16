function InitPricesOnProgramClick() {
    $(".prices-block").append(
        '<script src="/static/orders_manager/js/price_format.min.js">\x3C/script>' +
        '<script src="/static/orders_manager/js/format_inputs.js">\x3C/script>'
    );

    $("#send-new-price-form-btn").on("click", CreateProgramPrice);

    $(".program-line").on("click", function () {
        $(".program-line").removeClass("checked");
        $(this).addClass("checked");
        ShowProgramPrices()
    });
    $(".program-line:first").click();

    $("#id_price").on("input", function () {
        FormatNumber($(this));
        FormatCurrency($(this));
    });

    $("#id_duration").on("input", function () {
        FormatNumber($(this));
    });
}

function FormatAllDurationsAndPrices() {
    $("input[id^=id_][id$=duration]").each(function () {
        FormatNumber($(this));
        $(this).not("#id_duration").attr("readonly", true);
    });

    $("input[id^=id_][id$=price]").each(function () {
        FormatNumber($(this));
        FormatCurrency($(this));
        $(this).not("#id_price").attr("readonly", true);
    });
}

function InitDeletePriceOnClick(program_id) {
    $(".price-form").find(".delete-btn").on("click", function () {
        var duration = $(this)
            .closest(".price-form")
            .find("input[id^=id_form][id$=duration]").val();
        $.ajax({
            type: "POST",
            url: "/handbooks/program/price/delete/",
            data: {
                duration: duration,
                program_id: program_id
            },
            success: function (resp_data) {
                ShowProgramPrices()
            },
            error: function (xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
            }
        })
    });
}

function ShowProgramPrices() {
    var program_id = GetCheckedProgramId();
    $.ajax({
        type: "get",
        url: "/handbooks/program/" + program_id + "/prices/",
        success: function (resp_data) {
            program_id = GetCheckedProgramId();
            if (program_id == resp_data.program_id) {
                var body = $(".prices__body").hide();
                body.html(resp_data.html_page).fadeIn(300);
                FormatAllDurationsAndPrices();
                InitDeletePriceOnClick(program_id);
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            //alert(xhr.responseText);
        }
    })
}

function CreateProgramPrice() {
    var duration = $("#id_duration").val();
    var price = $("#id_price").asNumber();
    var program_id = GetCheckedProgramId();
    $.ajax({
        type: "POST",
        url: "/handbooks/program/price/create/",
        data: {
            duration: duration,
            price: price,
            program_id: program_id
        },
        success: function (resp_data) {
            program_id = GetCheckedProgramId();
            if (program_id == resp_data.program_id) {
                $("#id_duration").val('');
                $("#id_price").val('');
                var body = $(".prices__body").hide();
                body.html(resp_data.html_page).fadeIn(300);
                FormatAllDurationsAndPrices();
                InitDeletePriceOnClick(program_id);
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            //alert(xhr.responseText);
        }
    })
}

function GetCheckedProgramId() {
    return $(".programs-list").find(".checked").attr("id").replace("program-", "");
}
