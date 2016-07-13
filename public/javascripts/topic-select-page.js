/**
 * @author Gennaro Cuomo
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */

var socket = io();

$(document).ready(function() {

  // 
  // Element hiding and animations for the info-box
  // 
  // Hide all hidden elements
  $('.hidden').hide();
  //Animation for new topic, info box.
  $('#new-topic').click(function() {
    $('#user-info').hide();
    $('#topic-creation').toggle("fast", function(){});
  });
  //Animation for user info, info box.
  $('#user-button').click(function() {  
    $('#topic-creation').hide();
    $('#user-info').toggle("fast", function(){});
  });

  //
  // Topic generation for in the 'create' info-box
  //
  $('#topic-submit').click(function( e ) {
    e.preventDefault();
    // Create new topic object.
    var topic = {
      'topic_id' : $('#topic-name').val(),
      'issuer' : '',
      'choices' : [
        $('#topic-cand1').val(),
        $('#topic-cand2').val()
      ],
      'votes' : [0, 0]
    }
    // Submit the new topic
    $.post('/api/create', function(data, status){
      // Handle res.
      if(status == 'success') {
        // Create new topic button element
        var html = '<button class="topic button">' + $('#topic-name').val() + '</button>';
        console.log(html);
        // Append to the html
        $('#topics').append(html);
      } else {
        // ERROR
        console.log(status);
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
      if(status == 'success') {
        console.log('Loading topic.....');
      } else {
        // ERROR
        console.log(status);
      }
    });
  });
});