/**
 * @author Gennaro Cuomo
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Handles new topic generation.
 */
$(document).ready(function() {
  //Hide all hidden elements
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

  // Handles new topic generation.
  $('#topic-submit').click(function( e ) {
    e.preventDefault();
    
    // Create new topic object.

    $.post('/api/create', function(data, status){
      // Handle res.
      if(status == success) {
        // Create new topic button element
      } else {
        console.log(status);
      }
    })
    $('topic-creation').fadeOut();
  });
});