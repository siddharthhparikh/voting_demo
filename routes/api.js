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
var fs = require('fs');
var ursa = require('ursa');
var cryptico = require('cryptico');

//var path = require('path');
var DEFAULT_VOTES = 5;
 
 (function (c) {
    var parametersBigint = ["n", "d", "p", "q", "dmp1", "dmq1", "coeff"];

    c.privateKeyString = function (rsakey) {
      var keyObj = {};
      parametersBigint.forEach(function (parameter) {
        keyObj[parameter] = c.b16to64(rsakey[parameter].toString(16));
      });
      // e is 3 implicitly
      return JSON.stringify(keyObj);
    }
    c.privateKeyFromString = function (string) {
      var keyObj = JSON.parse(string);
      var rsa = new RSAKey();
      parametersBigint.forEach(function (parameter) {
        rsa[parameter] = parseBigInt(c.b64to16(keyObj[parameter].split("|")[0]), 16);
      });
      rsa.e = parseInt("03", 16);
      return rsa
    }
  })(cryptico)
  
/* Login in request. */
router.post('/login', function (req, res, next) {
  // Set up the user object for the chaincode.
  var CipherText = req.body;
  console.log(req);
  // TODO check if the user already exsits in db.
  fs.readFile('privKey', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
    }
    var DecryptionResult = cryptico.decrypt(CipherText, cryptico.privateKeyFromString(data));
    console.log(DecryptionResult);
    //console.log("[USER]", user);

    /*var username = DecryptionResult.account_id;
    var password = user.password;
    console.log("inside /login");
    var args = [];
    args.push(username);
    args.push(password);
    chaincode.query('check_account', args, function (err, data) {
      console.log("[ERROR]", err)
      if (err != null) {
        console.log("Account does not exist. Please register");
        res.end('{"status" : "Account does not exist. Please register."}');
      }

      console.log(user);
      req.session.name = user.account_id;
      console.log('Logging in as.....');
      console.log(req.session.name);
      //Send response.
      if (username.indexOf('manager') > -1) {
        res.end('{"status" : "success", "type": "manager"}');
      }
      else {
        res.end('{"status" : "success", "type": "user"}');
      }
    });*/
  });
});

router.get('/get-public-key', function (req, res) {
  fs.readFile('pubKey', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      var PassPhrase = "The Moon is a Harsh Mistress.";
      // The length of the RSA key, in bits.
      var Bits = 1024;
      var privKey = cryptico.generateRSAKey(PassPhrase, Bits);
      var pubPem = cryptico.publicKeyString(privKey);       
      var privPem = JSON.stringify(privKey);
      fs.writeFile("pubKey", pubPem, function (err) {
        if (err) {
          console.log(err);
          res.end(err)
        }
        console.log("pubkey was saved!");
        fs.readFile('pubKey', 'utf8', function (err, data) {
          if (err) {
            console.log(err);
            res.end(err)
          }
          console.log(data);
          res.end(data);
        });
      });
      fs.writeFile("privKey", privPem, function (err) {
        if (err) {
          console.log(err);
          res.end(err)
        }
        console.log("privkey was saved!");
      });
    } else {
      console.log(data);
      res.end(data);
    }
  });
});

router.get('/get-account', function (req, res) {
  var args = [];
  args.push(req.session.name);
  chaincode.query('get_account', args, function (err, data) {
    if (data) {
      console.log("[ACCOUNT]", data);
      res.json(data);
    } else {
      res.json('{"status" : "could not retrieve user"}');
    }
  });
});

// Clears all topics on blockchain
// TODO this is just for debugging!
// router.get('/o', function (req, res) {
//   console.log('deleting all topics...');
//   console.log('hope you know what you\'re doing...');
//   chaincode.invoke('clear_all_topics', [], function (err, data) {
//     if (err) {
//       console.log('ERROR: ' + err);
//       res.json('{"status" : "failure"}');
//     } else {
//       console.log('delete of all topics successful!');
//       res.json('{"status" : "success"}');
//     }
//   });
// });

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
  console.log('Getting topic...');
  var args = [];
  args.push(req.query.topicID);
  args.push(req.session.name);
  chaincode.query('get_topic', args, function (err, data) {
    if (err) console.log('ERROR: ', err);
    else res.json(data);
  });
});

/* Checks the validity of the given topic */
router.get('/topic-check', function (req, res, next) {
  // Get the topic id from the post
  var args = [];
  args.push(req.query.topicID);
  args.push(req.session.name);
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
  console.log("in create before running issue topic args are: " + args);
  chaincode.invoke('issue_topic', args, function (err, results) {
    if (err) console.log(err);
    else res.json('{"status" : "success"}');
  });
});

/* Submit votes from a user */
router.post('/vote-submit', function (req, res, next) {
  req.body.voter = req.session.name;

  chaincode.invoke('cast_vote', JSON.stringify(req.body), function (err, results) {
    res.json('{"status" : "success"}');
  })
});

/* Used to let the client know when the Chaincode is finished loading */
router.get('/load-chain', function (req, res) {
  var args = [];
  args.push('InitState')
  chaincode.query('read', args, false, function (err, results) {
    if (results == 'ready!') {
      res.json('{"status" : "success"}');
    }
  });
});

/* Get request for current user logged in */
router.get('/user', function (req, res) {
  var user = req.session.name;
  console.log('Fetching current user: ' + user);
  var response = { 'user': user };
  res.json(response);
});

/* Regiister a user */
router.post('/register', function (req, res) {
  console.log(req.body);
  chaincode.invoke('request_account', [req.body.name, req.body.email, req.body.org, req.body.privileges, req.body.pubPem], function (err, results) {

    if (err != null) {
      res.end('{"status" : "failure", "Error": err}');
    }

    console.log("\n\n\nrequest account result:")
    console.log(results);
    res.end('{"status" : "success"}');
  });
});

router.get('/manager', function (req, res) {
  console.log("in /manager")
  console.log(req.session.name)
  chaincode.query('get_account', [req.session.name], function (err, data) {
    //if (req.session.name.indexOf('manager') > -1) {
    if (data && data.privileges) {
      if (data.privileges.indexOf('manager') > -1) {
        chaincode.query('get_open_requests', [], function (err, data) {
          if (err != null) {
            res.json('{"status" : "failure", "Error": err}');
          }
          console.log(data);
          res.json(data);
        });
      } else {
        res.json('{"status" : "failure", "Error": "You dont have access rights to view this page"}');
      }
    }
  });
});

router.post('/approved', function (req, res) {

  console.log("request approved")
  console.log(req.body)
  console.log(req.body.Email)
  var args = [
    "approved",
    req.body.Name,
    req.body.Email,
    req.body.Org,
    req.body.Privileges,
    req.session.name,
    req.body.VoteCount
  ]
  console.log("In approved args")
  console.log(args)
  chaincode.invoke('change_status', args, function (err, data) {
    if (err != null) {
      console.log("error=" + err)
      res.end('{"status" : "failure", "Error": err}');
    }
    chaincode.query('get_UserID', [req.body.Email], function (err, data) {
      if (err != null) {
        res.end('{"status" : "failure", "Error": err}');
      }
      console.log(data.AllAccReq)
      //console.log(bin2String(data.AllAccReq))
      chaincode.registerAndEnroll(data.AllAccReq, "user", function (err, cred) {
        if (err != null) {
          res.end('{"status" : "failure", "Error": err}');
        }
        console.log("\n\n\ncreate account result:")
        mail.email(req.body.Email, cred, function (err) {
          if (err != null) {
            res.end('{"status" : "failure", "Error": err}');
          }
          res.end('{"status" : "success"}');
        });
      });
    });
  });
});

router.post('/declined', function (req, res) {
  console.log("request declined")
  console.log(req.body)
  console.log(req.body.Email)
  var args = ["declined", req.body.Name, req.body.Email, req.body.Org, req.body.Privileges];
  console.log("Email sent");
  console.log("For changing status ars are: ")
  console.log(args)
  chaincode.invoke('change_status', args, function (data, err) {
    console.log("status changed");
    mail.email(req.body.Email, "declined", function (err) {
      if (err != null) {
        res.json('{"status" : "failure", "Error": err}');
      }
      //res.json('{"status" : "success"}');
    });
  });
});

module.exports = router;
