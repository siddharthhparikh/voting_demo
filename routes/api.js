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

var DEFAULT_VOTES = 5;

/* Login in request. */
router.post('/login', function (req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  // TODO check if the user already exsits in db.

  var username = user.account_id;
  var password = user.account_pass;
  console.log("inside /login");
  chaincode.login(username, password, function (err) {
    if (err != null) {
      res.json('{"status" : "Invalid login."}');
    }
    req.session.name = user.account_id;
    console.log('Logging in as.....');
    console.log(req.session.name);
    // Send response.
    res.json('{"status" : "success"}');

  });
  /*chaincode.query('get_account', args, function (err, data) {
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
  });*/
  // TODO Create user string queryin chaincode.
});

router.get('/get-account', function (req, res, next) {
  var args = req.body.account_id;
  chaincode.query('get_account', args, function (err, data) {
    if (data) {
      res.json(data);
    } else {
      res.json('{"status" : "could not retrieve user"}');
    }
  });
})

//clears all topics on blockchain
//TODO this is just for debugging!
router.get('/o', function (req, res) {
  console.log('deleting all topics...');
  console.log('hope you know what you\'re doing...');
  chaincode.invoke('clear_all_topics', [], function (err, data) {
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
    if (err) console.log('ERROR: ', err);
    else res.json(data);
  });
});

/* Get specific voting topic from blockchain */

router.get('/get-topic', function (req, res) {
  console.log('getting topic...');
  console.log(req.query);
  var args = req.query.id;
  chaincode.query('get_topic', args, function (err, data) {
    if (err) console.log('ERROR: ', err);
    else res.json(data);
  });
});

router.get('/topic-check', function (req, res, next) {
  // Get the topic id from the post
  var topicID = req.query;
  console.log("TopicID: ", topicID);
  var args = [];
  args.push(topicID.topic_id);
  chaincode.query('get-topic', args, function (err, data) {
    if (data) {
      res.json('{"status" : "success"}');
    } else {
      res.json('{"status" : "failure"}');
    }
  });
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
router.post('/vote-submit', function (req, res, next) {
  req.body.voter = req.session.name;

  console.log(JSON.stringify(req.body));
  chaincode.invoke('cast_vote', JSON.stringify(req.body), function (err, results) {
    console.log(results);

    res.json('{"status" : "success"}');
  })
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
router.post('/register', function (req, res) {
  console.log(req.body);
  var username = req.body.name;
  var email = req.body.email;
  var votes = "10";
  chaincode.invoke('request_account', [username, email], function (err, results) {
    if (err != null) {
      res.json('{"status" : "failure", "Error": err}');
    }
    console.log("\n\n\nrequest account result:")
    console.log(results);
    chaincode.registerAndEnroll(username, "user", function (err, cred) {
      //chaincode.invoke('create_account', [username, email, votes], function (err, results) {
      if (err != null) {
        res.json('{"status" : "failure", "Error": err}');
      }
      console.log("\n\n\ncreate account result:")
      console.log(cred);
      res.json('{"status" : "success"}');
    });
  });
  // create account
  //remove this when ui is ready for manager approval
});

module.exports = router;
