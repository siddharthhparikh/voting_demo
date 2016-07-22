/**
 * @author Gennaro Cuomo
 * 
 * Submits the login request to the server.
 * Routes the user to the topic select page is the login is successful.
 */
$(document).ready(function () {
  $('.hidden').hide();

  $.get('/api/load-chain', function (data, status) {
    data = JSON.parse(data);
    if (data.status == "success") {
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
  $('#submit').click(function (e) {
    e.preventDefault();

    var user = {
      'account_id': $('#username').val(),
      'password': $('#password').val()
    };
    $.post('/api/login', user, function (data, status) {
      data = JSON.parse(data);
      // Handle response.
      if (data.status === 'success') {
        console.log('login success');
        // Redirect user.
        if(data.type === 'user') {
          window.location.replace("../topics");
        }
        else if(data.type === 'manager') {
          window.location.replace("../manager");
        }
      } else {
        console.log('Error: ' + data.status);
        $('#error-msg').html('Error: ' + data.status);
      }
    });
  });

  $('#reg-usr').click(function (e) {
    console.log('Sending request');
    // Create request object.
    var newUser = {
      'name': $('#name').val(),
      'email': $('#email').val(),
      'org': $('#orginization').val()
    };
    //Send request object.
    $.post('/api/register', newUser, function (data, status) {
      if (status == 'success') {
        $('#register-box').hide();
        $('#error-msg').html('New account request has been sent.');
      }
    });
  });

  $('#manage').click(function() {
    window.location.replace("../manager");
  });
});