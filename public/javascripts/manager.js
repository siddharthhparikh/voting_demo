$(document).ready(function(){

  // Populate the request table with generated buttons.
  $.get('/api/manager', function (data, status) {
    if(data) {
      // Create a <tr> for each request that exists.
      data.AllAccReq.forEach(function(entry){
      // This was fun to write.
        $('#request-table tr:last').after('<tr class="request"><td>' + entry.account_id + '</td><td>' + entry.email + '</td><td><input type"number" class="vote-ammount request-info" value="5"/></td><td><button class="button approve">Approve</button><button class="button decline">Decline</button></td></tr>');
      });
    }
  });
  
  // Events for the approve/decline buttons.
  $('.approve').click(function() {
    //TODO approve the user
  });
  $('.decline').click(function() {
    //TODO Maybe send notification to user.
    $(this).parent().remove();
  });
});


