/**
 * @author Gennaro Cuomo
 * 
 * Handels voting events including the remaining vote count.
 */
$(document).ready(function () {

  //
  // Get current topic info
  //
  var topicid = $('#topic-description').html();
  $.post('/api/get-topic',{'id':topicid}, function (data, status) {
    data = JSON.parse(data);
    if(data) {
    // Create candidates
    // TODO get topic data set up.
    // $('#cand1').append(data.topic.choices[0]);
    // $('#cand2').append(data.topic.choices[1]);
    }
  });

  //
  // Disables manual form input to votes and set values.
  //
  $('.votes').keypress(function (e) {
    e.preventDefault();
  });
  var totalVotes = $("#remaining-votes").text();
  $(".votes").val(0);


  //
  // Submit user votes
  //
  $('#submit').click(function (e) {
    e.preventDefault(e);
    $.get('/api/get-topic', {"topicID":$('#topic-description').html()}, function (data, status) {
      if (data) {
        var votesArray = []

        //TODO this should be made a for loop to handle variable number of candidates
        votesArray.push($('#votes1').val());
        votesArray.push($('#votes2').val());
        votesArray.push($('#votes3').val());

        var votes = {
          "topic": data.topic_id,
          "choices": data.choices,
          "votes": votesArray,
          "voter": null, //TODO this should be username
          "castDate": (new Date()).toString()
        }
        
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
  // Update the remaining number of votes based on the current issued votes.
  //
  $(".votes").change(function () {
    // Update the number of remaining votes.
    var votes1 = $("#votes1").val();
    var votes2 = $("#votes2").val();
    var remaining = Number(totalVotes) - (Number(votes1) + Number(votes2));
    $("#remaining-votes").html(remaining);
    // Upadte maximum votes for each responce.
    $("#votes1").attr("max", (Number(totalVotes) - Number(votes2)));
    $("#votes2").attr("max", (Number(totalVotes) - Number(votes1)));
  });
});



