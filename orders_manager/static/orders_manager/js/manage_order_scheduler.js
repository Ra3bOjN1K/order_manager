function InitScheduler() {
    scheduler.config.xml_date = "%Y-%m-%d %H:%i";
    //scheduler.config.server_utc = true;
    scheduler.init('scheduler_here', new Date(), "month");
    scheduler.locale.labels.section_template = "";
    scheduler.config.lightbox.sections = [
        {
            name: "template",
            type: "template",
            map_to: "order_template"
        }
    ];

    scheduler.attachEvent("onBeforeEventCreated", function (id) {
        return false;
    });

    scheduler.attachEvent("onBeforeLightbox", function (id) {
        var ev = scheduler.getEvent(id);
        $.ajax({
            url: "/order/create/",
            data: {
                start_date: new Date(ev.start_date).toUTCString()
            },
            success: function (data) {
                $(".dhx_cal_template").append(data.html);
                InitCreateOrderForm();
            },
            error: function (xhr, textStatus, errorThrown) {
                //alert(xhr.responseText);
            }
        });
        return true;
    });

    //var events = [
    //    {
    //        id: 1,
    //        text: "Meeting",
    //        start_date: "2015-10-08 14:00",
    //        end_date: "2015-10-08 17:00",
    //        room: 315,
    //        holder: "Luk"
    //    },
    //    {
    //        id: 2,
    //        text: "Conference",
    //        start_date: "2015-10-06 12:00",
    //        end_date: "2015-10-06 19:00"
    //    },
    //    {
    //        id: 3,
    //        text: "Interview",
    //        start_date: "2015-10-10 09:00",
    //        end_date: "2015-10-10 10:00"
    //    }
    //];
    //
    //scheduler.parse(events, "json");//takes the name and format of the data source
}

function InitCreateOrderForm() {
    InitCreateClientBlock();
    InitAutocompleteClientInput();
    InitDateTimePicker();

    $(".order-block").append(
        '<script src="/static/orders_manager/js/price_format.min.js">\x3C/script>' +
        '<script src="/static/orders_manager/js/format_inputs.js">\x3C/script>'
    );

    InitListenerOnProgramChange();
    InitListenerOnAdditionalServiceChange();
}

function InitCreateClientBlock() {
    $(".create-client-btn").on("click", function () {
        var $create_client_btn = $(this);
        var $create_clint_form = $("#create-client");
        $create_client_btn.toggleClass("checked", 0);
        if ($create_client_btn.hasClass("checked")) {
            $create_clint_form.stop(true, true).animate({
                'margin-top': '0'
            }, 500, "easeOutExpo");

            $(".cancel-btn").on("click", function () {
                if ($create_client_btn.hasClass("checked")) {
                    $create_client_btn.click();
                }
            });

            $create_clint_form.find(".add-client-btn").on("click", function () {
                $.ajax({
                    url: "/client/simple_create/",
                    method: "post",
                    data: {
                        "client_name": $("#id_name").val(),
                        "phone": $("#id_phone").val(),
                        "child_name": $("#id_child_name").val(),
                        "child_age": $("#id_child_age").val(),
                        "celebrate_date": $("#id_celebrate_date").val()
                    },
                    success: function (data) {
                        $("#id_name").val('');
                        $("#id_phone").val('');
                        $("#id_child_name").val('');
                        $("#id_child_age").val('');
                        if ($create_client_btn.hasClass("checked")) {
                            $create_client_btn.click();
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        //alert(xhr.responseText);
                    }
                });
            });
        }
        else {
            $create_clint_form.stop(true, true).animate({
                'margin-top': '-210px'
            }, 500, "easeOutExpo");
        }
    });
}

function InitAutocompleteClientInput() {
    $(".order-block").after('<script src="/static/orders_manager/js/jquery-ui.min.js">\x3C/script>');

    $("#id_client").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "/customers/search/",
                data: {
                    q: request.term
                },
                success: function (data) {
                    response($.map(data.clients, function (client) {
                        return {
                            value: "[" + client.phone + "] " + client.name,
                            id: client.id
                        };
                    }));
                }
            });
        },
        minLength: 0,
        response: function (event, ui) {
            $(".children-group").html("");
        },
        select: function (event, ui) {
            LoadClientChildren(ui.item.id);
        },
        open: function () {
            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
        },
        close: function () {
            $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
        }
    });
}

function InitDateTimePicker() {
    $('#id_celebrate_date').appendDtpicker({
        "closeOnSelected": true,
        "firstDayOfWeek": 1,
        "minuteInterval": 15,
        "locale": "ru",
        "dateFormat": "Дата: DD.MM.YYYY   Время: hh:mm"
    });
}

function LoadClientChildren(client_id) {
    $.ajax({
        url: "/customer/" + client_id + "/children/",
        success: function (data) {
            $(".children-group").replaceWith(data.children_html);
        },
        error: function (xhr, textStatus, errorThrown) {
            //alert(xhr.responseText);
        }
    })
}

function InitListenerOnProgramChange() {
    $("select#id_program").on("click", function () {
        LoadProgramInfo($(this).val());
    });
}

function LoadProgramInfo(program_id) {
    $.ajax({
        url: "/program/" + program_id + "/info/",
        success: function (data) {
            $("#possible_program_executors").replaceWith(data.executors_html);

            var $duration = $('#id_duration');

            $.each(data.prices, function (duration, price) {
                $duration.append(new Option(duration + " мин", duration));
            });

            $duration.change(function () {
                $("#id_price").val(data.prices[$duration.val()]);
                FormatPrices();
            });
            $duration.change();
        },
        beforeSend: function (xhr, opts) {
            $("#id_duration").empty();
        },
        error: function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
        }
    });
}

function InitListenerOnAdditionalServiceChange() {
    $("#id_program").change(function () {
        LoadProgramInfo($(this).val());
    });
}

function FormatPrices() {
    $("#id_price, #id_total_price, #id_total_price_with_discounts").each(function () {
        FormatNumber($(this));
        FormatCurrency($(this));
    });
}
