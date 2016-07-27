/**
 * @author Gennaro Cuomo
 * 
 * Handels voting events including the remaining vote count.
 */

function setMaxVotes(){
  
}


$(document).ready(function () {

  var maxVotes = 5
  $('.hidden').hide();

  //
  // Get current topic info
  //
  $.get('/api/get-topic',{'topicID':$('#topicID').html()}, function (data, status) {
    
    if(data) {
    // Create candidates
      data['choices[]'].forEach(function(entry) {
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
        var votesArray = []

        //TODO this should be made a for loop to handle variable number of candidates
        votesArray.push($('#votes1').val());
        votesArray.push($('#votes2').val());
        //votesArray.push($('#votes3').val());

        console.log(votesArray);

        var votes = {
          "topic": data.topic_id,
          "choices[]": data["choices[]"],
          "votes[]": votesArray,
          "voter": null, //TODO this should be username
          "castDate": (new Date()).toString() //TODO should this be done on chaincode side of things?
        }

        console.log("VOTE: ", votes);

        $.post('/api/vote-submit', votes, function (data, status) {
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

  //

});



