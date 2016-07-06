/**
 * @author Gennaro Cuomo
 * 
 * Handles all animations and hiding for info boxes (and some other elements).
 * Generates new buttons for the topic creation info box.
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
   // e.preventDefault();
    // Create new topic button element.
    var htmlbutton = '<input type="submit" class="button" value="' + $("#topic-name").val() + '"/>';

   // var htmlcontent = '<input type="text" name="topicid" class="hidden value="t-' + $("#topic-name").val() + '"/>';
    $("#topics").append(htmlbutton);
   // $("#topics").append(htmlcontent);
    $('topic-creation').fadeOut();
  });
});