var express = require('express');
var router = express.Router();
var dbusers = require('../libs/dbusers');


/* GET users listing. */
router.post('/login', function(req, res, next) {
  
  res.json('{ "status" : "success"} ');
});

module.exports = router;