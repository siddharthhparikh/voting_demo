/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */

 /* loadTopics reloads the topic buttons list */
function loadTopics() {
  $('#loader').show();
  $('#topics').empty();
  $.get('/api/get-topics', function (data, status) {
    $('#loader').hide();    
    if (data) {
      // Create a lot of buttons from the topic list.
      var count = 0;
      for (var topic in data) {
        console.log('found topic \"' + data[topic].topic_id + '\"');
        var html = '<button class="topic button">' + data[topic].topic_id + '</button>';
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
    // Create a new topic object.
    var topic = {
      'topic_id': $('#topic-name').val(),
      'issuer': '',
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
        loadTopics(); 
      } else {
        // ERROR
        console.log(data.status);
      }
    })
    $('topic-creation').fadeOut();
  });

  //
  // Routes user to the selected topic.
  //
   $(document).on('click', '.topic', function() {
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