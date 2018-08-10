var c = {}

$(document).ready(function() {
    context = document.getElementById('canvas').getContext("2d");
    var clickX = new Array();
    var clickY = new Array();
    var clickDrag = new Array();
    var paint;

    function check_for_submissions() {
      room = sessionStorage.getItem("id")
      url = "http://127.0.0.1:5000/room/" + room + "/check_subs"
      fetch(url).then(function(response) {
        response.json().then(function(data) {
          console.log(data)
          if (data == "0") {
            change_gamestate(room_id)
          } else {
            get_time(room)
          }
        })
      }).catch(function(err) {
        console.log(err)
      })
    }

    function get_time(room) {
      url = "http://127.0.0.1:5000/gamecontroller/" + room + "/time"
      fetch(url).then(function(response) {
        response.json().then(function(data) {

          if (data == "True") {
            //timer is up
            submitImage_end()
          } else {
            //timer is still going
            time = parseInt(data)
            //set width the percentage of timer left
            $('#timer').width((parseInt(100-(time/60)*100).toString() + "%"))

          }
        })
      })
    }

    function to_json(x,y,d) {
      var z = x.map(function(e,i) {
        return [e, y[i], d[i]];
      });
      return JSON.stringify(z)
    }

    function submit_drawing(end_flag) {
      j = to_json(clickX,clickY,clickDrag)
      room_id = sessionStorage.getItem("id")
      n = sessionStorage.getItem("name")
      url = "http://127.0.0.1:5000/player/" + room_id + "/submitdrawing"
      fetch(url,
          {
            method: "PUT",
            body: JSON.stringify({name:n,drawing:j}),
            headers : {
              "Content-Type" : "application/json"
            }
        }).then(function(response) {
            if (end_flag) {
              change_gamestate(room_id)
            }
          });
      }
    function change_gamestate(room_code) {
      url = "http://127.0.0.1:5000/gamecontroller/" + room_code + "/change"

      fetch(url).then(function(response) {
        response.json().then(function(data) {
          sessionStorage.setItem("page","guess")
          location.reload(true)
        })
      }).catch(function(err) {
        console.log("Update Game ERROR: " + err)
      });
    }

    function start_timer() {
      room = sessionStorage.getItem("id")
      url = "http://127.0.0.1:5000/gamecontroller/" + room + "/start_timer"
      fetch(url).then(function(response) {
        var intervalId = window.setInterval(check_for_submissions, 1000)
      }).catch(function(err) {
        console.log(err)
      })
    }

    function get_prompt() {
      room = sessionStorage.getItem("id")
      name = sessionStorage.getItem("name")
      url = "http://127.0.0.1:5000/player/" + room + "/prompt"
      fetch(url,
        {
          headers : {
            "Accept" : "application/json",
            "Content-Type" : "application/json"
          },
          method: "PUT",
          body: JSON.stringify({'name': name})
        }
      ).then(function(response) {
        response.json().then(function(data) {
          console.log(data)
          $('#prompt_text').text(data)
          start_timer()
        })
      }).catch(function(err) {
        console.log(err)
      })
    }

    $('#canvas').mousedown(function(e) {
      console.log("mouse down")
      var mouseX = e.pageX - this.offsetLeft
      var mouseY = e.pageY - this.offsetTop
      paint = true;
      addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop,false)
      redraw();
    });
    $('#canvas').mousemove(function(e) {
      if (paint) {
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop,true);
        redraw();
      }
    });
    $('#canvas').mouseup(function(e) {
      paint = false;
    })
    $('#canvas').mouseleave(function(e){
      paint = false;
    });

    function addClick(x,y, dragging) {
      clickX.push(x);
      clickY.push(y);
      clickDrag.push(dragging);
    }
    function redraw(){
      context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

      context.strokeStyle = "#df4b26";
      context.lineJoin = "round";
      context.lineWidth = 5;

      for(var i=0; i < clickX.length; i++) {
        context.beginPath();
        if(clickDrag[i] && i){
          context.moveTo(clickX[i-1], clickY[i-1]);
         }else{
           context.moveTo(clickX[i]-1, clickY[i]);
         }
         context.lineTo(clickX[i], clickY[i]);
         context.closePath();
         context.stroke();
      }
    }

    $("#clearcanvas").click(function() {
      clickX = new Array();
      clickY = new Array();
      clickDrag = new Array();
      context.clearRect(0,0,context.canvas.width,context.canvas.height);
    })
    $("#exportcanvas").click(function() {
      submit_drawing()
    });
    get_prompt()


});
