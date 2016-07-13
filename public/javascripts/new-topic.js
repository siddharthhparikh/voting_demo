var socket = io();

$(document).ready(function () {
  //Hide all hidden elements
  $('.hidden').hide();

  //Animation for new topic, info bar.
  $('#new-topic').click(function () {
    $('#user-info').hide();
    $('#topic-creation').toggle("fast", function () { });
  });

  //Animation for user info, info bar.
  $('#user-button').click(function () {
    $('#topic-creation').hide();
    $('#user-info').toggle("fast", function () { });
  });

  // Handles new topic creation.
  $('#topic-submit').click(function (e) {
    e.preventDefault();

    var htmlbutton = '<input type="submit" class="button" value="' + $("#topic-name").val() + '"/>';

    // var htmlcontent = '<input type="text" name="topicid" class="hidden value="t-' + $("#topic-name").val() + '"/>';
    $("#topics").append(htmlbutton);
    // $("#topics").append(htmlcontent);

    $('topic-creation').fadeOut();
  });


});