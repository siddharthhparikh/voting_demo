$(document).ready(function(){

  // Populate the request table with generated buttons.
  $.get('/api/manager', function (data, status) {
    if(data) {
      // Create a <tr> for each request that exists.
      data.AllAccReq.forEach(function(entry){
      // Generate and append the new request html.
      // This was fun to write.
      $('#request-table tr:last').after('<tr class="request"><td>' + entry.account_id + '</td><td>' + entry.email + '</td><td><input type"number" min="0" class="vote-ammount request-info" value="5"/></td><td><i class="button approve material-icons" name="' + entry.account_id + '" email="' + entry.email+ '">check_circle</i><i class="button decline material-icons" name="' + entry.account_id + '" email="' + entry.email + '">highlight_off</i></td></tr>');
      });
    }
  });
  
  // Events for the approve/decline buttons.
  $('.approve').click(function() {
    $(this).attr("ema")
  });
  $('.decline').click(function() {
    //TODO Maybe send notification to user.
    $(this).parent().remove();
  });
});