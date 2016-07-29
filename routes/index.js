var express = require('express');
var router = express.Router();
var url = require('url');
var session = require('express-session');
var chaincode = require('../libs/blockchainSDK');

// Loads login page.
router.get('/', function (req, res, next) {
  res.render('login', { title: 'Chain Vote' });
});

// Submits username and routes user to main topic page.
router.get('/topics', function (req, res) {
  if(!req.session.name){
    res.json('{"status":"Error: No user session"}')
  }
  res.render('topic-select', { title: 'Chain Vote' });
});

// Routes user to selected topic page.
router.get('/topic/:id', function (req, res) {
  console.log("url: ", req.url)
  var url_parts = url.parse(req.url, true);
  console.log(url_parts.query);

  var id;
  for (var i in url_parts.query) {
    id = url_parts.query[i];
  }

  var args = [];
  args.push(id);
  args.push(req.session.name);
  chaincode.query('get_topic', args, function (err, data) {
    if (data && !err) {
      res.render('topic', { title: 'Chain Vote', topicName: data.Topic.topic, topicID: data.Topic.topic_id });
    } else {
       res.render('topic', { title: 'Chain Vote', topicName: "TOPIC NOT FOUND", topicID: "" }); //TODO return topic not found object?
    }
  });

});

router.get('/manager', function(req, res) {
  res.render('manager', {title: 'Chain Vote'});
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

module.exports = router;
