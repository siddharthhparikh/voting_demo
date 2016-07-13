/**
 * @author Gennaro Cuomo
 * 
 * Handels voting events including the remaining vote count.
 */
$(document).ready(function() {
    // Disables manual form input.
    $('.votes').keypress(function(e){
      e.preventDefault();
    });
    // Set form values(to 0).
    var totalVotes = $("#remaining-votes").text();
    $(".votes").val( 0 );
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
    // Submit user votes
    $('#submit').click(function(e){ 
      e.preventDefault();
      $.post('/api/votesubmit', $("#votes1").val(), $("#votes2").val(), function(data, status) {
        // Handle response
      });
    });
});



