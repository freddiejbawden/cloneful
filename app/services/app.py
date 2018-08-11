from __future__ import print_function
from init import db, app
from flask import request,jsonify,render_template,abort,flash,Response
from werkzeug.utils import secure_filename
import random
from models import Room, Player, Prompt
import random
import json
import time
import sys
import os

# TODO: Unify bodies of PUT requests room_id should be same for every request
# TODO: Unify URLs for room_id, have passed in url not body

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

@app.route("/room/<string:room_id>/check_choices", methods=["GET"])
def check_everyone_chosen(room_id):
    room = room_id
    choices = filter(lambda x: len(x.choice) == 0, Player.query.filter_by(id=room_id).all())
    if len(choices) == 1:
        return jsonify(0)
    return jsonify(len(choices))

""" Returns "True" if 60 seconds has elapsed since the drawing session started
    Else returns time left before forced submission"""
@app.route("/gamecontroller/<string:room_id>/time")
def check_time(room_id):
    start_time = Room.query.filter_by(id=room_id).first().start_time
    current_time = int(time.time())
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
@app.route("/player/<string:room_id>/submitdrawing", methods=["PUT"])
def submit_drawing(room_id):
    room = str(room_id)
    name = request.json["name"]
    drawing = request.json["drawing"]
    Player.query.filter_by(id=room,name=name).update(dict(drawing=drawing))
    db.session.commit()
    return request.json["drawing"]


""" Return the name of the owner of the current picture """
@app.route("/room/<string:room_id>/imageowner", methods=["GET"])
def get_image_owner(room_id):
    viewing = Room.query.filter_by(id=room_id).first().viewing
    players = map(lambda x: x.name, Player.query.filter_by(id=room_id).all())
    return jsonify(players[viewing])

""" Return a picture and increment viewing or end flag """
@app.route("/room/<string:room_id>/image",methods=["GET"])
def get_next_image(room_id):
    images = map(lambda x: x.drawing, Player.query.filter_by(id=room_id).all())
    toReturn = Room.query.filter_by(id=room_id).first().viewing
    if toReturn >= len(images):
        return jsonify("End")
    else:
        Room.query.filter_by(id=room_id).update(dict(viewing=toReturn+1))
        return jsonify(images[toReturn])

""" Set the guess for player
    Takes body: name, guess """
@app.route("/player/<string:room_id>/guess",methods=["PUT"])
def submit_guess(room_id):
    print (request.json, file=sys.stderr)
    name = request.json["name"]
    guess = request.json["guess"]
    Player.query.filter_by(id=room_id,name=name).update(dict(guess=guess))
    db.session.commit()
    return jsonify(guess)


""" Get number of players who have not guessed """
@app.route("/player/<string:room_id>/check_guesses",methods=["GET"])
def get_num_guesses(room_id):
    guesses = filter(lambda x: x.guess == u'', Player.query.filter_by(id=room_id).all())
    if len(guesses) == 1:
        return jsonify(0)
    return jsonify(len(guesses))

""" Construction Zone """

""" Gets all guesses """
@app.route("/player/<string:room_id>/all_guesses", methods=["GET"])
def get_all_guesses(room_id):
     room = str(room_id)
     viewing = Room.query.filter_by(id=room).first().viewing
     prompt = Player.query.filter_by(id=room).all()[viewing].prompt
     images = map(lambda x:x.drawing, Player.query.filter_by(id=room).all())
     all_guesses = map(lambda x: {'name':x.name, 'guess':x.guess}, Player.query.filter_by(id=room).all())
     remove_empty = filter(lambda x: x["guess"] != u'', all_guesses)
     prompt_and_guesses = {'image':images[viewing], 'truth':prompt, 'guesses':remove_empty}
     return jsonify(prompt_and_guesses)

@app.route("/player/<string:room_id>/set_choice",methods=["PUT"])
def set_player_choice(room_id):
    room = str(room_id)
    choice = request.json["choice"]
    player = request.json["name"]
    new_player = Player.query.filter_by(id=room_id,name=player).update(dict(choice=choice))
    db.session.commit()
    return jsonify(new_player)

# TODO: Make sure two people in a room cannot get the same prompt
""" Returns prompt for player """
@app.route("/player/<string:room_id>/prompt", methods=["PUT"])
def get_all_prompts(room_id):
    name = request.json["name"]
    num_of_prompts = Prompt.query.count()
    rand_id = random.randint(0,num_of_prompts)
    prompt = Prompt.query.filter_by(id=rand_id).first().text
    print (num_of_prompts, file=sys.stderr)
    Player.query.filter_by(id=room_id,name=name).update(dict(prompt=prompt))
    db.session.commit()
    return jsonify(prompt)

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
