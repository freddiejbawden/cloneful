function create_game() {
    input_name = document.getElementById("name").value
    sessionStorage.setItem('name', input_name);
    var xhttp = new  XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        //change page
        alert(xhttp.responseText)
        resp = JSON.parse(xhttp.responseText);
        sessionStorage.setItem("id", resp["id"]);
        console.log("LS ID:" + sessionStorage.getItem("id"));
        sessionStorage.setItem("page","waiting_room")
        location.reload(true)
      }
    }
    xhttp.open("PUT","http://127.0.0.1:5000/room",true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({name:input_name}));

}
function join_game() {
  console.log("pressed")
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      //console.log(xhttp.response)
      resp = JSON.parse(xhttp.responseText)
      sessionStorage.setItem("id",resp["id"]);
      sessionStorage.setItem("name",resp["name"]);
      sessionStorage.setItem("page","waiting_room");
      increase_player_number(resp["id"])
    }
  }
  input_name = document.getElementById("name").value
  room_code = document.getElementById("room").value
  if (room_code === undefined) {
    console.log("Room code from input is undefined!")
    return
  }
  xhttp.open("PUT","http://127.0.0.1:5000/player",true);
  xhttp.setRequestHeader("Content-Type","application/json")
  console.log("Sending")
  xhttp.send(JSON.stringify({name:input_name,room:room_code}))
}

function increase_player_number(room_id) {
  xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      location.reload(true)
    }
  }
  xhttp.open("PUT","http://127.0.0.1:5000/room/" + room_id + "/players",true)
  xhttp.send()
}
function addToHistory() {
  h = sessionStorage.getItem("h");
  if (h == null) {
    pages = [sessionStorage.getItem("page")];
    sessionStorage.setItem("h",JSON.stringify(pages));
  } else {
    pages = JSON.parse(h)
    pages.push(sessionStorage.getItem("page"))
    sessionStorage.setItem("h",JSON.stringify(pages))
  }
}


$(document).ready(function() {
  // Loading in pages
  $('#back').click(function() {
    h = sessionStorage.getItem("h");
    if (h != null) {
      pages = JSON.parse(h);
      sessionStorage.setItem("page",pages.pop())
      sessionStorage.setItem("h",JSON.stringify(pages))
      console.log(sessionStorage.getItem("page"))
      location.reload(true)
    }
  });
  //check if room is still active
    // if it is then display page
  // else return to home, fill in box with name
  if (sessionStorage.getItem("page") == null) {
    sessionStorage.setItem("page", "index")
  }
  lastRoom = sessionStorage.getItem("id")
  page = sessionStorage.getItem("page")

  if (page == "create_game") {
      $('#y').load("/static/js/creategamecontent.html", function() {
          $('#creategame').click(function() {
            alert("start room")
              addToHistory()
            create_game()

          })
      });
  } else if (page == "join_game") {
    $("#y").load("/static/js/joingamecontent.html", function() {
      $("#joingame").click(function() {
        addToHistory()
        join_game()
      });
    });
  } else if (page == "waiting_room") {
    $("#y").load("/static/js/waitingroomcontent.html");
  } else if (page == "drawing") {
    $('#y').load("/static/js/drawingcontent.html")
  } else if (page == "guess") {
    $('#y').load("/static/js/guesscontent.html")
  } else {
    $('#y').load("/static/js/indexcontent.html", function() {
      $("#creategame").click(function() {
        addToHistory()
        sessionStorage.setItem("page","create_game")
        location.reload(true)
      });
      $("#joingame").click(function() {
          addToHistory()
          sessionStorage.setItem("page","join_game");
          location.reload(true);
      });
    });
  }
});
