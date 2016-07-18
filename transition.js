var inProgressTransitionPayload = { 'transition': { 'id' : null } }

var getTransitionUrl = function(url, issueId) {
  var baseUrl = url.split("rest")[0]
  return baseUrl + "rest/api/2/issue/" + issueId + "/transitions"
}

var fetchTransitions = function(issueId) {
  return new Promise(function(resolve, reject) {
    if (inProgressTransitionPayload.transition.id == null) {
      jiraCall(
        getTransitionUrl(preference["board-url"], issueId),
        preference["login"],
        preference["password"],
        "GET",
        {})
        .then(JSON.parse)
        .then(function(response) {
          response.transitions.forEach(function (t) {
            if (t.name == preference['target-state']) {
              inProgressTransitionPayload.transition.id = t.id;
            }
          })
          
          resolve(true)

        }).catch(function(error) {
          console.log("Failed!", error);
          reject(error)
        });
    }
    else {
      resolve(true)
    }
  })
};


var moveToInProgress = function(issueId) {
  fetchTransitions(issueId)
  .then(function() {
    jiraCall(
      getTransitionUrl(preference["board-url"], issueId),
      preference["login"],
      preference["password"],
      'POST',
      inProgressTransitionPayload)
  })
  .catch(function(error) {
    console.log("Failed!", error);
  });
};





