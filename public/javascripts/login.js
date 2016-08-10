/**
 * @author Gennaro Cuomo
 * 
 * Submits the login request to the server.
 * Routes the user to the topic select page is the login is successful.
 */
$(document).ready(function () {
  $('.hidden').hide();
  console.log('Querying if chaincode has deployed...');
  var intervalVar = setInterval(function () {
    $.get('/api/load-chain', function (data, status) {
      data = JSON.parse(data);
      if (data.status == "success") {
        console.log('Chaincode loaded!');
        clearInterval(intervalVar);
        $('#loading-screen').remove();
        $('#content-header').fadeIn();
        $('#content-block').fadeIn();
        $('#open-register').fadeIn();
      } else {
        console.log('Chaincode failed!');
        $('#loading-screen').fadeIn();
        $('#content-header').hide();
        $('#content-block').hide();
        $('#open-register').hide();
      }
    });
  }, 2000);

  //Animation for register info box.
  $('#open-register').click(function () {
    $('#register-box').animate({ height: 'toggle' }, 'fast');
  });
  // Hides menus when user clicks out of them.
  // Hides menus when user clicks out of them.
  $('#master-content').click(function () {
    $('.info-box').fadeOut('fast');
  });

  //
  // Submit user credendials and verify.
  //
  var privKey;
  $('#submit').click(function (e) {
    e.preventDefault();

    var files = document.getElementById('files').files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var reader = new FileReader();
    reader.onloadend = function (evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        //privKey = JSON.parse(evt.target.result);
        console.log(JSON.parse(evt.target.result));
        var temp;
        $.get('/api/get-public-key', temp, function (data, status) {
          var user = {
            'account_id': $('#username').val(),
            'password': $('#password').val()
          };
          console.log(user);
          console.log("received public key from server: " + data);
          var EncryptionResult = cryptico.encrypt("JSON.stringify(user)", data, privKey);
          $.post('/api/login', EncryptionResult, function (data, status) {
            data = JSON.parse(data);
            console.log("[DATA]", data);
            // Handle respse "clonse.
            if (data.status === 'success') {
              // Redirect user.
              if (data.type === 'user') {
                window.location.replace("../topics");
              }
              else if (data.type === 'manager') {
                console.log("redirecting to manager...");
                window.location.replace("../manager");
              }
            } else {
              $('#error-msg').html('Error: ' + data.status);
            }
          });
        })
      }
    };

    var file = files[0]
    reader.readAsText(file)

  });


  //
  // Request to register as a new user.
  //
  function makepass() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  $('#register-user').click(function () {
    var errFlag = false;
    $('.registration-info').each(function () {
      var index = $(".registration-info").index(this);
      if ($(this).val() == '' && errFlag == false) {
        errFlag = true;
        alert('Error: Input fields can not be left empty.');
      }
    });
    console.log(errFlag)
    if (!errFlag) {
      //console.log($('#organization').val());
      // Create request object.
      var PassPhrase = makepass();
      console.log("Randomly generated password: " + PassPhrase);
      var Bits = 1024;
      var privRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);
      privKey = privRSAkey;
      console.log("private key:" + typeof privRSAkey);
      window.open("data:text/json;charset=utf-8," + escape(JSON.stringify(privRSAkey)));
      var pubPem = cryptico.publicKeyString(privRSAkey);
      console.log("public key: " + pubPem);

      var newUser = {
        'name': $('#name').val(),
        'email': $('#email').val(),
        'org': $('#organization').val(),
        'privileges': $('#priv-type').val(),
        'pubPem': pubPem
      };

      //Send request object.
      //console.log(newUser)
      $.post('/api/register', newUser, function (data, status) {
        console.log("status = " + status)
        if (status == 'success') {
          console.log(data)
          //window.open("data:text/json;charset=utf-8," + escape(data));
          //localStorage.privKey = data;
          //var file = new File([data], "hello world.txt", {type: "text/plain;charset=utf-8"});
          //saveAs(file);
          $('#register-box').fadeOut();
          $('#error-msg').html('New account request has been sent.');
        }
      });
    }
  });

  $('#title').click(function () {
    window.location.replace('../topics');
  });
});