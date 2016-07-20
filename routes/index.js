var express = require('express');
var router = express.Router();
var url = require('url');

// Loads login page.
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Chain Vote' });
});

// Submits username and routes user to main topic page.
router.get('/topics', function (req, res) {
  res.render('topic-select', {title: 'Chain Vote'});
});

// Routes user to selected topic page.
router.get('/topic/:id', function(req, res) {
  var url_parts = url.parse(req.url, true);
  console.log(url_parts.query);

  var id;
  for (var i in url_parts.query) {
    id = url_parts.query[i];
  }
  
  res.render('topic', {title: 'Chain Vote', topicID: id});
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

module.exports = router;
