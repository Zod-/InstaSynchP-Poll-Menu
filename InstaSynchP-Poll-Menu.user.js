// ==UserScript==
// @name        InstaSynchP Poll Menu
// @namespace   InstaSynchP
// @description Improves the poll menu
// @version     1.0.6
// @author      Zod-
// @source      https://github.com/Zod-/InstaSynchP-Poll-Menu
// @license     MIT

// @include     *://instasync.com/r/*
// @include     *://*.instasync.com/r/*
// @grant       none
// @run-at      document-start

// @require https://greasyfork.org/scripts/5647-instasynchp-library/code/InstaSynchP%20Library.js
// ==/UserScript==

function PollMenu(version, url) {
  "use strict";
  this.version = version;
  this.name = 'InstaSynchP Poll Menu';
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

PollMenu.prototype.copyOld = function (poll) {
  "use strict";
  var i = 0,
    sel = '#create-poll > .create-poll-option-div',
    len = poll.options.length - $(sel).length + 1;
  $('#clear-poll-options').click();

  //add more rows until we got enough to fit the old poll
  if ($(sel).length < poll.options.length) {
    for (i = 0; i < len; i += 1) {
      $('.poll-create-controls .add-poll-options').click();
    }
  }

  //set the title
  $('#title').val(htmlDecode(poll.title));

  i = 0;
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
  var th = this;
  cssLoader.add({
    'name': 'poll-menu',
    'url': 'https://rawgit.com/Zod-/InstaSynchP-Poll-Menu/5214823bc1a16de90f0134c0794efaa9b24494a7/pollMenu.css',
    'autoload': true
  });

  function enableDisableButtons() {
    var sel = '#create-poll > .create-poll-option-div';
    $('.remove-poll-options').attr('disabled', $(sel).length <= 1);
    $('.add-poll-options').attr('disabled', $(sel).length >= 10);
  }

  function removeOption(index) {
    var sel = '#create-poll .create-poll-option-div';
    $(sel).eq(index).remove();
    enableDisableButtons();
  }

  function addOption(index) {
      var sel = '#create-poll > .create-poll-option-div',
        pollOptionElement = $('<div>', {
          'class': 'create-poll-option-div'
        }).append(
          $('<input/>', {
            'class': 'formbox create-poll-option',
            'placeholder': 'Option'
          })
        ).append(
          $('<button>', {
            'class': 'add-poll-options',
            'tabIndex': -1
          }).text('+').click(function () {
            addOption($(this).parent().index() - 1);
          })
        ).append(
          $('<button>', {
            'class': 'remove-poll-options',
            'tabIndex': -1
          }).text('-').click(function () {
            removeOption($(this).parent().index() - 2);
          })
        );
      if ($(sel).length === index) {
        $('#create-poll').append(pollOptionElement);
      } else {
        $(sel).eq(index).before(pollOptionElement);
      }
      enableDisableButtons();
    }
    //recreate the poll menu to add +, -, copy old and clear buttons
    //at the top rather than the bottom so they don't move down when adding
    //more rows
  $('#create-pollBtn').text('Poll Menu');
  $('#create-poll').empty().append(
    $('<div>', {
      'class': 'poll-create-controls'
    }).append(
      $('<button>', {
        'class': 'add-poll-options'
      }).text('+').click(function () {
        addOption($('#create-poll > .create-poll-option-div').length);
      })
    ).append(
      $('<button>', {
        'class': 'remove-poll-options'
      }).text('-').click(function () {
        removeOption($('#create-poll > .create-poll-option-div').length - 1);
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
        'id': 'copy-poll'
      }).text('Copy').click(function () {
        if (th.oldPolls.length > 0) {
          th.index = -1;
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
        $('#title').val('');
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
    )
  ).append(
    $('<div>').append(
      $('<input/>', {
        'class': 'formbox',
        'id': 'title',
        'placeholder': 'Poll Title'
      })
    ).append(
      $('<button>', {
        'class': 'add-poll-options',
        'tabIndex': -1
      }).text('+').click(function () {
        addOption(0);
      })
    )
  );
  for (var i = 0; i < 4; i += 1) {
    addOption(0);
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
  var th = this;
  events.on(th, 'CreatePoll', function (poll) {
    //make a deep copy of the poll
    th.oldPolls.push($.extend(true, {}, poll));
  }, true);
};

window.plugins = window.plugins || {};
window.plugins.pollMenu = new PollMenu('1.0.6');
