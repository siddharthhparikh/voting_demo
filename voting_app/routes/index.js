var express = require('express');
var router = express.Router();
// Number of votes a user starts with.
var votes = 5;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vote Chain' });
});

// Routing for vote topics
router.get('/topic1', function(req, res) {
  res.render('topic1', { title: 'Vote Chain', votes });
});

router.get('/topic2', function(req, res) {
  res.render('topic2', { title: 'Vote Chain', votes });
});

router.get('/topic3', function(req, res) {
  res.render('topic3', { title: 'Vote Chain', votes });
});

module.exports = router;
