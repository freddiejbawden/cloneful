from init import db, app
from flask import request,jsonify,render_template,abort,flash,Response
from werkzeug.utils import secure_filename
import random
from models import Room,Player
import json
import os

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

def clear_folders():
    folders = list(os.walk(app.config["UPLOAD_FOLDER"]))[1:]
    for folder in folders:
        if not folder[2]:
            os.rmdir(folder[0])

def generate_room_code():
    code = ""
    for i in range(4):
        r = random.randint(0,25)
        c = chr(65+r)
        code += c
    return code



@app.route("/")
def display_webpage():
    return render_template("index.html")

@app.route("/room/<string:room_id>",methods=["GET"])
def get_specific_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    return jsonify(room.serialize())


@app.route("/room",methods=["GET"])
def get_all_rooms():
    return jsonify(map(lambda x:x.serialize(),Room.query.all()))

@app.route("/room",methods=["PUT"])
def create_room():
    rc = generate_room_code()
    host = str(request.json["name"])
    gameState = 0
    data = [rc,host]
    new_room = Room(id=rc,host=host)
    new_player = Player(id=rc,name=host)
    print app.config['UPLOAD_FOLDER']
    folder_directory = os.path.join(app.config['UPLOAD_FOLDER'],rc)
    if not os.path.exists(rc):
        os.makedirs(folder_directory)
    db.session.add(new_player)
    db.session.add(new_room)
    db.session.commit()
    return jsonify(new_room.serialize())

@app.route("/player",methods=["GET"])
def get_player():
    return jsonify(map(lambda x:x.serialize(),Player.query.all()))

@app.route("/player/<string:room_id>",methods=["GET"])
def get_all_player_in_room(room_id):
    players = Player.query.filter_by(id=room_id).all()
    return jsonify(map(lambda x:x.serialize(),players))

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

@app.route("/player/submitimage", methods=["PUT"])
def add_image():
    player = request.json["name"]
    room = request.json["id"]
    Player.query.filter_by(id=room,name=player).update(dict(drawing=json.dumps(request.json["image"])))
    db.session.commit()
    return jsonify(request.json["image"])

@app.route("/room/<string:room_id>/players", methods=["GET"])
def num_players_in_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    if room == None:
        abort(404)
    return str(room.players)

@app.route("/room/<string:room_id>/players", methods=["PUT"])
def add_player_to_room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    add_one_player = str(int(room.players) + 1)
    Room.query.filter_by(id=room_id).update(dict(players=add_one_player))
    db.session.commit()
    return str(add_one_player)



@app.route("/gamecontroller/<string:room_id>",methods=["GET"])
def change_gamestate(room_id):
    room = str(room_id)
    target_room = Room.query.get_or_404(room)
    current_gamestate = target_room.gameState
    if current_gamestate == 0:
        current_gamestate = 1
    Room.query.filter_by(id=room).update(dict(id=current_gamestate))
    db.session.commit()
    return str(current_gamestate)




def allowed_files(filename):
    contains_extension = '.' in filename
    allowed_extension = filename.rsplit('.',1)[1].lower() == "jpg"
    return contains_extension and allowed_extension

@app.route("/submitguess", methods=["PUT"])
def submit_guess():
    room = request.json["room"]
    name = request.json["name"]
    guess = request.json["guess"]
    Player.query.filter_by(id=room,name=name).update(dict(guess=guess))
    db.session.commit()
    return "Done"

@app.route("/addscore",methods=["PUT"])
def add_score():
    room = request.json["room"]
    name = request.json["name"]
    score = request.json["score"]
    target_player_score = Player.query.filter_by(id=room,name=name).score+score
    Player.query.filter_by(id=room,name=name).update(dict(score=target_player_score))
if __name__ == "__main__":
    clear_folders()
    app.run(debug=True)
