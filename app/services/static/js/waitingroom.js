$(document).ready(function() {
  room_code = sessionStorage.getItem("id")
  console.log(room_code)
  room_code_header = document.getElementById("room")
  room_code_header.innerHTML = "Room Code: " + room_code
  var intervalId = window.setInterval(checkforchange,2000);
  display_player_names()
});
function display_player_names() {
  url = "http://127.0.0.1:5000/player/" + room_code
  fetch(url).then(function(response) {
      console.log(response.status);
      response.json().then(function(data) {
        console.log(data)
        user_name = sessionStorage.getItem("name")
        sessionStorage.setItem("numberOfPlayers",(data.length).toString())
        data.forEach(function(element) {
          li = document.createElement("li")
          li.innerHTML = element["name"]
          console.log(element["name"] === user_name)
          if (element["name"] == user_name) {
            li.setAttribute("style","background-color: aqua;")
          }
          $("#players").append(li)

        });
        startGameButton(room_code)
      });
    }
  ).catch(function(err) {
    console.log(err);
  });
}

function updateGame(room_code) {
  url = "http://127.0.0.1:5000/gamecontroller/" + room_code + "/change"

  fetch(url).then(function(response) {
    response.json().then(function(data) {
      console.log(data)
      addToHistory()
      sessionStorage.setItem("page","drawing")
      location.reload(true)
    })
  }).catch(function(err) {
    console.log("Update Game ERROR: " + err)
  });
}
function startGameButton(room_code) {
  url = "http://127.0.0.1:5000/room/" + room_code
  fetch(url).then(function(response) {
    response.json().then(function(data) {
        user_name = sessionStorage.getItem("name")
        buttonContainer = document.getElementById("host_info")
        if (data["host"] == user_name) {
          button = document.createElement("div")
          button.setAttribute("id","startButton")
          button.setAttribute("class","startbutton")
          button.innerHTML = "Start Game"
          $('#host_info').append(button)
          $("#startButton").click(function() {
              updateGame(room_code)

          });
        } else {
          span = document.createElement("span")
          span.setAttribute("class","wait_text")
          span.innerHTML = "Waiting for host to start game..."
          buttonContainer.append(span)
        }
    });
  }).catch(function(err) {
    console.log(err);
  });
}

function checkforchange() {
  room_code = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/player/" + room_code

  fetch(url).then(function(response) {
      if (response.status !== 200) {
        console.log(response.status);
        return;
      }
      response.json().then(function(data) {
        num_players = sessionStorage.getItem("numberOfPlayers")
        if (num_players === null) {
          num_players = data
        }
        console.log(data.length)
        if (parseInt(data.length) > parseInt(num_players)) {
          console.log("redraw")
          $('#players').empty()
          num_players = sessionStorage.setItem("numberOfPlayers",data.length.toString())
          data.forEach(function(element) {
            li = document.createElement("li")
            li.innerHTML = element["name"]
            console.log(element["name"] === user_name)
            if (element["name"] == user_name) {
              li.setAttribute("style","background-color: aqua;")
            }
            $("#players").append(li)
          });
        }
        checkforstart(room_code)
      });
  }).catch(function(err) {
    console.log(err);
  });
}

function checkforstart(room_code) {
  url = "http://127.0.0.1:5000/room/" + room_code

  fetch(url).then(function(response) {
    response.json().then(function(data) {
      console.log(data)
      if (data["gameState"] === 1) {
        //game has been started
        addToHistory()
        sessionStorage.setItem("page","drawing")
        location.reload(true)
      }
    })
  }).catch(function(err) {
    console.log(err)
  })



}
