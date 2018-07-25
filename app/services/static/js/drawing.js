console.log("loaded")
var c = {}
$(document).ready(function() {
    context = document.getElementById('canvas').getContext("2d");
    var clickX = new Array();
    var clickY = new Array();
    var clickDrag = new Array();
    var paint;

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
    function to_json(x,y,d) {
      var z = x.map(function(e,i) {
        return [e, y[i], d[i]];
      });
      return JSON.stringify(z)
    }
    $("#clearcanvas").click(function() {
      clickX = new Array();
      clickY = new Array();
      clickDrag = new Array();
      context.clearRect(0,0,context.canvas.width,context.canvas.height);
    })
    $("#exportcanvas").click(function() {
      j = to_json(clickX,clickY,clickDrag)
      console.log(JSON.parse(j))
      xhttp = new XMLHttpRequest()
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          //finished request
        }
      }
      xhttp.open("PUT","http://127.0.0.1:5000/player/submitguess",true);
      xhttp.setRequestHeader("Content-Type","application/json");
      n = sessionStorage.getItem("name");
      room_id = sessionStorage.getItem("id");
      xhttp.send(JSON.stringify({name:n,id:room_id,guess:j}));
    });
    
});
