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

// Constants
const DEFAULT_VOTES = 5;

var app = express();

// For logging
var TAG = "app.js:";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

//User Array stores all active voting users in Chain Vote.
//var users = [];

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// ==================================
// start blockchain code
// ==================================
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
var manual = JSON.parse(fs.readFileSync('mycreds.json', 'utf8'));

var peers, users, ca;

if (manual.credentials.peers) {
    console.log(TAG, 'loading', manual.credentials.peers.length, 'hardcoded peers');
    peers = manual.credentials.peers;
}

if (manual.credentials.users) {
    console.log(TAG, "loading", manual.credentials.users.length, "hardcoded users");
    users = manual.credentials.users;
}

if (manual.credentials.ca) {
    var ca_name = Object.keys(manual.credentials.ca)[0];
    console.log(TAG, "loading ca:", ca_name);
    ca = manual.credentials.ca[ca_name];
}

if (process.env.VCAP_SERVICES) {															//load from vcap, search for service, 1 of the 3 should be found...
    var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
    for (var i in servicesObject) {
        if (i.indexOf('ibm-blockchain') >= 0) {											// looks close enough (can be suffixed dev, prod, or staging)
            if (servicesObject[i][0].credentials.error) {
                console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
                peers = null;
                users = null;
                process.error = {
                    type: 'network',
                    msg: "Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date."
                };
            }
            if (servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers) {
                console.log('overwritting peers, loading from a vcap service: ', i);
                peers = servicesObject[i][0].credentials.peers;
                var ca_name = Object.keys(servicesObject[i][0].credentials.ca)[0];
                console.log(TAG, "loading ca:", ca_name);
                ca = servicesObject[i][0].credentials.ca[ca_name];
                if (servicesObject[i][0].credentials.users) {
                    console.log('overwritting users, loading from a vcap service: ', i);
                    users = servicesObject[i][0].credentials.users;
                }
                else users = null;														//no security
                break;
            }
        }
    }
}

// Options for the blockchain network
var options = {};

// Start up the network!!
configure_network();

// ==================================
// configure ibm-blockchain-js sdk
// ==================================
function configure_network() {

    options = {
        network: {
            peers: peers,
            users: users
        },
        chaincode: {
            zip_url: 'https://github.com/ecoeyta/cv-chaincode/archive/master.zip',
            unzip_dir: 'cv-chaincode-master/hyperledger',							    //subdirectroy name of chaincode after unzipped
            git_url: 'https://github.com/ecoeyta/cv-chaincode/hyperledger',		//GO get http url
          }
    };
    if (process.env.VCAP_SERVICES) {
        console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok buddy\n');
        options.chaincode.deployed_name = "";
    }
    
    ibc.load(options, cb_ready);
}

var chaincode = null;
function cb_ready(err, cc) {//response has chaincode functions
    if (err != null) {
        console.log('! looks like an error loading the chaincode, app will fail\n', err);
        if (!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
    }
    else {
        chaincode = cc;
        if (!cc.details.deployed_name || cc.details.deployed_name === "") {												//decide if i need to deploy
            cc.deploy('init', [], {save_path: './cc_summaries'}, finalSetup);
        }
        else {
            console.log('chaincode summary file indicates chaincode has been previously deployed');
            finalSetup();
        }
    }
}

/**
 * Configures other parts of the app that depend on the blockchain network being configured and running in
 * order to function.
 * @param err Will capture any errors from deploying the chaincode.
 */
function finalSetup(err, data) {
    if (err != null) {
        //look at tutorial_part1.md in the trouble shooting section for help
        console.log('! looks like a deploy error, holding off on the starting the socket\n', err);
        if (!process.error) process.error = {type: 'deploy', msg: err.details};
    } else {
      //CHAINCODE SETUP HERE
    }
}


module.exports = app;