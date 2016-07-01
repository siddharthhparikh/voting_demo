var dbtopics = module.exports;

// Credentials for the cloudant topic db.
var new_creds = {
  host: '460537b0-2237-4c81-ad81-882a41223984-bluemix.cloudant.com',
  port: "443",
  username: 'fatedisommemoneatairopen', //Key
  password: '6f5a5c959019f6c20704fb8819843fe1eced461e',//API password
};
nano = require('nano')('https://' + new_creds.username + ':' + new_creds.password + '@' + new_creds.host + ':' + new_creds.port);	//lets use api key to make the docs
db = nano.use("topics");

// Get a requested topic from the cloudant db.
dbtopics.get_topic = function( topic, cb ) {
  db.get(topic, {}, function(err, body){
      if(cb){
          if(!err && body) cb(null,body);
          else if(err && err.statusCode) cb(err, statusCode, {error: err.error, reason: error.reason});
          else cb(500, {error: err, reason: 'unknown!'});
     }
  });
}

// Create a new topic in the cloudant db.
dbtopics.create_topic = function(topic, cb) { // user is a json object
  db.insert(topic, function(err, body){
    if(cb){
      if(!err && body){
        topic._rev = body.rev;
        cb(null, topic);
      }
      else if(err && err.statusCode) cb(err.statusCode, {error: err.error, reason: err.reason});
      else cb(500, {error: err, reason: 'unknown!' });
    }
  });
} 

// Get all topics from the cloudant database
dbtopics.getall = function( cb ) {
  db.get( '_all_docs', {}, function(err, body){
    console.log( 'dbtopics body:', body );
    console.log( 'error: ', err);
      if(cb){
          if(!err && body) cb(null,body);
          else if(err && err.statusCode) cb(err, statusCode, {error: err.error, reason: error.reason});
          else cb(500, {error: err, reason: 'unknown!'});
     }
  });
}
