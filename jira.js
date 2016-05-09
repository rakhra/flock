var jiraCall = function(url, login, password, method, payload) {

  
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open(method, url);
    req.setRequestHeader("cache-control", "no-cache");
    req.setRequestHeader("Authorization", "Basic " + btoa(login + ":" + password));

    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response);
      }
      else {
        reject(req.statusText);
      }
    };

    req.onerror = function() {
      reject(Error("Network Error"));
    };

    if (method == 'GET') {
      req.send();
    }
    else if (method == 'POST' || method == 'PUT') {
      req.setRequestHeader("Content-Type", "application/json");
      //req.send(JSON.stringify(payload));
      jirapost(url, login, password, payload)
    }
  });
}


var request = require('request');

var jirapost = function(url, login, password, payload) {
  request({
      url: url,
      method: "POST",
      json: true,   // <--Very important!!!
      body: payload,
      headers : {'Authorization' : 'Basic ' + btoa(login + ':' + password),
                 'cache-control' : 'no-cache'}
  }, function (error, response, body){
    console.log("state changed");
      console.log(response);
  });
}