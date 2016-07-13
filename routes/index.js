var express = require('express');
var router = express.Router();
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
router.get('/topics', function (req, res) {
  res.render('topic-select', {title: 'Chain Votes', username : 'placeholder'});
});

// Routes user to selected topic page.
router.post('/topic/:id', function(req, res) {
  //db get topics
  var topic = req.body['topicid'][0];
  // Render page
  res.render('topic', { title: 'Chain Vote', votes : DEFAULT_VOTES, topicDesc : voteTopics[topic].desc, firstCand : voteTopics[topic].cand1, secCand : voteTopics[topic].cand2 });
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

module.exports = router;
