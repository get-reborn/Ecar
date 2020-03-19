let btn_delete_card = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'" +
    "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' onclick='deleteCard(this)'" +
    "stroke-linejoin='round' class='card-btn' style='float:right'>" +
    "<polyline points='3 6 5 6 21 6'></polyline>" +
    "<path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>" +
    "<line x1='10' y1='11' x2='10' y2='17'></line>" +
    "<line x1='14' y1='11' x2='14' y2='17'></line></svg>";

let btn_modify_card = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'" +
    "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' onclick='modifyCard(this)'" +
    "stroke-linejoin='round' class='card-btn' style='float:right'>" +
    "<path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'></path></svg>";

let btn_modify_ok = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'" +
    "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' id='btn-modify-ok' " +
    "stroke-linejoin='round' class='modify-btn' style='float:right' display='none'>" +
    "<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>" +
    "<polyline points='22 4 12 14.01 9 11.01'></polyline></svg>";

let btn_modify_cancel = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'" +
    "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' id='btn-modify-cancel' " +
    "stroke-linejoin='round' class='modify-btn' style='float:right' display='none'>" +
    "<circle cx='12' cy='12' r='10'></circle>" +
    "<line x1='15' y1='9' x2='9' y2='15'></line>" +
    "<line x1='9' y1='9' x2='15' y2='15'></line></svg>";

let other_options = btn_delete_card + btn_modify_card + btn_modify_ok + btn_modify_cancel;
// 是否正在修改卡片
let card_modifying = false;
// 权限
let admins_permission = false;

function findCardSelector(deck_name) {
    let h3 = $("h3:contains('" + deck_name + "')").map(function () {
        if ($(this).text() === deck_name)
            return this;
    });
    let card = h3.parents('.card');
    return card;
}

// 搜索功能
$('#input-search').on('keyup', function () {
    let rex = new RegExp($(this).val(), 'i');
    let items = $('.searchable-container .items');
    items.hide();
    items.filter(function () {
        return rex.test($(this).text());
    }).show();
});
// 点击添加卡组的按钮后
$('#btn-add-deck').on('click', function () {
    swal({
        title: "Add Deck",
        text: "name?",
        input: 'text',
        showCancelButton: true,
        cancelButtonText: "cancel",
        closeOnConfirm: false,
        padding: '2em',
    }).then(function (result) {
        if (result.value) {
            let form_data = new FormData();
            form_data.append('deck_name', result.value);
            $.ajax({
                url: "/deck/CreateDeck",
                type: "POST",
                data: form_data,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "json",
                success: function (ret) {
                    if (ret.status) {
                        swal("Good job!", "Successfully add!", "success");
                        addDeck(result.value, 0);
                    } else {
                        Oops(ret.data);
                    }
                },
                error: function () {
                    Oops("");
                }
            })
        }
    });
});
// 点击添加卡片的按钮后
$('#btn-add-card').on('click', function () {
    let form_data = new FormData();
    let input_front = $('#input-add-front'), input_back = $('#input-add-back');
    if (input_front.val() === "" || input_back.val() === "") {
        swal({
            type: 'error',
            title: 'The input field is empty',
            padding: '2em'
        });
        return;
    }
    form_data.append('front_text', input_front.val());
    form_data.append('back_text', input_back.val());
    $.ajax({
        url: "/card/addCard",
        type: "POST",
        data: form_data,
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (result) {
            if (result.status) {
                let table = $('#card-table').DataTable();
                table.row.add([input_front.val(), input_back.val(), other_options]).draw();
                input_front.val("");
                input_back.val("");
                let card = findCardSelector(result.data.deck_name);
                if (result.data.card_amount < 5)
                    card.append($("<div class='child'></div>"));
                let p = card.children().children('p');
                p.text(result.data.card_amount + " cards");
            }
        },
        error: function () {
            Oops("");
        }
    })
});

$(function () {
    let deck_a = $('#deck_a');
    deck_a.attr("aria-expanded", true);
    deck_a.attr("data-active", true);
    showDecks();
    $('#card-table').DataTable({
        "bLengthChange": false, //开关，是否显示每页显示多少条数据的下拉框
        "searching": false,
        "ordering": false, // 禁止排序
        "bInfo": false,
        "bAutoWidth": false,
        // "columns": [
        //     {"orderDataType": "dom-text", type: 'string'},
        //     {"orderDataType": "dom-text", type: 'string'},
        // ],
        "columns": [
            {width: "40%"},
            {width: "40%"},
            {width: "20%"}
        ],
        "oLanguage": {
            "oPaginate": {
                "sPrevious": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
                "sNext": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
            },
            "sInfo": "Showing page _PAGE_ of _PAGES_",
            "sSearch": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
            "sSearchPlaceholder": "Search...",
            "sLengthMenu": "Results :  _MENU_",
        },
        "stripeClasses": [],
        "pageLength": 6
    });
});

function addDeck(deck_name, amount) {
    let divElement = document.createElement("div");
    let deck_html = $("<div class='col-xl-3 col-lg-3 col-md-6 col-sm-6 items' style='--cards:" + amount + ";'>\n" +
        "                  <div class='card'>\n" +
        "                      <div class='child' data-target='#cardModal' data-toggle='modal' onclick='showCards(" + deck_name + ")'>\n" +
        "                          <h3>" + deck_name + "</h3>\n" +
        "                          <p>" + amount + " cards</p>\n" +
        "                          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' onclick='deleteDeck(this)'" +
        "                          viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' " +
        "                          stroke-linecap='round' stroke-linejoin='round' class='feather feather-trash-2 delete-deck'>" +
        "                              <polyline points='3 6 5 6 21 6'></polyline>" +
        "                              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>" +
        "                              <line x1='10' y1='11' x2='10' y2='17'></line>" +
        "                              <line x1='14' y1='11' x2='14' y2='17'></line></svg>" +
        "                        </div>\n" +
        "                    </div>\n" +
        "              </div>"
        )
    ;
    $('.deck-container').append(deck_html);
    //精确查找到所在卡组
    let card = findCardSelector(deck_name);
    for (let i = 0; i < amount - 1 && 5; i++)
        card.append($("<div class='child'></div>"));
}

function deleteDeck(svg) {
    let ev = window.event || arguments.callee.caller.arguments[0];
    if (window.event) ev.cancelBubble = true;
    else {
        ev.stopPropagation();
    }

    let deck_name = $(svg).prev().prev().html();
    swal({
        title: 'Sure?',
        type: 'info',
        html: 'Are you sure to delete it?',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText:
            '<i class="flaticon-checked-1"></i> Great!',
        confirmButtonAriaLabel: 'Thumbs up, great!',
        cancelButtonText:
            '<i class="flaticon-cancel-circle"></i> Cancel',
        cancelButtonAriaLabel: 'Thumbs down',
        padding: '2em'
    }).then(function (result) {
        if (result.value) {
            let form_data = new FormData();
            form_data.append('deck_name', deck_name);
            $.ajax({
                url: "/deck/DeleteDeck",
                type: "POST",
                data: form_data,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "json",
                success: function (ret) {
                    if (ret.status) {
                        $(svg).parents('.items').remove()
                    } else {
                        Oops(ret.data);
                    }
                },
                error: function () {
                    Oops("");
                }
            })
        }
    })
}

function deleteCard(svg) {
    let front_text = $(svg).parent().prev().prev().html();
    swal({
        title: 'Sure?',
        type: 'info',
        html: 'Are you sure to delete it?',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText:
            '<i class="flaticon-checked-1"></i> Great!',
        confirmButtonAriaLabel: 'Thumbs up, great!',
        cancelButtonText:
            '<i class="flaticon-cancel-circle"></i> Cancel',
        cancelButtonAriaLabel: 'Thumbs down',
        padding: '2em'
    }).then(function (result) {
        if (result.value) {
            let form_data = new FormData();
            form_data.append('front_text', front_text);
            $.ajax({
                url: "/card/RemoveCard",
                type: "POST",
                data: form_data,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "json",
                success: function (ret) {
                    if (ret.status) {
                        // $(svg).parents('tr').remove();
                        let table = $('#card-table').DataTable();
                        table.row($(svg).parents('tr')).remove().draw();
                        let card = findCardSelector(ret.data.deck_name);
                        if (ret.data.card_amount > 0)
                            card.children("div:last").remove();
                        let p = card.children().children('p');
                        p.text(ret.data.card_amount + " cards");
                    } else {
                        Oops(ret.data);
                    }
                },
                error: function () {
                    Oops("");
                }
            })
        }
    })
}

function modifyCard(svg) {
    // 如果正在修改，提示报错
    if (card_modifying || !admins_permission) {
        Oops('');
        return;
    }
    card_modifying = true;
    let back_td = $(svg).parent().prev();
    let front_td = back_td.prev();
    let front_text = front_td.html();
    let back_text = back_td.html();

    let front_input = $("<input type='text' class='form-control' id='front-input'>");
    front_input.val(front_text);
    front_td.html("");
    front_td.append(front_input);
    let back_input = $("<input type='text' class='form-control' id='back-input'>");
    back_input.val(back_text);
    back_td.html("");
    back_td.append(back_input);

    let tr = front_td.parent();
    let hidden_svg = tr.find('svg:hidden');
    let visible_svg = tr.find('svg:visible');
    hidden_svg.show();
    visible_svg.hide();

    $('#btn-modify-ok').unbind("click");
    $('#btn-modify-cancel').unbind("click");

    $('#btn-modify-ok').on("click", function () {
        let form_data = new FormData();
        form_data.append('new_front_text', front_input.val());
        form_data.append('front_text', front_text);
        form_data.append('new_back_text', back_input.val());
        $.ajax({
            url: "/card/ModifyCard",
            type: "POST",
            data: form_data,
            cache: false,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (result) {
                if (result.status) {
                    front_td.html(front_input.val());
                    back_td.html(back_input.val());
                    hidden_svg.hide();
                    visible_svg.show();
                    card_modifying = false;
                } else
                    Oops(result.data)
            },
            error: function () {
                Oops("");
            }
        });
    });

    $('#btn-modify-cancel').on("click", function () {
        front_td.html(front_text);
        back_td.html(back_text);
        hidden_svg.hide();
        visible_svg.show();
        card_modifying = false;
    })
}

function showDecks() {
    $.ajax({
        url: "/deck/ShowDecks",
        type: "POST",
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (result) {
            if (result.status) {
                let data = result.data;
                for (let i = 0; i < data.decks_name.length; i++) {
                    addDeck(data.decks_name[i], data.decks_amount[i]);
                }
            } else {
                swal({
                    type: 'error',
                    title: 'Oops...',
                    padding: '2em'
                })
            }
        },
        error: function () {
            swal({
                type: 'error',
                title: 'Oops...',
                padding: '2em'
            })
        }
    })
}

function showCards(deck_name) {
    card_modifying = false;
    $('#cardModalCenterTitle').html(deck_name);
    let form_data = new FormData();
    form_data.append('deck_name', deck_name);
    let table = $('#card-table').DataTable();
    $.ajax({
        url: "/card/ShowCards",
        type: "POST",
        data: form_data,
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (result) {
            if (result.status) {
                // 卡组有卡片
                let data = result.data;
                table.clear();
                for (let i = 0; i < data.front_text.length; i++) {
                    table.row.add([data.front_text[i], data.back_text[i], other_options]).draw();
                }
            } else {
                // 卡组没卡片
                table.clear().draw();
            }
            applyPermission();
        },
        error: function () {
            table.clear().draw();
            Oops("");
        }
    })
}

function applyPermission() {
    $.ajax({
        url: "/card/ApplyPermission",
        type: "POST",
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (result) {
            admins_permission = !!result.status;
        },
        error: function () {
            admins_permission = false;
        }
    });
}

function Oops(info) {
    swal({
        type: 'error',
        title: 'Oops...',
        text: info,
        padding: '2em'
    })
}