//搜索功能
$('#input-search').on('keyup', function () {
    let rex = new RegExp($(this).val(), 'i');
    let items = $('.searchable-container .items');
    items.hide();
    items.filter(function () {
        return rex.test($(this).text());
    }).show();
});

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
                url: "/deck/AddDeck",
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
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: ret.data,
                            padding: '2em'
                        })
                    }
                },
                error: function () {
                    swal("Change Error!", "error");
                }
            })
        }
    });
});

$(function () {
    let deck_a = $('#deck_a');
    deck_a.attr("aria-expanded", true);
    deck_a.attr("data-active", true);
    showDecks();
});

function addDeck(deck_name, amount) {
    let divElement = document.createElement("div");
    let deck_html = $("<div class='col-xl-2 col-lg-3 col-md-6 col-sm-6 items' style='--cards:" + amount + ";' id=deckDiv_" + deck_name + ">\n" +
        "                  <div class='card'>\n" +
        "                      <div class='child'>\n" +
        "                          <h3>" + deck_name + "</h3>\n" +
        "                          <p>" + amount + " cards</p>\n" +
        "                          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' data-name=" + deck_name + "" +
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
    $(document).on('click', '.delete-deck', function (e) {
        e.stopPropagation();    //防止事件冒泡到DOM树上，也就是不触发的任何前辈元素上的事件
        let deck_name = $(this).attr('data-name');
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
                deleteDeck(deck_name)
            }
        })
    });
}

function deleteDeck(deck_name) {
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
                $('#deckDiv_' + deck_name).remove();
            } else {
                swal({
                    type: 'error',
                    title: 'Oops...',
                    text: ret.data,
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

function showDecks() {
    let form_data = new FormData();
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
                swal(result.data, "error");
            }
        },
        error: function () {
            swal("Change Error!", "error");
        }
    })
}