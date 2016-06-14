var express = require('express');
var router = express.Router();



// Number of votes a user starts with.
const DEFAULT_VOTES = 5;

// Loads login page.
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Vote Chain' });
});

// Loads homepage.
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vote Chain' });
});


// Routing for vote topics.
router.get('/topic1', function(req, res) {
  res.render('topic1', { title: 'Vote Chain', votes : DEFAULT_VOTES });
});

router.get('/topic2', function(req, res) {
  res.render('topic2', { title: 'Vote Chain', votes : DEFAULT_VOTES });
});

router.get('/topic3', function(req, res) {
  res.render('topic3', { title: 'Vote Chain', votes : DEFAULT_VOTES });
});

// Submits Votes
router.post('/num-votes', function (req, res) {
  // Allot the number of votes submited to the requested topic
  // ...
  console.log( req.body ); // TODO: Chaincode probably goes here or something.
});


// Submits Username.
router.post('/submit-username', function (req, res) {
  // Adds user to the user array in app.js.
  //users.push({ "name" : res,
    //           "votes" : DEFAULT_VOTES });
  // Switches user view to home page.
  res.render('index', {title: 'Vote Chain' });
});

module.exports = router;
