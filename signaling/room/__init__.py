from flask import Blueprint

room = Blueprint('room', __name__)

from . import routes, events