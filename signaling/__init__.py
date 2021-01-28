from flask import Flask, redirect, url_for
from flask_socketio import SocketIO

socketio = SocketIO()

from .room import room
from .user import user
from .api import api


def create_app(debug=False):
    app = Flask(__name__)
    app.debug = debug
    app.secret_key = '32db3563-93dc-4d70-8063-82e8065a8647'

    # register blueprint
    app.register_blueprint(room, url_prefix='/room')
    app.register_blueprint(user, url_prefix='/user')
    app.register_blueprint(api, url_prefix='/api_v1')

    @app.route('/', methods=['GET'])
    def index():
        return redirect(url_for('room.index'))

    socketio.init_app(app)
    return app
