/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
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
  // Query the server for a the topic so that it can be loaded to the page
  $.get('/api/get-topic',{'topicID':$('#topicID').html()}, function (data, status) {
    // If there is a response.
    if(data) {
    // Create candidates
      data['choices[]'].forEach(function(entry) {
        $('#candidates tr:last').after('<tr><td>' + entry + '</td><td><input type="number" class="votes" min="0" max="5"/></td></tr>') 
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
        // Create an array of all the votes casted.
        var votesArray = [];
        var votes = document.getElementsByClassName('votes');
        for (i = 0; i < votesArray.length; i++) {
          votesArray.push(votes[i].val);
        }
        
        // Create a vote object to submit to the server.
        var votes = {
          "topic": data.topic_id,
          "choices[]": data["choices[]"],
          "votes[]": votesArray,
          "voter": null, //TODO this should be username
          "castDate": (new Date()).toString() //TODO should this be done on chaincode side of things?
        }
        // Submit the vote object to the server.
        $.post('/api/vote-submit', votes, function (data, status) {
          // Handle response
          data = JSON.parse(data);
          if (data.status == 'success') {
            console.log('Votes Submitted');
            // Reroute the user back to the home page.
            window.location.replace('/topics');
          } else {
            console.log('Error: ' + data.status);
          }
        });
      }
    });
  });
  
  $('#title').click(function() {
    window.location.replace('../topics');
  });
});



