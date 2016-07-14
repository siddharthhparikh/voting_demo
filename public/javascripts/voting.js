/**
 * @author Gennaro Cuomo
 * 
 * Handels voting events including the remaining vote count.
 */
$(document).ready(function() {
    //
    // Disables manual form input to votes.
    //
    $('.votes').keypress(function(e){
      e.preventDefault();
    });

    //
    // Set values.
    //
    var totalVotes = $("#remaining-votes").text();
    $(".votes").val( 0 );

    //
    // Update the remaining number of votes based on the current issued votes.
    //
    $(".votes").change(function() {
       // Update the number of remaining votes.
       var votes1 = $("#votes1").val();
       var votes2 = $("#votes2").val();
       var remaining = Number(totalVotes) - (Number(votes1) + Number(votes2));
       $("#remaining-votes").html( remaining );
       // Upadte maximum votes for each responce.
       $("#votes1").attr( "max", ( Number(totalVotes) - Number(votes2)));
       $("#votes2").attr( "max", ( Number(totalVotes) - Number(votes1)));
    });

    //
    // Submit user votes
    //
    $('#submit').click(function(e){ 
      e.preventDefault();
      var votes = [{
        "topic" : $('#topic-description').val(),
        "choice" : 0,
        "quantity" : $('#votes1').val(),
        "voter" : null,
        "castDate" : null
      },
        "topic" : $('#topic-description').val(),
        "choice" : 1,
        "quantity" : $('#votes2').val(),
        "voter" : null,
        "castDate" : null
      }];
      $.post('/api/votesubmit', votes, function(data, status) {
        // Handle response
        data = JSON.parse(data);
        if( data.status == 'success') {
          console.log('Votes Submitted');
        } else {
          console.log('Error: ' + data.status);
        }
      });
    });
});



