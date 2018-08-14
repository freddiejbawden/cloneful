

$(document).ready(function() {
  function getscores() {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/room/" + room_id + "/scores"
    fetch(url).then(function(response) {
      response.json().then(function(data) {
        show_scores(data)
      })
    }).catch(function(err) {
      alert(err)
    })
  }
  function show_scores(data) {
    data.forEach(function(element) {
      $("#scores").append(create_score_card(element))
    })
    if (sessionStorage.getItem("host") != "true") {
      var caller = window.setInterval(check_for_next_round,2000)
    } else {
      cont_button = document.createElement("div")
      $(cont_button).text = "Next Round"
      $(cont_button).addClass("continue")
      $(cont_button).click(function() {
        continue_button()
      })
      $('#y').append(cont_button)
    }
    // start listener for next round start
  }

  function check_if_scores_updated(c) {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/room/" + room_id + "/check_scored"
    fetch(url).then(function(response) {
      response.json().then(function(data) {
        if (data == 1) {
          window.clearInterval(c)
          getscores()
        }
      })
    })
  }

  function create_score_card(element) {
    name = element["name"]
    score = element["score"]
    card = document.createElement("span")
    card.setAttribute("class","score-card")
    name_div = document.createElement("span")
    score_div = document.createElement("span")
    $(name_div).html(name)
    $(score_div).html(score)
    $(card).append(name_div)
    $(card).append(score_div)
    return card
  }

  function trigger_eval() {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/room/" + room_id + "/finishRound"
    fetch(url).then(function(response) {
      response.json().then(function(data) {
        show_scores(data)
      })

    }).catch(function(err) {
        alert(err)
      })
  }
  function continue_button() {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/gamecontroller/" + room_id + "/next"
    fetch(url).then(function(response){
      response.json().then(function(data) {
        sessionStorage.setItem("page","guess")
        location.reload(true)
      })
    })
  }
  function check_for_next_round() {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/gamecontroller/" + room_id + "/state"
    fetch(url).then(function(response) {
      response.json().then(function(data) {
        if (data == "2") {
          sessionStorage.setItem("page","guess")
          location.reload(true)
        }
      })
    })
  }
  if (sessionStorage.getItem("host") == "true") {
    trigger_eval()
  } else {
    var caller;
    caller = window.setInterval(function() {check_if_scores_updated(caller)},1000)
  }
})
