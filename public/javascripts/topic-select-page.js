/**
 * @author Gennaro Cuomo
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */
$(document).ready(function() {
 
  // 
  // Page setup.
  // 
  // Display welcome msg.
  $.get('/api/user', function (data, status) {
    console.log(data.user);
    $('.welcome').append('Welcome ' + data.user)
  });
  // Hide all hidden elements
  $('.hidden').hide();
  // Set up animations for info box
  $('#new-topic').click(function() {  
    $('#user-info').hide();
    $('#topic-creation').toggle("fast", function(){});
  });
  $('#user-button').click(function() {  
    $('#topic-creation').hide();
    $('#user-info').toggle("fast", function(){});
  });

  //
  // Generate topic buttons
  //
  $.get('/api/get-topics', function(data) {
    console.log('adding topics');
    data = JSON.parse(data);
    // Create a shit load of buttons from the topic list.
    for(var topic in data ){
      var html = '<button class="topic button">' + data[topic].topic_id + '</button>';
      console.log(data[topic].topic_id);
      $('#topics').append(html);
    }
  });

  //
  // Topic generation for in the 'create' info-box
  //
  $('#topic-submit').click(function( e ) {
    e.preventDefault();
    // Create a new topic object.
    var topic = {
      'topic_id' : $('#topic-name').val(),
      'issuer' : '',
      'choices' : [
        $('#topic-cand1').val(),
        $('#topic-cand2').val()
      ]
    }
    // Submit the new topic
    $.post('/api/create', topic, function(data, status){
      // Handle res.
      data = JSON.parse(data);
      if(data.status == 'success') {
        // Create new topic button element
        var html = '<button class="topic button">' + $('#topic-name').val() + '</button>';
        console.log(html);
        // Append to the html
        $('#topics').append(html);
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
  $('.topic').click(function(e) {
    $.post('/api/topic/' + $(this).html(), $(this).html(), function(data, status) {
      // Handle res.
      data = JSON.parse(data);
      if(data.status == 'success') {
        cosnole.log('Loading topic.....');
      } else {
        // ERROR
        console.log(data.status);
      }
    });
  });
});