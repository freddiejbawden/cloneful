function draw(clickX,clickY,clickDrag) {
  context = document.getElementById('canvas').getContext("2d");

  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  for(var i=0; i < clickX.length; i++) {
    context.beginPath();
    if(clickDrag[i] && i) {
      context.moveTo(clickX[i-1], clickY[i-1]);
     } else {
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
  // wait for guesses to be done
}



function submit_guess() {
  console.log("guess")
  room_id = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/player/" + room_id + "/guess"
  n = sessionStorage.getItem("name");
  console.log($('#guess_input').val())
  data = JSON.stringify({ name:n,
                          guess: $('#guess_input').val()
                        })
  fetch(url,
    {
      headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      },
      method: "PUT",
      body: data
    }
  ).then(function(response) {
    response.json().then(function(data) {
      console.log("Submitted Guess")
    })
  }).catch(function(err) {
      console.log(err)
  })
}

function get_image() {
  console.log("image")
  room_id = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/room/" + room_id + "/image"
  fetch(url).then(function(response) {
    response.json().then(function(data) {
        if (data == "End") {
          // TODO: Change game state to final scores and reload
        }
        parsed_data = JSON.parse(data)
        clickX = parsed_data.map(x => x[0])
        clickY = parsed_data.map(x => x[1])
        clickDrag = parsed_data.map(x => x[2])
        console.log("run")
        draw(clickX,clickY,clickDrag)
    })
  }).catch(function(err) {
    console.log(err)
  })
}

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
  var check_guesses = window.setInterval(check_guesses,1000)

  $('#guess').click(function() {
    submit_guess()
  })
  // check if the image served is the clients

  get_image()
})
