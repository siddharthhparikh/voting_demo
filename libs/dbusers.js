var dbusers = module.exports;

// Credentials for the cloudant user db.
var new_creds = {
  host: '460537b0-2237-4c81-ad81-882a41223984-bluemix.cloudant.com',
  port: "443",
  username: 'aidsheryintyarruvieseems', //Key
  password: '6f5a5c959019f6c20704fb8819843fe1eced461e',//API password
};
nano = require('nano')('https://' + new_creds.username + ':' + new_creds.password + '@' + new_creds.host + ':' + new_creds.port);	//lets use api key to make the docs
db = nano.use("users");

// Get a requested user from the cloudant db.
dbusers.get_user = function( user, cb ) {
  db.get(user, {}, function(err, body){
      if(cb){
        if(!err && body) cb(null,body);
        else if(err && err.statusCode) cb(err.statusCode, {error: err.error, reason: err.reason});
        else cb(500, {error: err, reason: 'unknown!'});
     }
  });
}

// Create a new user in the cloudant db.
dbusers.create_user =  function(user, cb) { // user is a json object
  db.insert(user, function(err, body) {
    if(cb) {
      if(!err && body) {
        user._rev = body.rev;
        cb(null, user);
      }
      else if(err && err.statusCode) cb(err.statusCode, {error: err.error, reason: err.reason});
      else cb(500, {error: err, reason: 'unknown!' });
      
    }
  });
} 