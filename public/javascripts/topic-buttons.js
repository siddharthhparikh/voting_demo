$(document).ready(function() {
  $('.topic').click(function(e) {
    e.preventDefault();
    $.post('/api/topic/' + $(this).val() , username, function(data, status) {
      // Handle Response.
    });
  });
});