//var config = require('./board.json');

var clipboard = require('clipboard')
var jira = require('./jira.js')
var transitions = require('./transition.js')
var board = null;

var getColumns = function(board) {
  var cols = board.columnsData.columns
  var colMap = {}
  cols.forEach(function (col) {
    col['issues'] = []
    colMap[col.name] = col
  })
  return colMap
}



var colTemplate = ' \
<li class="ghx-column"><h2>%s</h2></li>'

var getColumnViews = function() {
  var cols = getColumnsFromBoard()
  var colView = ""
  cols.forEach(function (col) {
    colView = colView + parse(colTemplate, col)
  })

  return colView
}




var getBoard = function(board) {
  var colMap = getColumns(board)

  board.issuesData.issues.forEach(function (issue) {
    if (preference["epic"] == null || preference["epic"] == '' ||
        (issue.epicField != undefined && (preference["epic"].split(',').indexOf(issue.epicField.text) >= 0))) {

      issue['selected'] = false
      colMap[issue.status.name].issues.push(issue)  
    }
    
  })

  return colMap
}

function parse(str) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    return str.replace(/%s/g, function() {
        return args[i++];
    });
}



var issueTemplate = ' \
  <div class="js-detailview ghx-issue js-issue ghx-has-avatar %s" data-issue-id="" data-issue-key="" role="listitem" tabindex="0" aria-label=""> \
    <div class="ghx-issue-content"> \
        <div class="ghx-issue-fields"><span class="ghx-type" title="Story"><img src="%s"></span> \
            <div class="ghx-key"><a href="" title="%s" tabindex="-1" class="js-key-link">%s</a></div> \
            <div class="ghx-summary" title=""><span class="ghx-inner">%s</span></div> \
        </div> \
        %s \
    </div> \
    %s\
    %s \
    <div class="ghx-flags"><span class="ghx-priority" title="Medium"><img src="%s"></span></div> \
    <div class="ghx-grabber ghx-grabber-transparent"></div> \
    <div class="ghx-move-count"><b></b></div> \
  </div> \
'

var epicTemplate = '<div class="ghx-highlighted-fields"><div class="ghx-highlighted-field"><span class="aui-label %s" title="" data-epickey="">%s</span></div></div>'

var  estimateStatisticTemplate = '<div class="ghx-end"> \
        <div class="ghx-corner"><span class="aui-badge" title="Story Points">%s</span></div> \
    </div>'

var avatarTemplate = '<div class="ghx-avatar"><img src="%s" class="ghx-avatar-img"></div>'

var getIssueView = function(issue) {
  var points = null
  if (issue.estimateStatistic != undefined) {
    if (issue.estimateStatistic.statFieldValue != undefined) {
      points = issue.estimateStatistic.statFieldValue.text
    }
  }

  return parse(issueTemplate, 
    issue.selected ? "ghx-selected" : "",
    issue.typeUrl,
    issue.key,
    issue.key,
    issue.summary,
    issue.hasOwnProperty('epicField') ? parse(epicTemplate, issue.epicField.epicColor, issue.epicField.text) : "",
    issue.hasOwnProperty('estimateStatistic') ? parse(estimateStatisticTemplate, (points == null || points == 'undefined') ? "" : points) : "",
    issue.hasOwnProperty('avatarUrl') ? parse(avatarTemplate, issue.avatarUrl) : "",
    issue.priorityUrl)
}


var getBoardView = function() {
  var boardView = ''



  for (var key in board) {
    if (key != null) {
      issues = board[key].issues
      boardView += '<li class="ghx-column" data-column-id="">'
      issues.forEach(function (issue) {
        boardView += getIssueView(issue)
      })
      boardView += '</li>'
    }
  }

  return boardView
}

var render = function() {
  var output = document.getElementById('ghx-columns')
  while (output.firstChild) {
      output.removeChild(output.firstChild);
  }
  output.innerHTML = getBoardView()

  var output = document.getElementById('ghx-column-headers')
  while (output.firstChild) {
      output.removeChild(output.firstChild);
  }
  output.innerHTML = getColumnViews();
}



var currentIssueX = 0
var currentIssueY = 0

var selectIssue = function(select) {
  var keys = [];
  for(var k in board) keys.push(k);

  var issues = (board[keys[currentIssueX]]).issues

  if (issues.length == 0) {
        currentIssueX = 0
        keys.forEach(function(k) {
          if ((board[keys[currentIssueX]]).issues.length > 0) {
            issues = (board[keys[currentIssueX]]).issues
          } else {
            currentIssueX = currentIssueX + 1
          }
        });
      }
  
  currentIssueY = Math.min(currentIssueY, issues.length - 1)
  issues[currentIssueY]['selected'] = select
}

var getColumnsFromBoard = function() {
  var keys = [];
  for(var k in board) keys.push(k);
  return keys;
}

document.addEventListener('keydown', function (evt) {
  var cols = getColumnsFromBoard().length - 1

  if (evt.keyCode >= 37 && evt.keyCode <= 40) {
      selectIssue(false)

      if (evt.keyCode == 37) {
        currentIssueX = Math.max(0, currentIssueX - 1)
      } else if (evt.keyCode == 38) {
        currentIssueY = Math.max(0, currentIssueY - 1)
      } else if (evt.keyCode == 39) {
        currentIssueX = Math.min(cols, currentIssueX + 1)
      } else if (evt.keyCode == 40) {
        currentIssueY = currentIssueY + 1
      }

      selectIssue(true)
       
    render()
  }
  else if (evt.keyCode == 27) {
    // on escape: exit
    ipc.send('abort')
  }
  else if (evt.ctrlKey && evt.keyCode == 13) {
    // on enter copy and exit
    copyItem()
    ipc.send('abort')
  }
  else if (evt.keyCode == 13) {
    // on enter copy and exit
    copyItemDescription()
    ipc.send('abort')
  }

})


var copyItem = function() {
  var keys = []
  for(var k in board) keys.push(k)

  var issues = (board[keys[currentIssueX]]).issues
  var issue = issues[currentIssueY]
  
  data = (issue.key + ' ')

  clipboard.writeText(data)

  if (issue.status.name != "In Progress") {
    moveToInProgress(issue.key)
  }
}

var copyItemDescription = function() {
  var keys = []
  for(var k in board) keys.push(k)

  var issues = (board[keys[currentIssueX]]).issues
  var issue = issues[currentIssueY]
  
  data = (issue.key + ' ' + issue.summary)

  clipboard.writeText(data)

  if (issue.status.name != "In Progress") {
    moveToInProgress(issue.key)
  }
}




var fetchBoard = function() {
  jiraCall(
    preference["board-url"],
    preference["login"],
    preference["password"],
    "GET",{})
    .then(JSON.parse)
    .then(function(response) {
      board = getBoard(response);
      render()
    }).catch(function(error) {
      console.log("Failed!", error);
    });
};


ipc.on('refresh-board', function () {
  fetchBoard()
})







