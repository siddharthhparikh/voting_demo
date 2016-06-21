var express = require('express');
var router = express.Router();


// Constants
const DEFAULT_VOTES = 5;

// List of current available voting topics
var voteTopics = {
  "t1" : {
      "desc" : "Who should be the next CEO?",
      "cand1" : "Gennaro",
      "cand2" : "Ethan"
  },
   "t2" : {
      "desc" : "Should we fire Robert after the fire hydrant incident?",
      "cand1" : "Yes.",
      "cand2" : "Classic Rob..."
   }
}

process.env.voteTopics = voteTopics;

// List of current registered voters.
var voters = {
  "Gennaro" : {
    "votes" : 15
  },
  "Ethan" : {
    "votes" : 15 
  },
  "VIP" : {
    "votes" : 100
  }
};


// Loads login page.
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Chain Vote' });
});

// Submits Username.
router.post('/topics', function (req, res) {
  // Check if user is special.
  var name = res.body;
  console.log('!', name);
  // If user is not specail allocate default votes.
  res.render('topic-select', {title: 'Chain Vote'});
});

// Generates a new topic.
router.post('/create-topic', function (req, res) {
  console.log(res.body);
});

// Routing for vote topics.
router.post('/open-topic', function(req, res) {
  //db get topics
  var topic = req.body['topicid'][0];
  
  res.render('topic', { title: 'Chain Vote', votes : DEFAULT_VOTES, topicDesc : voteTopics[topic].desc, firstCand : voteTopics[topic].cand1, secCand : voteTopics[topic].cand2 });
});

// Submits Votes
router.post('/submit-votes', function (req, res) {
  // Allot the number of votes submited to the requested topic
  // ...
  console.log( req.body ); // TODO: Chaincode probably goes here or something.
  // Take user back to topic select page.
  res.render('topic-selecg', { title: 'Chain Vote' });
});

module.exports = router;
