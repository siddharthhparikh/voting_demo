/**
 * @author Gennaro Cuomo
 * 
 * Submits the login request to the server.
 * Routes the user to the topic select page is the login is successful.
 */
$(document).ready(function () {
  $('.hidden').hide();
  console.log('Querying if chaincode has deployed...');
  var intervalVar = setInterval(function() {
  $.get('/api/load-chain', function (data, status) {
    data = JSON.parse(data);
    if (data.status == "success") {
      console.log('Chaincode loaded!');
      //clearInterval(intervalVar);
      $('#loading-screen').remove();
      $('#content-header').fadeIn();
      $('#content-block').fadeIn();
      $('#open-register').fadeIn();
    } else {
      console.log('Chaincode failed!');
      $('#loading-screen').fadeIn();
      $('#content-header').remove();
      $('#content-block').remove();
      $('#open-register').remove();
    }
  });
  }, 2000);
  //Animation for register info box.
  $('#open-register').click(function() {
    $('#register-box').animate({ height: 'toggle'}, 'fast');
  });
  // Hides menus when user clicks out of them.
  $(document).click(function(event){
    if(!$(event.target).is('.info-box') && !$(event.target).is('.info-box h1') && !$(event.target).is('.info-box p') && !$(event.target).is('#open-register') && !$(event.target).is('.reg-info')){
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
  $('#register-user').click(function() {
    var errFlag = false;
    $('.reg-info').each(function(){
      var index = $(".reg-info").index(this);
      if ($(this).val() == '' && errFlag == false) {
        errFlag = true;
        alert('Error: Input fields can not be left empty.');
      }
    });
    if(!errFlag){
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
    }
  });

  $('#title').click(function() {
    window.location.replace('../topics');
  });
});