function draw(clickX,clickY,clickDrag) {
  context = document.getElementById('canvas').getContext("2d");

  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  for(var i=0; i < clickX.length; i++) {
    context.beginPath();
    if(clickDrag[i] && i){
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
  room_id = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/player/" + room_id + "/guess"
  n = sessionStorage.getItem("name");
  data = JSON.stringify({name:n,guess:$('#guess_input').val()})
  fetch(url,
    method: "PUT"
    body: data
  ).then(function(response) {
    response.json().then(function(data) {
      console.log("Submitted Guess")
    })
  }).catch(function(err) {
      console.log(err)
  })
}

function check_guesses() {
  room_id = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/player/" + room_id + "/check_guesses"
  fetch(url).then(function(response) {
    response.json().then(function(data) {
      if data == "0" {
        // everyone has guessed, time to display
      } else {
        // cycle clock
      }
    })
  }).catch(function(err) {
    console.log(err)
  })
}

function get_image() {
  room_id = sessionStorage.getItem("id")
  url = "http://127.0.0.1:5000/room/" + room_id + "/image"
  fetch(url).then(function(response) {
    response.json().then(function(data) {
        clickX = data.map(x => x[0])
        clickY = data.map(x => x[1])
        clickDrag = data.map(x => x[2])
        draw(clickX,clickY,clickDrag)
    })
  }).catch(function(err) {
    console.log(err)
  })
}
$(document).ready(function {

})
