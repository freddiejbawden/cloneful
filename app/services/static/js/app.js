
function create_game() {
  input_name = document.getElementById("name").value
  sessionStorage.setItem('name', input_name);
  url = "http://127.0.0.1:5000/room"
  fetch(url, {
    method: "PUT",
    body: JSON.stringify({name:input_name}),
    headers : {
      'Content-Type' : 'application/json'
    }
  }).then(function(response) {
    response.json().then(function(data) {
      sessionStorage.setItem("id", data["id"]);
      sessionStorage.setItem("page","waiting_room")
      location.reload(true)
    })
  })
}
function join_game() {
  room_code = document.getElementById("room").value
  input_name = document.getElementById("name").value
  if (room_code === undefined) {
    console.log("Room code from input is undefined!")
    return
  }
  put_data = JSON.stringify({name:input_name,room:room_code})
  console.log(put_data)
  url = "http://127.0.0.1:5000/player"
  fetch(url,
    {
      method: "PUT",
      body: put_data,
      headers : {
        "Content-Type" : "application/json"
      }
    }
  ).then(function(response) {
    sessionStorage.setItem("id",room_code);
    sessionStorage.setItem("name",input_name);
    sessionStorage.setItem("page","waiting_room");
    increase_player_number(room_code)
  })
}
function increase_player_number(room_id) {
  url = "http://127.0.0.1:5000/room/" + room_id + "/players"
  fetch(url).then(function(response) {
    location.reload(true)
  }).catch(function(err) {
    console.log(err)
  })
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

// TODO: move this somewhere more appropraite
function check_owner() {
  room_id = sessionStorage.getItem("id")
  if (room_id == "") {
    return ""
  }
  url = "http://127.0.0.1:5000/room/" + room_id + "/imageowner"
  fetch(url).then(function(response) {
    response.json().then(function(data) {
      stored_name = sessionStorage.getItem("name")
      is_owner = (stored_name != (data)) ? "load_image" : "wait"
      console.log("wait")
      if (is_owner == "load_image") {
        $('#y').load("./static/html/submitguesscontent.html")
      } else {
        $('#y').load("./static/html/waitforguesscontent.html")
      }
    })
  })

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


  // Serve page
  if (page == "create_game") {
      $('#y').load("./static/html/creategamecontent.html", function() {
          $('#creategame').click(function() {
            alert("start room")
              addToHistory()
            create_game()

          })
      });
  } else if (page == "join_game") {
    $("#y").load("./static/html/joingamecontent.html", function() {
      $("#joingame").click(function() {
        addToHistory()
        join_game()
      });
    });
  } else if (page == "waiting_room") {
    $("#y").load("./static/html/waitingroomcontent.html");
  } else if (page == "drawing") {
    $('#y').load("./static/html/drawingcontent.html")
  } else if (page == "guess") {
    is_owner =  check_owner()

  } else if (page == "choose") {
    $('#y').load("./static/html/choosecontent.html")
  } else {
    $('#y').load("./static/html/indexcontent.html", function() {
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
