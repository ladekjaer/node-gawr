#!/usr/bin/env node

// Load modules.
var dotjson = require('dotjson');
var configPath = require('osenv').home()+'/.gawr';
var optimist = require('optimist')
var argv = optimist.argv;
var https = require('https');
var edit = require('string-editor');
var auth = require('adwords-auth');

if (argv.version) {
    var config = require('./package');
    console.log(config.version);
    process.exit(0);
}

// Create empty config-file if it does not exists.
var fs = require('fs');
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '{}');
}

// Read input or set defaults.
var format = argv.format || 'CSV';
format = format.toUpperCase();

var getAwql = function(callback) {
    if (argv.i || argv.interactive) {
        edit('SELECT ', 'awql.sql', function(err, awql) {
            if (err) return callback(err);
            callback(null, awql);
        });
        return;
    }
    if (!argv._[0]) {
        callback(null, false);
        return;
    }
    if (argv._[0] && argv._[0] !== '-') {
        callback(null, argv._[0]);
        return;
    }
    if (argv._[0] && argv._[0] === '-') {
        var buf = '';
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function(chunk) {
            buf += chunk;
        });
        process.stdin.on('end', function() {
            callback(null, buf);
            return;
        });
    }
};

getAwql(function(err, awql) {
    // Check if AWQL is given.
    if (!awql) {
        console.error('Retrieve AdWords reports using AWQL.');
        console.error('Usage: gawr [AWQL]');
        console.error('');
        console.error('Options:');
        console.error('--format   format in which to deliver data [optinal]');
        console.error('');
        console.error('Missing AWQL.');
        process.exit(1);
    }

    var body = '__rdquery='+encodeURIComponent(awql)+'&__fmt='+format;

    // Check if format is proper.
    var formats = [
        'CSVFOREXCEL'
        , 'CSV'
        , 'TSV'
        , 'XML'
        , 'GZIPPED_CSV'
        , 'PDF'
        , 'GZIPPED_XML'
    ];
    if (formats.indexOf(format) === -1) {
        console.error('Incorrect format speficied.');
        process.exit(1);
    }

    var readline;

    var setHeader = function(field, callback) {
        if (field === 'returnMoneyInMicros') {
            setMoneyFormat(callback);
            return;
        }
        if (field === 'accessToken') {
            loadHeader('clientId', function(err, clientId) {
                loadHeader('clientSecret', function(err, clientSecret) {
                    loadHeader('redirectUri', function(err, redirectUri) {
                        auth(clientId, clientSecret, redirectUri, function(err, tokens) {
                            if (err) throw callback(err, null);
                            callback(null, tokens.access_token);
                        });
                    });
                });
            });
            return;
        }
        readline = readline || require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readline.question('Please enter '+field.toString()+':', function(value) {
            var obj = {};
            obj[field] = value;
            dotjson.set(configPath, obj, {createFile: true}); 
            readline.close();
            readline = null;
            callback(null, value);
        });
    };

    var setMoneyFormat = function(callback) {
        readline = readline || require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readline.question('Return money in micros? (y/n)', function(value) {
            if (value === 'y') {
                readline.close();
                dotjson.set(configPath, {returnMoneyInMicros: true}, {createFile: true});
                return callback(null, true);
            }
            if (value === 'n') {
                readline.close();
                dotjson.set(configPath, {returnMoneyInMicros: false}, {createFile: true});
                return callback(null, false);
            }
            setMoneyFormat(callback);
        });
    };

    var loadHeader = function(header, callback) {
        var value = dotjson.get(configPath, header);
        if (value !== undefined && value !== null) return callback(null, value);
        setHeader(header, callback);
    };

    var loadConfig = function(callback) {
        var headers = {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": body.length
        };
        loadHeader('accessToken', function(err, value) {
            headers['Authorization'] = 'Bearer ';
            headers['Authorization'] +=value;
            loadHeader('developerToken', function(err, value) {
                headers['developerToken'] = value;
                loadHeader('clientCustomerId', function(err, value) {
                    if (argv.customerId) headers['clientCustomerId'] = argv.customerId;
                    else headers['clientCustomerId'] = value;
                    loadHeader('returnMoneyInMicros', function(err, value) {
                        headers['returnMoneyInMicros'] = value;
                        callback(null, headers);
                    });
                });
            });
        });
    };

    // Send POST-request and direct response body to stdout.
    loadConfig(function(err, headers) {
        var post_options = {
            hostname: "adwords.google.com",
            port: 443,
            path: '/api/adwords/reportdownload/v201309',
            method: 'POST',
            headers: headers
        };
        var post_req = https.get(post_options, function(res) {
            if (res.statusCode === 200) {
                res.on('data', function(chunk) {
                    process.stdout.write(chunk);
                });
            }
            if (res.statusCode !== 200) {
                res.on('data', function(chunk) {
                    process.stderr.write(chunk);
                });
                res.on('end', function() {
                    process.exit(1);
                });
            }
        });
        post_req.on('error', function(e) {
            console.error('Problem with request: ' + e.message);
            process.exit(1);
        });
        post_req.write(body);
        post_req.end();
    });
});

