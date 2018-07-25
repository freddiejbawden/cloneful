$(document).ready(function() {
  room_code = sessionStorage.getItem("id")
  console.log(room_code)
  room_code_header = document.getElementById("room")
  room_code_header.innerHTML = "Room Code: " + room_code
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
});

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
          $("#startButton").click(function() {
              addToHistory()
              session.setItem("page","drawing")
              location.reload(true)
          });
          $('#host_info').append(button)
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

function checkfornewplayers() {
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
      });
  }).catch(function(err) {
    console.log(err);
  });
}
var intervalId = window.setInterval(checkfornewplayers,2000);
