/**
 * @author Gennaro Cuomo
 * 
 * Submits the login request to the server.
 * Routes the user to the topic select page is the login is successful.
 */
$(document).ready(function() { 
  $('.hidden').hide();

  $.get('/api/load-chain', function (data, status) {
    console.log('testing loading');
    data = JSON.parse(data);
    if(data.status == "success") {
      console.log('im in......');
      $('#loading-screen').remove();
      $('#content-header').fadeIn();
      $('#content-block').fadeIn();
    } else {
      //TODO display err
    }
  });

  //Animation for register info box.
  $('#open-register').click(function () {
    $('#register-box').toggle("fast", function () { });
  });

  //
  // Submit user credendials and verify.
  //
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

    //
    // Request to register as a new user.
    //
    $('#register-user').click(function(e) {
      preventDefault(e);
      console.log('Sending request');
      // Create request object.
      var newUser = {
        'name' : $('#name').val(),
        'email': $('#email').val(),
        'org' : $('#orginization').val()
      };
      //Send request object.
      $.post('/api/register', newUser, function(data, status){
        if( status == 'success') {
          $('#register-box').hide();
          $('#error-msg').html('New account request has been sent.');
        }
      });
    });
  });
});