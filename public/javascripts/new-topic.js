$(document).ready(function() {
  $('#new-topic-forms').hide();
  $('.hidden').hide();
  // Fade in form when user clicks add new topic.
  $('#new-topic').click(function() {  
    $('#new-topic-forms').fadeIn();
  });
  // When form is submited, create a new topic.1
  $('#topic-submit').click(function() {
    var html = '<input type="submit" class="button" value="' + $("#form-name").val() + '"/>';
    $("#content-block").append(html);
    // Hide add topic form.
    $('#new-topic-forms').fadeOut();
  });
});