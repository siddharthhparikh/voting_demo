/**
 * @author Ethan Coeytaux
 * 
 * provides functions for interacting with chaincode SDK
 */

var hlc = require('hlc');

var exports = module.exports;

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
    console.log('adding peer: \'' + peerURLs[i] + '\'');
    chain.addPeer(peerURLs[i]);
}

console.log('enrolling user \'%s\' with secret \'%s\' as registrar...', registrar.username, registrar.secret);
chain.enroll(registrar.username, registrar.secret, function (err, user) {
    if (err) return console.log('Error: failed to enroll user: %s', err);

    console.log('successfully enrolled user \'%s\'!', registrar.username);
    chain.setRegistrar(user);

    registrar = user;

    exports.deploy('github.com/voting_demo/chaincode', ['99'], cb_deployed);
});

function cb_deployed() {

    // invoke('issue_topic', JSON.stringify({
    //   'topic_id': 'where to go for lunch?',
    //   'issuer': 'ethan!',
    //   'choices': ['chipotle', 'ruckus', 'other']
    // }), function(err, results) {
    //   console.log(err);
    //   console.log(results);
    // });

    // query('get_all_topics', [], function (err, results) {
    //   if (results && results.result) console.log(results.result.toString('ascii'));
    // });
}

///////////////////////////////
// CHAINCODE SDK HELPER FUNCTIONS
///////////////////////////////

//deploys chaincode (cb in form of cb(err))
exports.deploy = function (path, args, cb) {
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

        //chaincode has been deployed

        if (cb) cb(null);
    });

    transactionContext.on('error', function (err) {
        console.log('Error deploying chaincode: %s', err.msg);
        console.log('App will fail without chaincode, sorry!');

        //chaincode has errored

        cb(err);
    });
}

//invokes function on chaincode (cb in form of cb(err, result))
exports.invoke = function (fcn, args, cb) {
    var invokeRequest = {
        fcn: fcn,
        args: args,
        chaincodeID: chaincodeID
    }

    var transactionContext = registrar.invoke(invokeRequest);

    transactionContext.on('complete', function (results) {
        if (cb) {
            if (results.result) {
                cb(null, results.result)
            } else {
                cb(null, null);
            }
        }
    });

    transactionContext.on('error', function (err) {
        if (cb) {
            cb(err, null);
        }
    });
}

//queries on chaincode (cb in form of cb(err, result))
exports.query = function (fcn, args, cb) {
    var queryRequest = {
        fcn: fcn,
        args: args,
        chaincodeID: chaincodeID
    }

    var transactionContext = registrar.query(queryRequest);

    transactionContext.on('complete', function (results) {
        if (cb) {
            if (results.result) { //is result is not null
                //parse data from buffer to json
                var data = String.fromCharCode.apply(String, results.result);
                if (data.length > 0) cb(null, JSON.parse(data));
                else cb(null, null);
            } else {
                cb(null, null);
            }
        }
    });

    transactionContext.on('error', function (err) {
        if (cb) {
            cb(err, null);
        }
    });
}
