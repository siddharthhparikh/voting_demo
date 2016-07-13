/**
 * @author Gennaro Cuomo
 * 
 * Handles all api calls from the client.
 * Interfaces with the chaincode to get client requested information.
 */
var express = require('express');
var router = express.Router();
var session = require('express-session');

var DEFAULT_VOTES = 5

/* Login in request. */
router.post('/login', function(req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  // TODO check if the user already exsits in db.
  
  // TODO Create user in chaincode.

  // Create user session
  //req.session.name = user;
  // TODO other session stuff
  
  console.log('Loging in as.....');
  console.log(user.account_id);

  // Send response.
  res.json('{"status" : "success"}');
});

/* Load voting topic request */
router.post('/topic/:id', function(req, res, next) {
  // Get the topic id from the post
  var topicId = req.body;
  // TODO Get the topic object from the db.
  console.log('Getting topic from database.')
  // Send response
  res.json('{"status" : "success"}');
});

/* Create topic request */
router.post('/create', function(req, res, next) {
  // Grab the new topic from the req.
  var newTopic = req.body;
  console.log('New topic: \n ' + newTopic );
  // Add topic object to database.

  // Send response.
  res.json('{"status" : "success"}');
});

/* Vote submiting request */
router.post('/votesubmit', function(req, res, next) {
  // Get voting data 
  console.log();
  // Submit voting data to database or blockchain or whatever
  res.json('{"status" : "success"}');
});

module.exports = router;