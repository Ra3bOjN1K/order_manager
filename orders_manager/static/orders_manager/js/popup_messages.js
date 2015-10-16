function getPopupNoticeHtml(msg) {
        return '<div class="pop-message hidden">' +
        '<div class="msg-window">' +
        '<span class="msg-window__notice">' + msg + '</span>' +
        '<div class="msg-window__btns">' +
        '<a class="cancel-btn">Нет</a>' +
        '<a class="accept-btn">Да</a>' +
        '</div>' +
        '</div>' +
        '</div>';
}

function DeleteUser(user_name) {
    var msg = 'Вы действительно хотите удалить пользователя?';
    $(".content").append(getPopupNoticeHtml(msg));

    var pop_msg = $(".pop-message");
    var btns = $(".msg-window__btns");
    var no = btns.find(".cancel-btn");
    var yes = btns.find(".accept-btn");
    pop_msg.removeClass('hidden');
    no.on("click", function () {
        pop_msg.addClass("hidden");
        $(".pop-message").remove()
    });
    yes.on("click", function () {
        $.ajax({
            url: '/user/' + user_name + '/delete/',
            success: function (data) {
                pop_msg.addClass("hidden");
                location.reload();
                $(".pop-message").remove()
            }
        });
    })
}

function DeleteProgram(program_id) {
    var msg = 'Вы действительно хотите удалить программу?';
    $(".content").append(getPopupNoticeHtml(msg));

    var pop_msg = $(".pop-message");
    var btns = $(".msg-window__btns");
    var no = btns.find(".cancel-btn");
    var yes = btns.find(".accept-btn");
    pop_msg.removeClass('hidden');
    no.on("click", function () {
        pop_msg.addClass("hidden");
        $(".pop-message").remove()
    });
    yes.on("click", function () {
        $.ajax({
            url: '/handbooks/program/' + program_id + '/delete/',
            success: function (data) {
                pop_msg.addClass("hidden");
                location.reload();
                $(".pop-message").remove()
            }
        });
    })
}
