// ==UserScript==
// @name        InstaSynchP Poll Menu
// @namespace   InstaSynchP
// @description Improves the poll menu
// @version     1
// @author      Zod-
// @source      https://github.com/Zod-/InstaSynchP-Poll-Menu
// @license     GPL-3.0

// @include     http://*.instasynch.com/*
// @include     http://instasynch.com/*
// @include     http://*.instasync.com/*
// @include     http://instasync.com/*
// @grant       none
// @run-at      document-start

// @require https://greasyfork.org/scripts/5647-instasynchp-library/code/InstaSynchP%20Library.js
// ==/UserScript==
function PollMenu(version) {
    this.version = version;
    this.oldPolls = [{
        'title': '',
        'options': [{
            'option': '',
            'votes': 0
        }]
    }];
    this.index = 0;
}
PollMenu.prototype = {
    get index() {
        return this._index % this.oldPolls.length;
    },
    set index(value) {
        if (value < 0) {
            value = this.oldPolls.length - 1;
        }
        this._index = value;
    }
};

function pollMenuRef() {
    return window.plugins.pollMenu;
}

PollMenu.prototype.addOption = function () {
    "use strict";
    $('#create-poll').append(
        $('<input/>', {
            'class': 'formbox create-poll-option',
            'placeholder': 'Option'
        })
    ).append($('<br>'));
};

PollMenu.prototype.removeOption = function () {
    "use strict";
    $('#create-poll > :last-child').remove();
    $('#create-poll > :last-child').remove();
};

PollMenu.prototype.copyOld = function (poll) {
    var i = 0;
    $('#clear-poll-options').click();

    //add more rows until we got enough to fit the old poll
    if ($('#create-poll > .create-poll-option').length < poll.options.length) {
        while (poll.options.length > $('#create-poll > .create-poll-option').length) {
            $('#add-poll-options').click();
        }
    }

    //set the title
    $('#create-poll > #title').val(htmlDecode(poll.title));

    //set the options
    $(".create-poll-option").each(function () {
        $(this).val(htmlDecode(poll.options[i].option));
        i += 1;
        if (i >= poll.options.length) {
            return false;
        }
    });
};

PollMenu.prototype.preConnect = function () {
    "use strict";
    var th = pollMenuRef();
    cssLoader.add({
        'name': 'poll-menu',
        'url': 'https://cdn.rawgit.com/Zod-/InstaSynchP-Poll-Menu/eb259a8da965853880a019ae749fcb08b5c3945f/pollMenu.css',
        'autoload': true
    });

    //recreate the poll menu to add +, -, copy old and clear buttons
    //at the top rather than the bottom so they don't move down when adding
    //more rows
    $('#create-pollBtn').text('Poll Menu');
    $('#create-poll').empty().append(
        $('<button>', {
            'id': 'add-poll-options'
        }).text('+').click(function () {
            //add another row if there are less than 10
            if ($('#create-poll > .create-poll-option').length < 10) {
                th.addOption();
            }
        })
    ).append(
        $('<button>', {
            'id': 'remove-poll-options'
        }).text('-').click(function () {
            //remove a row
            if ($('#create-poll > .create-poll-option').length > 1) {
                th.removeOption();
            }
        })
    ).append(
        $('<button>', {
            'id': 'browse-poll-left'
        }).text('<').click(function () {
            if (th.oldPolls.length > 0) {
                th.index -= 1;
                th.copyOld(th.oldPolls[th.index]);
            }
        })
    ).append(
        $('<button>', {
            'id': 'browse-poll-right'
        }).text('>').click(function () {
            if (th.oldPolls.length > 0) {
                th.index += 1;
                th.copyOld(th.oldPolls[th.index]);
            }
        })
    ).append(
        $('<button>', {
            'id': 'clear-poll-options'
        }).text('Clear').click(function () {
            //just clear the options and title
            $('#create-poll > #title').val('');
            $(".create-poll-option").val('');
        })
    ).append(
        $('<button>', {
            'id': 'create-poll-button'
        }).text('Create').click(function () {
            //copied from InstaSynch core.js
            var poll = {};
            poll.title = $("#title").val();
            poll.options = [];
            $(".create-poll-option").each(function () {
                if ($(this).val().trim() !== "") {
                    poll.options.push($(this).val().trim());
                }
            });
            window.global.sendcmd("poll-create", poll);
        })
    ).append(
        $('<br>')
    ).append(
        $('<input/>', {
            'class': 'formbox',
            'id': 'title',
            'placeholder': 'Poll Title'
        })
    ).append(
        $('<br>')
    );
    for (var i = 0; i < 4; i += 1) {
        th.addOption();
    }
    //read the current poll when the script got loaded after we got connected
    if (window.plugins.core.connected) {
        var poll = {};
        poll.title = $(".poll-title").text();
        poll.options = [];
        $('.poll-item').each(function () {
            poll.options.push({
                votes: $(this).children().eq(0).text(),
                option: $(this).children().eq(1).text()
            });
        });
        th.oldPolls.push(poll);
        if (poll.options.length !== 0) {
            window.createPoll(poll);
        }
    }
};

PollMenu.prototype.executeOnce = function () {
    "use strict";
    var th = pollMenuRef();
    events.on('CreatePoll', function (poll) {
        //make a deep copy of the poll
        th.oldPolls.push($.extend(true, {}, poll));
    }, true);
};

window.plugins = window.plugins || {};
window.plugins.pollMenu = new PollMenu("1");
