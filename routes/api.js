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
var mail = require('../libs/mail')

var DEFAULT_VOTES = 5;

/* Login in request. */
router.post('/login', function (req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  // TODO check if the user already exsits in db.

  var username = user.account_id;
  var password = user.account_pass;
  console.log("inside /login");
  chaincode.login(username, password, "abcd", "10", function (err) {
    if (err != null) {
      res.json('{"status" : "Invalid login."}');
    }
    req.session.name = user.account_id;
    console.log('Logging in as.....');
    console.log(req.session.name);
    // Send response.
    if (username.indexOf('manager') > -1) {
      res.json('{"status" : "success", "type": "manager"}');
    }
    else {
      res.json('{"status" : "success", "type": "user"}');
    }
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
  args.push(req.session.name);
  chaincode.query('get_all_topics', args, function (err, data) {
    if (err) console.log('ERROR: ', err);
    else res.json(data);
  });
});

/* Get specific voting topic from blockchain */

router.get('/get-topic', function (req, res) {
  console.log('getting topic...');
  var args = [];
  args.push(req.query.topicID);
  args.push(req.session.name);
  chaincode.query('get_topic', args, function (err, data) {
    console.log("DATA: ", data);
    if (err) console.log('ERROR: ', err);
    else res.json(data);
  });
});

router.get('/topic-check', function (req, res, next) {
  // Get the topic id from the post
  var args = [];
  args.push(req.query.topicID);
  args.push(req.session.name);
  console.log(req.query);
  chaincode.query('get_topic', args, function (err, data) {
    if (err) {
      res.json('{"status" : "failure"}');
    } else {
      res.json('{"status" : "success"}');
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
  chaincode.invoke('request_account', [req.body.name, req.body.email, req.body.org], function (err, results) {
    if (err != null) {
      res.json('{"status" : "failure", "Error": err}');
    }
    console.log("\n\n\nrequest account result:")
    console.log(results);
    //res.json('{"status" : "success"}');
  });
});

router.get('/manager', function (req, res) {
  console.log(req.session.name)
  if (req.session.name.indexOf('manager') > -1) {
    chaincode.query('get_open_requests', [], function (err, data) {
      console.log(data);
      res.json(data);
    });
  } else {
    res.send(null);
  }
});

router.post('/approved', function (req, res) {
  console.log("request approved")
  console.log(req.body)
  console.log(req.body.Name)
  var args = [
    'approved',
    req.body.Name,
    req.body.Email,
    req.session.name,
    req.body.VoteCount
  ]
  console.log("In approved args")
  console.log(args)
  chaincode.invoke('change_status', args, function (data, err) {
    if (err != null) {
      res.json('{"status" : "failure", "Error": err}');
    }
    console.log(data)
    chaincode.registerAndEnroll(req.body.Email, "user", function (err, cred) {
      if (err != null) {
        res.json('{"status" : "failure", "Error": err}');
      }
      console.log("\n\n\ncreate account result:")
      console.log(cred);
      mail.email(req.body.Email, cred, function (err) {
        if (err != null) {
          res.json('{"status" : "failure", "Error": err}');
        }
        //res.json('{"status" : "success"}');
      });
    });
  });
});

router.post('/declined', function (req, res) {
  console.log("request declined")
  console.log(req.body)
  mail.email(req.body.Email, "declined", function (err) {
    var args = ['declined', req.body.Name, req.body.Email];
    console.log("Email sent");
    console.log("For changing status ars are: ")
    console.log(args)
    chaincode.invoke('change_status', args, function (data, err) {
      console.log("status changed");
      if (err != null) {
        res.json('{"status" : "failure", "Error": err}');
      }
      //res.json('{"status" : "success"}');
    });
  });
});

module.exports = router;
