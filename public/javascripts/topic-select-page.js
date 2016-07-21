/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */

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
  $('#loader').show();
  $('#topics').empty();
  $.get('/api/get-topics', function (data, status) {
    if (data) {
      $('#loader').hide();
      // Create a lot of buttons from the topic list.
      var count = 0;
      for (var topic in data) {
        console.log('found topic \"' + data[topic].topic + '\"');
        var html = '<button class="topic button" id="' + data[topic].topic_id + '">' + data[topic].topic + '</button>';
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
  // Page setup.
  // 
  loadTopics();
  // Display welcome msg and populate info-box.
  $.get('/api/user', function (data, status) {
    $('#welcome-end').append(', ' + data.user);
    $('#username').append(data.user);
    // TODO append votes to #user-votes
  });
  $('.welcome-o').click(function () {
    $.get('/api/o', function (data, status) { });
  });
  // Hide all hidden elements
  $('.hidden').hide();
  //Animation for new topic, info box.
  $('#new-topic').click(function () {
    $('#user-info').hide();
    $('#topic-creation').toggle("fast", function () { });
  });
  //Animation for new topic, info box.
  $('#user-button').click(function () {
    $('#topic-creation').hide();
    $('#user-info').toggle("fast", function () { });
  });
  // Set click action for refresh button.
  $('#refresh-topics').click(loadTopics());

  //
  // Topic generation for in the 'create' info-box
  //
  $('#topic-submit').click(function (e) {
    e.preventDefault();
    console.log('Expire date: ', $('#datepicker').val());

    issueUniqueID(10); //attempt 10 times to issue unique ID

    function issueUniqueID(countdown) {
      if (!countdown || (countdown < 0)) {
        console.log('Could not create unique ID for topic, sorry!')
        return;
      }

      var id = generateID(Math.max($('#topic-name').val().length, 16));
      console.log('Topic ID: ' + id);

      $.get('/api/topic-check', { "topic_id": id }, function (data, status) {
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
        'choices': [
          $('#topic-cand1').val(),
          $('#topic-cand2').val()
        ]
      }
      console.log('topic: ');
      console.log(topic);
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
      })
      $('topic-creation').fadeOut();
    }
  });

  $('#datepicker').click(function () {
    $("#datepicker").datepicker();
  })
  //
  // Routes user to the selected topic.
  //
  $(document).on('click', '.topic', function () {
    console.log('testing');
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
    window.location.replace("../topic/id?=" + $(this).html());
  });
});