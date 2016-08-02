$(document).ready(function () {
  $.get('/api/manager', function (data, status) {
    if (data.AllAccReq) {
      // Create a <tr> for each request that exists.
      data.AllAccReq.forEach(function (entry) {
        // This was fun to write.
        $('#request-table tr:last').after('<tr class="request"><td>' + entry.account_id + '</td><td>' + entry.email + '</td><td><input type"number" min="0" class="vote-ammount request-info" value="5"/></td><td><i class="button approve material-icons" name="' + entry.account_id + '" email="' + entry.email + '">check</i><i class="button decline material-icons" name="' + entry.account_id + '" email="' + entry.email + '">close</i></td></tr>');
      });
    }
  });
  // Events for the approve/decline buttons.
  $(document).on('click', '.approve', function () {
    $(this).parent().parent().fadeOut();
    console.log($(this).attr("name"));
    console.log($(this).parent().parent().find('.vote-ammount').val());
    //TODO approve the user
    var user = {
      Name: $(this).attr("name"),
      VoteCount: $(this).parent().parent().find('.vote-ammount').val(),
      Email: $(this).attr("email")
    }
    console.log(user);
    $.post('/api/approved', user, function (data, status) {
      //console.log($(this).parent().children());
      //$(this).parent().remove();
      location.reload();
    });
  });
  $(document).on('click', '.decline', function () {
    $(this).parent().parent().fadeOut();
    //TODO Maybe send notification to user.
    var user = {
      Name: $(this).attr("name"),
      VoteCount: $(this).parent().parent().find('.vote-ammount').val(),
      Email: $(this).attr("email")
    }
    console.log("inside on click decline");
    $.post('/api/declined', user, function (data, status) {
      //$(this).parent().remove();
      console.log("after finishing declining");
      location.reload();
    });
  });
});
