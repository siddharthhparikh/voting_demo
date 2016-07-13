var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

// File paths
var routes = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');

var app = express();

// For logging
var TAG = "app.js:";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/api', api);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Topic getter for routing.
app.get('/topic/:id', function (req, res) {
  var topic = req.params.id;
  if (voteTopic.exits(topic)) {
    res.json(voteTopic.topic);
  } else {
    res.json({ error: "Page does not exists" });
  }
});

module.exports = app;

///////////////////////////////
//// CHAINCODE STUFF YAYYY ////
///////////////////////////////

//  __|HM\
// /HH\.M|
// HMHH\.|
// \HMHH\|
// \\HMHH\
// HH\HMHH\
// HHH\HMHH\
//     \HMHH\-HHH\
//      \HMHH\.HHM\
//       \HMHH\.HMH\
//       |\HMHH\\HMH\
//       |H\HHH| \HMH\
//       |MH\H/   \HMH\
//       |MH\      \HMH\
//       \HMH\      \HMH\
//        \HMH\    __|HM|
//         \HMH\  /HH\.M|
//          \HMH\ |MHH\.|
//           \HMH\\HMHH\|
//            \HMH\\HMHH\
//             \HMHH\HMHH\
//              \HHHH\HMHH\
//                    \HMHH\-HHH\
//                     \HMHH\.HHM\
//                      \HMHH\.HMH\
//                      |\HMHH|\HMH
//                      |H\HMH/ \HM
//                      |MH\H/   \H
//                      |MH\      \
//                      \HMH\
//  VK                   \HMH\
//                        \HMH\
//
// ASCII art from http://chris.com/ascii/index.php?art=objects/chains

var io = require('socket.io')();
var hlc = require('hlc');

// Create a client chain
var chaincodeName = 'marble_chaincode'
var chain = hlc.newChain(chaincodeName);
var chaincodeID = null;

// Configure the KeyValStore which is used to store sensitive keys
// as so it is important to secure this storage
chain.setKeyValStore(hlc.newFileKeyValStore('./keyValStore'));

var peerURLs = [];
var caURL = null;
var users = null;

var registrar = null; //user used to register other users and deploy chaincode

console.log('loading hardcoding users and certificate authority...')
caURL = 'grpc://ethan-ca.rtp.raleigh.ibm.com:50051';
peerURLs.push('grpc://ethan-p1.rtp.raleigh.ibm.com:30303');
peerURLs.push('grpc://ethan-p2.rtp.raleigh.ibm.com:30303');
peerURLs.push('grpc://ethan-p3.rtp.raleigh.ibm.com:30303');

registrar = {
  'username': 'ethanicus',
  'secret': 'trainisland'
}

// Set the URL for member services
console.log('adding ca: \'' + caURL + '\'');
chain.setMemberServicesUrl(caURL);

// Add all peers' URL
for (var i in peerURLs) {
  console.log('adding peer with URL: \'' + peerURLs[i] + '\'');
  chain.addPeer(peerURLs[i]);
}

console.log('enrolling user \'%s\' with secret \'%s\' as registrar...', registrar.username, registrar.secret);
chain.enroll(registrar.username, registrar.secret, function (err, user) {
  if (err) return console.log('Error: failed to enroll user: %s', err);

  console.log('successfully enrolled user \'%s\'!', registrar.username);
  chain.setRegistrar(user);

  registrar = user;

  deploy('github.com/voting_demo/chaincode', ['99'], cb_deployed);
});

function cb_deployed() {
  io.on('connection', function connection(ws) {
    scoket.on('message', function incoming(msg) {
      console.log(msg);
      try {
        var data = JSON.parse(msg);
      }
      catch (e) {
        console.log('socket.io message error', e);
      }
    });

    io.on('error', function (e) { console.log('socket.io error', e); });
    io.on('close', function () { console.log('socket.io closed'); });
  });

  // invoke('issue_topic', JSON.stringify({
  //   'topic_id': 'where to go for lunch?',
  //   'issuer': 'ethan!',
  //   'choices': ['chipotle', 'ruckus', 'other']
  // }), function(err, results) {
  //   console.log(err);
  //   console.log(results);
  // });

  query('get_all_topics', [], function (err, results) {
    console.log(results.result.toString('ascii'));
  });
}

function deploy(path, args, cb) {
  if (registrar == null) {
    console.log('ERROR: attempted to deploy chaincode without initializing registrar...');
    return;
  }

  var deployRequest = {
    args: args,
    chaincodeID: chaincodeName,
    fcn: 'init',
    chaincodePath: path
  }
  console.log('deploying chaincode from path %s', deployRequest.chaincodePath)
  var transactionContext = registrar.deploy(deployRequest);

  transactionContext.on('complete', function (results) {
    console.log('chaincode deployed successfully!');
    console.log('chaincode-ID: %s', results.chaincodeID);

    chaincodeID = results.chaincodeID;

    cb();
  });

  transactionContext.on('error', function (err) {
    console.log('Error deploying chaincode: %s', err.msg);
    console.log('App will fail without chaincode, sorry!');
  });
}

function invoke(fcn, args, cb) {
  var invokeRequest = {
    fcn: fcn,
    args: args,
    chaincodeID: chaincodeID
  }

  var transactionContext = registrar.invoke(invokeRequest);

  transactionContext.on('complete', function (results) {
    cb(null, results);
  });

  transactionContext.on('error', function (err) {
    cb(err, null);
  });
}

function query(fcn, args, cb) {
  var queryRequest = {
    fcn: fcn,
    args: args,
    chaincodeID: chaincodeID
  }

  var transactionContext = registrar.query(queryRequest);

  transactionContext.on('complete', function (results) {
    cb(null, results);
  });

  transactionContext.on('error', function (err) {
    cb(err, null);
  });
}
