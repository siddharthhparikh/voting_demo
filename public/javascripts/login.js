$(document).ready(function() { 
  // When submit button is clicked make post with user info.
  $('#submit').click(function(e) {
    e.preventDefault();
    var username = $('#username').val();
    $.post('/api/login', username, function(data, status){
      if(status == 'success') {
        // Redirect to topics page.
      } else {
        // Handel error.
      }
    });
  });
});