from __future__ import print_function
from init import db, app
from flask import request,jsonify,render_template,abort,flash,Response
from werkzeug.utils import secure_filename
import random
from models import Room, Player, Prompt
import json
import time
import sys
import os

# TODO: Unify bodies of PUT requests room_id should be same for every request

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT'
        headers = request.headers.get('Access-Control-Request-Headers')
        if headers:
            response.headers['Access-Control-Allow-Headers'] = headers
    return response
app.after_request(add_cors_headers)
db.create_all()

""" Creates a 4 upper case room code """
def generate_room_code():
    code = ""
    for i in range(4):
        r = random.randint(0,25)
        c = chr(65+r)
        code += c
    return code

# TODO: Move to init file
""" adds prompts from /static/prompts/prompts.csv to table"""
def add_prompts_from_file():
    filename = os.path.join("static","prompts","prompts.csv")
    file = open(filename,"r")
    for line in file:
        new_prompt = Prompt(text=str(line))
        db.session.add(new_prompt)
    db.session.commit()
add_prompts_from_file()


""" Start of Routes """

""" Display base template """
@app.route("/")
def display_webpage():
    return render_template("index.html")

""" Return <room_id> from table """
@app.route("/room/<string:room_id>",methods=["GET"])
def get_specific_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    return jsonify(room.serialize())

""" Return all rooms """
@app.route("/room",methods=["GET"])
def get_all_rooms():
    return jsonify(map(lambda x:x.serialize(),Room.query.all()))

# TODO: Clear old file creation stuff
""" Creates a room
    Takes body: name """
@app.route("/room",methods=["PUT"])
def create_room():
    rc = generate_room_code()
    host = str(request.json["name"])
    gameState = 0
    data = [rc,host]
    new_room = Room(id=rc,host=host)
    new_player = Player(id=rc,name=host)
    folder_directory = os.path.join(app.config['UPLOAD_FOLDER'],rc)
    if not os.path.exists(rc):
        os.makedirs(folder_directory)
    db.session.add(new_player)
    db.session.add(new_room)
    db.session.commit()
    return jsonify(new_room.serialize())

""" Return list of all players """
@app.route("/player",methods=["GET"])
def get_player():
    return jsonify(map(lambda x:x.serialize(),Player.query.all()))

""" Returns all players in <room_id> """
@app.route("/player/<string:room_id>",methods=["GET"])
def get_all_player_in_room(room_id):
    players = Player.query.filter_by(id=room_id).all()
    return jsonify(map(lambda x:x.serialize(),players))


""" Adds a new player
    Takes body: name, room """
@app.route("/player",methods=["PUT"])
def add_player():
    room = str(request.json["room"])
    name = str(request.json["name"])
    target_room = Room.query.get_or_404(room)
    if target_room is None:
        abort(400)
    if target_room.gameState != 0:
        abort(400)
    num_players_in_room = Player.query.filter_by(id=room).count()
    if num_players_in_room >= 8:
        abort(400)
    check_not_in_room = Player.query.filter_by(id=room,name=name)
    if not check_not_in_room:
        abort(400)
    new_player = Player(id=room,name=name)
    db.session.add(new_player)
    db.session.commit()
    return jsonify(new_player.serialize())


""" Adds a players image to the table
    body: id,name,image """
@app.route("/player/submitimage", methods=["PUT"])
def add_image():
    player = request.json["name"]
    room = request.json["id"]
    Player.query.filter_by(id=room,name=player).update(dict(drawing=json.dumps(request.json["image"])))
    db.session.commit()
    return jsonify(request.json["image"])

# TODO: clean up (may be from old set up)
@app.route("/room/<string:room_id>/players", methods=["GET"])
def num_players_in_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    if room == None:
        abort(404)
    return str(room.players)

# TODO: clean up (may be from old set up)
@app.route("/room/<string:room_id>/players", methods=["PUT"])
def add_player_to_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    add_one_player = str(int(room.players) + 1)
    Room.query.filter_by(id=room_id).update(dict(players=add_one_player))
    db.session.commit()
    return str(add_one_player)

""" Returns number of players who have submitted an image """
@app.route("/room/<string:room_id>/check_subs",methods=["GET"])
def check_everyone_submitted(room_id):
    submissions = filter(lambda x: x.drawing == u'', Player.query.filter_by(id=room_id).all())
    if submissions == None:
        return jsonify(0)
    return jsonify(len(submissions))


""" Returns "True" if 60 seconds has elapsed since the drawing session started
    Else returns time left before forced submission"""
@app.route("/gamecontroller/<string:room_id>/time")
def check_time(room_id):
    start_time = Room.query.filter_by(id=room_id).first().start_time
    current_time = int(time.time())
    print (start_time, current_time, file=sys.stderr)
    if (start_time + 60 < current_time):
        return jsonify("True")
    else:
        return jsonify(str(current_time - start_time))

""" Starts the timer for <room_id> """
@app.route("/gamecontroller/<string:room_id>/start_timer")
def start_time(room_id):
    cur_time = int(time.time())
    Room.query.filter_by(id=room_id).update(dict(start_time=cur_time))
    db.session.commit()
    return jsonify(cur_time)


""" Changes the game state to signal clients to change mode """
@app.route("/gamecontroller/<string:room_id>/change",methods=["GET"])
def change_gamestate(room_id):
    room = str(room_id)
    target_room = Room.query.get_or_404(room)
    current_gamestate = target_room.gameState
    current_gamestate += 1
    Room.query.filter_by(id=room).update(dict(gameState=current_gamestate))
    db.session.commit()
    return str(current_gamestate)

""" Sets the drawing for player
    Takes body: room, name, guess """
@app.route("/player/submitguess", methods=["PUT"])
def submit_guess():
    room = request.json["room"]
    name = request.json["name"]
    guess = request.json["guess"]
    Player.query.filter_by(id=room,name=name).update(dict(drawing=guess))
    db.session.commit()
    return request.json["guess"]

""" Construction Zone """

""" Returns prompt for player """
@app.route("/prompt/<string:room_id>", methods=["GET"])
def get_all_prompts(room_id):
    prompts = Room.query.filter_by(id=room_id).usedPrompts

""" Adds score """
@app.route("/addscore",methods=["PUT"])
def add_score():
    room = request.json["room"]
    name = request.json["name"]
    score = request.json["score"]
    target_player_score = Player.query.filter_by(id=room,name=name).score+score
    Player.query.filter_by(id=room,name=name).update(dict(score=target_player_score))
if __name__ == "__main__":
    app.run(debug=True)
