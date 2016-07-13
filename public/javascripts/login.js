/**
 * @author Gennaro Cuomo
 * 
 * Submits the login request to the server.
 * Routes the user to the topic select page is the login is successful.
 */
$(document).ready(function() { 
  // When submit button is clicked make post with user info.
  $('#submit').click(function(e) {
    e.preventDefault();
    var user = { 'account_id' : $('#username').val() };
    $.post('/api/login', user, function(data, status){
      data = JSON.parse(data);
      // Handle response.
      if(data.status === 'success') {
        console.log('login success');
        // Redirect user.
        window.location.replace("../topics");
      } else {
        console.log('Error: ' + data.status);
        $('#error-msg').html('Error: ' + data.status);
      }
    });
  });
});