var express = require('express');
var router = express.Router();
var dbusers = require('../libs/dbusers');


/* GET users listing. */
router.post('/login', function(req, res, next) {

  console.log('Loging in as.....');
  
  res.json('{"status" : "success"}');
});


router.post('/topic/:id', function(req, res, next) {
  // Get the topic id from the post
  
  // Get the topic object from the db.
  console.log('Getting topic from database.')

  res.json('{"status" : "success"}');
});

router.post('/create', function(req, res, next) {
  // Get topic details from post.

  // Create topic object.
  var newTopic = {};
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