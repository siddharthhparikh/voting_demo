/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
 * 
 * Handles voting events including the remaining vote count.
 */

function setMaxVotes(cb) {
  $.get('/api/get-account-info', function (data, status) {
    if (data) {
      cb(data.vote_count);
    }
    return 0;
  });
}


$(document).ready(function () {
  setMaxVotes(function (voteCount) {
    $('#remaining-votes').append(voteCount);
    $('.hidden').hide();
  });

  //
  // Get current topic info
  //

  console.log('Topic ID:', $('#topicID').html());
  // Query the server for a the topic so that it can be loaded to the page
  $.get('/api/get-topic', { 'topicID': $('#topicID').html() }, function (data, status) {
    // If there is a response.
    if (data) {
      if (data.Status == "open") {
        // Create candidates
        data.Topic['choices[]'].forEach(function (entry) {
          $('#candidates tr:last').after('<tr><td>' + entry + '</td><td><input type="number" class="votes" min="0" max="5"/></td></tr>')
        });
        $('.votes').val('0');
      } else if (data.Status == "closed" || data.Status == "voted") {
        var graphData = [];

        for (var i = 0; i < data.Topic['choices[]'].length; i++) {
          graphData.push([data.Topic['choices[]'][i], parseInt(data.Topic['votes[]'][i])]);
        }

        $('#content-block').highcharts({
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false
          },
          title: {
            text: 'RESULTS',
            align: 'center',
            verticalAlign: 'middle',
            y: 50
          },
          tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
          },
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: true,
                distance: -50,
                style: {
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0px 1px 2px black'
                }
              },
              startAngle: -90,
              endAngle: 90,
              center: ['50%', '75%']
            }
          },
          series: [{
            type: 'pie',
            name: data.Topic.topic,
            innerSize: '50%',
            data: graphData
          }]
        });
      }
    }
  });

  //
  // Submit user votes
  //
  $('#submit').click(function (e) {
    e.preventDefault(e);
    $.get('/api/get-topic', { "topicID": $('#topicID').html() }, function (data, status) {
      if (data) {
        data = data.Topic;

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

        // Submit the vote object to the server.
        $.post('/api/vote-submit', voteJSON, function (data, status) {
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

  // Remaining votes
  $('.votes').click(function (e) {
    e.preventDefault();
    var sum = 0;
    // Collect sum of all votes applied.
    $('.votes').each(function () {
      var index = $(".votes").index(this);
      sum += $(this).val();
    });
    $('#remaining-votes').html(maxVotes - sum);
  });

  $('#title').click(function () {
    window.location.replace('../topics');
  });
});



