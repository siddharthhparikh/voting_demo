var express = require('express');
var router = express.Router();
var dbusers = require('../libs/dbusers');


/* GET users listing. */
router.post('/login', function(req, res, next) {
  // Set up the user object for the chaincode.
  var user = req.body;
  user.VoteCount = 5;
  // TODO check if the user already exsits in db.

  // TODO Create user in chaincode.

    console.log('Loging in as.....');
  console.log(user);


  res.json('{"status" : "success"}');
});


router.post('/topic/:id', function(req, res, next) {
  // Get the topic id from the post
  
  // Get the topic object from the db.
  console.log('Getting topic from database.')

  res.json('{"status" : "success"}');
});

router.post('/create', function(req, res, next) {
  var newTopic = req.body;
  
  console.log('New topic: \n ' + newTopic );
  // Add topic object to database.

  res.json('{"status" : "success"}');
});

router.post('/votesubmit', function(req, res, next) {
  // Get voting data 
  console.log();
  // Submit voting data to database or blockchain or whatever
  
  res.json('{"status" : "success"}');
});


module.exports = router;