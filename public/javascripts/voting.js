/**
 * @author Gennaro Cuomo
 * 
 * Handels voting events including the remaining vote count.
 */

function setMaxVotes() {

}


$(document).ready(function () {

  var maxVotes = 5
  $('.hidden').hide();

  //
  // Get current topic info
  //
  $.get('/api/get-topic', { 'topicID': $('#topicID').html() }, function (data, status) {

    if (data) {
      // Create candidates
      data['choices[]'].forEach(function (entry) {
        var candidate = '<p class="candidate">' + entry + ': </p>';
        var voteInput = '<input type="number" class="votes" min="0" max="5"/>';
        $('#candidates').append(candidate, voteInput);
      });
    }
  });

  //
  // Submit user votes
  //
  $('#submit').click(function (e) {
    e.preventDefault(e);
    $.get('/api/get-topic', { "topicID": $('#topicID').html() }, function (data, status) {
      if (data) {

        var votesArray = [];
        var votes = document.getElementsByClassName('votes');
        $('.votes').each(function () {
          var val = this.value.toString();
          if (val == "") val = "0";
          votesArray.push(val);
        });

        var voteJSON = {
          "topic": data.topic_id,
          "choices[]": data["choices[]"],
          "votes[]": votesArray,
          "voter": null, //TODO this should be username
          "castDate": (new Date()).toString() //TODO should this be done on chaincode side of things?
        }

        $.post('/api/vote-submit', voteJSON, function (data, status) {
          // Handle response
          data = JSON.parse(data);
          if (data.status == 'success') {
            console.log('Votes Submitted');
            window.location.replace('/topics');
          } else {
            console.log('Error: ' + data.status);
          }
        });
      }
    });
  });

  // Remaining votes
  $('.votes').click(function (e) {
    e.preventDefault();
    var sum = 0;
    var votes = document.getElementsByClassName('votes');
    for (var i = 0; i < votes.length; i++) {
      sum += votes[i].val();
    }
    console.log(sum);
    if (sum < maxVotes) {
      $(this).val() += 1;

    }
  })
});



