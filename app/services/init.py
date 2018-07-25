from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
import random
import logging

app = Flask(__name__)
CORS(app)
app.config.from_pyfile = "config.py"
app.secret_key = "super secret key"
basedir = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir,'user_images')
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
db = SQLAlchemy(app)
migrate = Migrate(app,db)
