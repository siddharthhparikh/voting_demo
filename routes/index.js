var express = require('express');
var router = express.Router();

// Loads login page.
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Chain Vote' });
});

// Submits username and routes user to main topic page.
router.get('/topics', function (req, res) {
  res.render('topic-select', {title: 'Chain Vote'});
});

// Routes user to selected topic page.
// router.get('/topic/:id', function(req, res) {
//   // TODO test if this work
//   res.render('topic', {title: 'Chain Vote', topicid: req.param.id});
// });

//TEMP routing to topic
router.get('/topic', function(req, res) {
  res.render('topic', {title: 'Chain Vote'});
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

module.exports = router;
