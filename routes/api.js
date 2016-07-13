/**
 * @author Gennaro Cuomo
 * 
 * Handles all api calls from the client.
 * Interfaces with the chaincode to get client requested information.
 */
var express = require('express');
var router = express.Router();
var session = require('express-session');
var chaincode = require('../libs/blockchainSDK');

var DEFAULT_VOTES = 5

/* Login in request. */
router.post('/login', function(req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  user.vote_count = DEFAULT_VOTES;
  // TODO check if the user already exsits in db.
  
  // TODO Create user in chaincode.

  console.log('Loging in as.....');
  console.log(user);

  // Send response.
  if(user.account_id != null) {
    res.json('{"status" : "success"}');
  } else {
    res.json('{"status" : "Need a user name."}');
  }
});

router.get('/get-topics', function(res, next) {
  chaincode.query('get_all_topics', [], function (err, results) {
    if (err) console.log(err);
    else if (results.result) res.json(results.result);
  });
});

router.post('/topic/:id', function (req, res, next) {
  // Get the topic id from the post
  var topicId = req.body;
  // TODO Get the topic object from the db.
  console.log('Getting topic from database.')
  // Send response
  res.json('{"status" : "success"}');
});

router.post('/create', function (req, res, next) {
  var newTopic = req.body;

  //TODO DELETE THIS ADD SOME POINT
  newTopic.issuer = 'ethan!'; //TODO TEMPORARY UNTIL ISSUER IS ADDED
  //TODO TODO TODO TODO

  console.log('New topic: \n ' + JSON.stringify(newTopic));
  // Add topic object to database.

  var args = [JSON.stringify(newTopic)];
  chaincode.invoke('issue_topic', args, function (err, results) {
    if (err) console.log(err);
    else res.json('{"status" : "success"}');
  });
});

router.post('/votesubmit', function (req, res, next) {
  // Get voting data 
  console.log();
  // Submit voting data to database or blockchain or whatever
  res.json('{"status" : "success"}');
});

module.exports = router;