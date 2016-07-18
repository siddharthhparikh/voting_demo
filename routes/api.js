/**
 * @author Gennaro Cuomo
 * @author Ethan Coeytaux
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
router.post('/login', function (req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  // TODO check if the user already exsits in db.

  console.log(user);

  var args = user.account_id;
  chaincode.query('get_account', args, function (err, data) {
    if (data) {
      // Create user session
      req.session.name = user.account_id;
      console.log('Logging in as.....');
      console.log(req.session.name);
      // Send response.
      res.json('{"status" : "success"}');
    } else {
      res.json('{"status" : "Invalid login."}');
    }
  });
  // TODO Create user in chaincode.
});

//clears all topics on blockchain
//TODO this is just for debugging!
router.get('/o', function (req, res) {
  console.log('deleting all topics...');
  console.log('hope you know what you\'re doing...');
  chaincode.invoke('clear_all_topics', [], function(err, data) {
    if (err) {
      console.log('ERROR: ' + err);
      res.json('{"status" : "failure"}');
    } else {
      console.log('delete of all topics successful!');
      res.json('{"status" : "success"}');
    }
  });
});

/* Get all voting topics from blockchain */
router.get('/get-topics', function (req, res) {
  var args = [];
  chaincode.query('get_all_topics', args, function (err, data) {
    if (err) console.log(err);
    else res.json(data);
  });
});

router.post('/topic-check/', function (req, res, next) {
  // Get the topic id from the post
  var topicId = req.body;
  // TODO See if the topic is valid

  // Send response
  res.json('{"status" : "success"}');
});

/* Create a new voting topic */
router.post('/create', function (req, res, next) {
  var newTopic = req.body;

  // Set the issuer to the current active user,
  newTopic.issuer = req.session.name;

  console.log('New topic: \n ' + JSON.stringify(newTopic));
  // Add topic object to database.

  var args = [JSON.stringify(newTopic)];
  chaincode.invoke('issue_topic', args, function (err, results) {
    if (err) console.log(err);
    else res.json('{"status" : "success"}');
  });
});

/* Submit votes from a user */
router.post('/votesubmit', function (req, res, next) {
  // Get voting data 
  var vote1 = req.body[0];
  vote1.issuer = req.session.name;
  var vote2 = req.body[1];
  vote2.issuer = req.session.name;
  // Submit voting data to database or blockchain or whatever
  res.json('{"status" : "success"}');
});

router.get('/load-chain', function (req, res) {
  console.log('Block chain loaded');
  res.json('{"status" : "success"}');
});

/* Get request for current user */
router.get('/user', function (req, res) {
  var user = req.session.name;
  console.log('Fetching current user: ' + user);
  var response = { 'user': user };
  res.json(response);
});

/* Regiister a user */
router.get('/register', function (req, res) {
  res.json('{"status" : "success"}');
});

module.exports = router;