#app/models.py
from init import db
from sqlalchemy.dialects.postgresql import JSON

class Room(db.Model):
    # Columns
    id = db.Column(db.String(4), primary_key=True)
    host = db.Column(db.String(16))
    players = db.Column(db.Integer,default=1)
    gameState = db.Column(db.Integer,default=0)
    start_time = db.Column(db.Integer,default=0)
    viewing = db.Column(db.Integer,default=0)
    usedPrompts = db.Column(db.Text,default="")
    scoresUpdated = db.Column(db.Integer,default=0)
    def serialize(self):
        return {
            'id':self.id,
            'host':self.host,
            'players':self.players,
            'gameState':self.gameState,
            'start_time':self.start_time,
            'viewing':self.viewing
        }
class Player(db.Model):
    id = db.Column(db.String(4), primary_key=True)
    name = db.Column(db.String(16),primary_key=True)
    score = db.Column(db.Integer,default=0)
    guess =db.Column(db.String(64),default="")
    choice = db.Column(db.String(64),default="")
    prompt = db.Column(db.String(256))
    drawing = db.Column(db.Text,default="")
    def serialize(self):
        return {
            'id': self.id,
            'name':self.name,
            'score':self.score,
            'guess':self.guess,
            'drawing':self.drawing,
            'choice' : self.choice,
            'prompt': self.prompt
        }

class Prompt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(256))
    def serialize(self):
        return {'text':self.text}
