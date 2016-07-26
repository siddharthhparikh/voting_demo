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
      $('#open-register').fadIn();
    } else {
      //TODO display err
    }
  });

  //Animation for register info box.
  $('#open-register').click(function() {
    $('#register-box').animate({ height: 'toggle'}, 'fast');
  });
  // Hides menus when user clicks out of them.
  $(document).click(function(event){
    if(!$(event.target).is('#register-box') && !$(event.target).is('#open-register') && !$(event.target).is('.input')){
      $('.info-box').fadeOut('fast');
    }     
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
        window.location.replace("../topics");
      } else {
        console.log('Error: ' + data.status);
        $('#error-msg').html('Error: ' + data.status);
      }
    });
  });

  //
  // Request to register as a new user.
  //
  $('#register-user').click(function (e) {
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