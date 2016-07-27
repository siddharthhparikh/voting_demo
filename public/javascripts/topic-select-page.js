/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */

var MIN_ID_LENGTH = 32;

function generateID(length) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

  var id = '';
  for (var i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* loadTopics reloads the topic buttons list */
function loadTopics() {
  console.log('Loading topics...');

  $('#topics').empty();
  $('#topics').append('<div id="loader"></div>');
  $.get('/api/get-topics', function (data, status) {
    $('#loader').remove();
    if (data && data.AllTopics) {
      data = data.AllTopics;

      console.log('data: ', data);

      $('#loader').hide();
      // Create a lot of buttons from the topic list.
      var count = 0;
      for (var i in data) {
        console.log('found topic: ', data[i]);
        var html = '<button class="topic button" id="' + data[i].Topic.topic_id + '">' + data[i].Topic.topic + '</button>';
        $('#topics').append(html);
        count++;
      }
      if (count == 0) {
        console.log('no topics found');
      }
    } else {
      var html = '<p>No topics found.</p>'
      $('#topics').append(html);
    }
  });
}

$(document).ready(function () {
  // 
  // Animation and page set up.
  //

  loadTopics();

  // Display welcome msg and populate info-box.
  $.get('/api/user', function (data, status) {
    $('#welcome-end').append(', ' + data.user);
    $('#username').append(data.user);
    // TODO append votes to #user-votes
  });
  // Secret button.
  $('.welcome-o').click(function () {
    $.get('/api/o', function (data, status) { });
  });

  // Hide all hidden elements
  $('.hidden').hide();

  //Animation for new topic, info box.
  $('#new-topic').click(function () {
    $('#user-info').hide();
    $('#topic-creation').animate({ height: 'toggle' }, 'fast');
  });

  //Animation for new topic, info box.
  $('#open-user-info').click(function () {
    $('#topic-creation').hide();
    $('#user-info').animate({ height: 'toggle' }, 'fast');
  });

  // Hides menus when user clicks out of them.
  $(document).click(function (event) {
    if (!$(event.target).is('.info-box') && !$(event.target).is('.header-icons')) {
      $('.info-box').fadeOut('fast');
    }
  });

  // Set click action for refresh button.
  $('#refresh-topics').click(loadTopics);

  // For date picking
  $('#datepicker').click(function () {
    $("#datepicker").datepicker();
  });

  // Tabs for open/closed topic switching
  $(document).on('click', '.inactive', function () {
    $('.active').removeClass('active').addClass('inactive');
    $(this).addClass('active').removeClass('inactive');
  });

  //
  // Topic generation for in the 'create' info-box
  //
  $('#topic-submit').click(function (e) {
    e.preventDefault();
    // First grab all candidates the user creates
    // TODO don't grab empty candidate boxes
    var choices = [];
    $('.topic-candidate').each(function () {
      choices.push($(this).val());
    });

    issueUniqueID(10); //attempt 10 times to issue unique ID

    function issueUniqueID(countdown) {
      if (!countdown || (countdown < 0)) {
        console.log('Could not create unique ID for topic, sorry!')
        return;
      }

      var id = generateID(Math.max($('#topic-name').val().length, MIN_ID_LENGTH));
      console.log('Topic ID: ' + id);

      $.get('/api/topic-check', { "topicID": id }, function (data, status) {
        if (data.status == 'success') {
          console.log('Topic ID taken!  Issuing new ID...');
          issueUniqueID(countdown - 1);
        } else {
          issueTopic(id);
        }
      });
    }

    function issueTopic(id) {
      // Create a new topic object.
      var topic = {
        'topic_id': id,
        'topic': $('#topic-name').val(),
        'issuer': '',
        'expire_date': $('#datepicker').val(),
        'choices': choices
      }

      // Submit the new topic
      $.post('/api/create', topic, function (data, status) {
        // Handle res.
        data = JSON.parse(data);
        if (data.status == 'success') {
          // Create new topic button element
          //var html = '<button class="button topic">' + $('#topic-name').val() + '</button>';
          //console.log(html);
          // Append to the html
          //$('#topics').append(html);
          // TEST
          loadTopics();

        } else {
          // ERROR
          console.log(data.status);
        }
      });
    }
    // Fade out element
    $('#topic-creation').fadeOut();
  });

  //
  // Add new candidate button.
  //
  $('#add-cand').click(function () {
    var html = '<input type="text" class="topic-candidate" placeholder="Candidate"/>';
    $('#candidate-append').append(html);
  });

  //
  // Routes user to the selected topic.
  //
  $(document).on('click', '.topic', function () {
    // $.post('/api/topic-check/', $(this).html(), function (data, status) {
    //   // Handle res.
    //   data = JSON.parse(data);
    //   if (data.status == 'success') {
    //     cosnole.log('Loading topic.....');
    //     // Redirect user.
    //     window.location.replace("../topic/?id=" + $(this).html() );
    //   } else {
    //     // ERROR
    //     console.log(data.status);
    //   }
    // });
    window.location.replace("../topic/id?=" + $(this).context.id);
  });
});