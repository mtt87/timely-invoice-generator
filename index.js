var express = require('express');
var app = express();
var popsicle = require('popsicle');
var path = require('path');

var baseUrl = 'https://api.timelyapp.com/1.0';
var access_token;

var oauth2 = require('simple-oauth2')({
  clientID: '8da2228b16cadc48ad344bcb5be7e5ddd151aa68ad515823a83b8f50f7e9f197',
  clientSecret: '9638d580ca2d50ac816f38c3c1156c8736972d28663f3c9a42a26fe24049cc8a',
  site: baseUrl,
  tokenPath: '/oauth/token',
  authorizationPath: '/oauth/authorize'
});


function getAccounts() {
  return popsicle({
    method: 'GET',
    url: baseUrl + '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'authorization': 'Bearer ' + access_token
    }
  });
}

function getProjects(accountId) {
  return popsicle({
    method: 'GET',
    url: baseUrl + '/' + accountId + '/projects',
    headers: {
      'Content-Type': 'application/json',
      'authorization': 'Bearer ' + access_token
    }
  });
}

// Authorization uri definition
var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: 'http://localhost:9000/callback'
});

// Initial page redirecting to Github
app.get('/auth', function(req, res) {
  res.redirect(authorization_uri);
});

app.get('/api/projects', function(req, response) {

  getAccounts().then(function(res) {

    var accountId = JSON.parse(res.body)[0].id;

    getProjects(accountId).then(function(res){
      response.send(res.body).sendStatus(200);
    });

  }, function(res) {
    response.sendStatus(401);
  });
});

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', function(req, res) {
  var code = req.query.code;
  console.log('/callback');

  oauth2.authCode.getToken({
    code: code,
    redirect_uri: 'http://localhost:9000/callback'
  }, saveToken);

  function saveToken(error, result) {
    if (error) {
      console.log('Access Token Error', error.message);
    }
    access_token = oauth2.accessToken.create(result).token.access_token;
    res.redirect('/generator');
  }

});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.get('/generator', function(req, res) {
  res.sendFile(path.join(__dirname + '/views/generator.html'));
});

app.listen(9000);

console.log('Express server started on port 9000');
