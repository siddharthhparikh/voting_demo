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
    var user = { 'account_id' : $('#username').val(), 'vote_count' : 0 };
    $.post('/api/login', user, function(data, status){
      // Handle response.
      if(status == 'success') {
        console.log('Success!');
        // Redirect user.
        window.location.replace("../topics");
      } else {
        // ERROR
        connsoe.log('Error of some sort, not sure what');
      }
    });
  });
});