var express = require('express');
var router = express.Router();
var dbtopics = require('../libs/dbtopics');
var dbusers = require('../libs/dbusers');

//Vote Topics
var voteTopics = {
  't1' : {
    'desc': 'Who should be the next CEO?',
    'cand1': 'Gennaro',
    'cand2': 'Ethan'
  },
  't2' : {
    'desc': 'Should we fire Robet for the fire hydrant incident?',
    'cand1': 'Yes.',
    'cand2': 'Classic!'
  }
}

// Constants
const DEFAULT_VOTES = 5;

// Loads login page.
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Chain Vote' });
});

// Submits username and routes user to main topic page.
router.post('/topics', function (req, res) {
  // Process user
  var name = req.body;
  console.log( name );

  // Create user object.
  /*var user = {
    "_id" : name,
    "votes" : DEFAULT_VOTES
  }*/

  // First checks if the user exists in the db.

  /*
  dbusers.get_user(user._id, function(err, user_doc) {
    var dbuser = user_doc;
    // If user does not exist, create a new one.
    if(err != null) { 
      console.log( 'Creating User......' );
      dbusers.create_user(user.name, function(err, user_doc){});
    } else {
      console.log( 'User Exists.')
    }
  });
  */

  // Collect all topics in db.
  // var topics = dbtopics.getall();
  //console.log( topics );

  res.render('topic-select', {title: 'Chain Vote', username: name, votes: DEFAULT_VOTES});
});

// Generates an new topic object and submits the object to the db.
router.post('/create-topic', function (req, res) {
  var topic = [req.body.id]= {
    'desc': req.body.desc,
    'cand1': req.body.cand1,
    'cand2': req.body.cand2
  }
  voteTopics.append( topic );

  res.end('Topic created.');
});

// Routes user to selected topic page.
router.post('/topic/:id', function(req, res) {
  //db get topics
  var topic = req.body['topicid'][0];
  // Render page
  res.render('topic', { title: 'Chain Vote', votes : DEFAULT_VOTES, topicDesc : voteTopics[topic].desc, firstCand : voteTopics[topic].cand1, secCand : voteTopics[topic].cand2 });
});

// Submits Votes
router.post('/submit-votes', function (req, res) {
  // Allot the number of votes submited to the requested topic
  // ...
  console.log( req.body ); // TODO: Chaincode probably goes here or something.
  // Take user back to topic select page.

  // Take user back to topics page
  res.redirect('/topics');
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

module.exports = router;
