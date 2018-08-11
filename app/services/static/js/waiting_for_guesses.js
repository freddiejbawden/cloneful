$(document).ready(function() {

  function change_gamestate(room_code) {
    url = "http://127.0.0.1:5000/gamecontroller/" + room_code + "/change"
    console.log("change game")
    fetch(url).then(function(response) {
        sessionStorage.setItem("page","choose")
        location.reload(true)
    }).catch(function(err) {
      console.log("Update Game ERROR: " + err)
    });
  }

  function check_guesses() {
    room_id = sessionStorage.getItem("id")
    url = "http://127.0.0.1:5000/player/" + room_id + "/check_guesses"
    fetch(url).then(function(response) {

      response.json().then(function(data) {
        console.log(data)
        if (data == "0") {
          // everyone has guessed, time to display answers and scores
          change_gamestate(room_id)

        } else {
          // cycle clock
        }
      })
    }).catch(function(err) {
      console.log(err)
    })
  }
  var intervalId = window.setInterval(check_guesses, 2000)
})
