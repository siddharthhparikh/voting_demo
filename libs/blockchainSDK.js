/**
 * @author Ethan Coeytaux
 * 
 * provides functions for interacting with chaincode SDK
 */

var hfc = require('hfc');
var fs = require('fs');

var exports = module.exports;

// Create a client chain
var chaincodeName = 'voting_chaincode'
var chain = hfc.newChain("voting");
chain.setDeployWaitTime(300);
var chaincodeID = null;


// Configure the KeyValStore which is used to store sensitive keys
// as so it is important to secure this storage
chain.setKeyValStore(hfc.newFileKeyValStore('/tmp/keyValStore'));

var peerURLs = [];
var caURL = null;
var users = null;
var user_manager = require("./users")
var registrar = null; //user used to register other users and deploy chaincode


if (fs.existsSync("us.blockchain.ibm.com.cert")) {
    var pem = fs.readFileSync('us.blockchain.ibm.com.cert');

    chain.setECDSAModeForGRPC(true);

    console.log('loading hardcoding users and certificate authority...')
    caURL = 'grpcs://4eb1f2ef-81ee-438b-adc6-6dd6bf6d5617_ca.us.blockchain.ibm.com:30303';
    //caURL = 'grpc://ethan-ca.rtp.raleigh.ibm.com:50051';
    peerURLs = []
    peerURLs.push('grpcs://4eb1f2ef-81ee-438b-adc6-6dd6bf6d5617_vp0.us.blockchain.ibm.com:30303');
    //peerURLs.push('grpc://ethan-p1.rtp.raleigh.ibm.com:30303');

    registrar = {
        'username': 'ethanicus',
        //'username': 'WebAppAdmin',
        'secret': 'trainisland'
        //'secret': '82922fdc04'
    }

    // Set the URL for member services
    console.log('adding ca: \'' + caURL + '\'');
    chain.setMemberServicesUrl(caURL, {pem: pem});

    // Add all peers' URL
    for (var i in peerURLs) {
        console.log('adding peer: \'' + peerURLs[i] + '\'');
        chain.addPeer(peerURLs[i], {pem: pem});
    }

    console.log('enrolling user \'%s\' with secret \'%s\' as registrar...', registrar.username, registrar.secret);
    chain.enroll(registrar.username, registrar.secret, function (err, user) {
        if (err) return console.log('Error: failed to enroll user: %s', err);

        console.log('successfully enrolled user \'%s\'!', registrar.username);
        chain.setRegistrar(user);

        registrar = user;

        exports.deploy('github.com/voting_demo/chaincode/', ['ready!'], function (chaincodeID) {
            user_manager.setup(chaincodeID, chain, cb_deployed);
        });

    });
} else {
    console.log('[ERROR] us.blockchain.ibm.com.cert not found')
}

function cb_deployed() {

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
        //chaincodeID: chaincodeName,
        fcn: 'init',
        chaincodePath: path,
        certificatePath: "/certs/blockchain-cert.pem"
    }
    console.log('deploying chaincode from path %s', deployRequest.chaincodePath)
    var transactionContext = registrar.deploy(deployRequest);

    transactionContext.on('submitted', function (results) {
        console.log('chaincode submitted successfully!');
        console.log('chaincode-ID: %s', results.chaincodeID);

        chaincodeID = results.chaincodeID;
        //chaincode has been deployed

        if (cb) cb(chaincodeID);
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
    if (chaincodeID == "" || chaincodeID == null) {
        return new Error("No chaincode ID implies chaincode has not yet deployed");
    }

    var invokeRequest = {
        fcn: fcn,
        args: args,
        chaincodeID: chaincodeID
    }

    var transactionContext = registrar.invoke(invokeRequest);

    transactionContext.on('complete', function (results) {
        if (cb) {
            if (results.result) {
                console.log("In invoke results on complete")
                console.log(results)
                console.log(results.result)
                cb(null, results.result)
            } else {
                cb(new Error("no data retrieved from invoke"), null);
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
exports.query = function (fcn, args, expectJSON, cb) {
    if (chaincodeID == "" || chaincodeID == null) {
        return new Error("No chaincode ID implies chaincode has not yet deployed");
    }

    if (typeof expectJSON === 'function') { //only 3 parameters passed, expectJSON defaults to true
        cb = expectJSON;
        expectJSON = true;
    }

    var queryRequest = {
        fcn: fcn,
        args: args,
        chaincodeID: chaincodeID
    }

    var transactionContext = registrar.query(queryRequest);

    transactionContext.on('complete', function (results) {
        if (cb) {
            console.log("query completed with results:")
            console.log(results)
            if (results.result) { //is result is not null
                //parse data from buffer to json
                var data = String.fromCharCode.apply(String, results.result);
                if (expectJSON) {
                    if (data.length > 0) cb(null, JSON.parse(data));
                    else cb(null, null);
                } else {
                    cb(null, data)
                }
            } else {
                cb(new Error("no data retrieved from query"), null);
            }
        }
    });

    transactionContext.on('error', function (err) {
        if (cb) {
            console.log("query completed with error:")
            console.log(err)
            cb(err, null);
        }
    });
}

module.exports.registerAndEnroll = function (username, role, cb) {
    return user_manager.registerUser(username, role, cb);
}

module.exports.login = function (username, secret, cb) {
    console.log("I am inside blockchainsdk.js login function")
    return user_manager.login(username, secret, cb);
}