from . import room
from .. import socketio
from uuid import uuid4
from flask import request, render_template, redirect, url_for, json


@room.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        room_id = request.args.get('room_id')
        if room_id is not None:
            return render_template('room/video-call.html', room_id=room_id)
        return render_template('room/index.html')
    elif request.method == 'POST':
        return render_template('room/index.html')


@room.route('/generate-room', methods=['POST'])
def generate_room():
    room_id = uuid4()
    return redirect(url_for('room.index', room_id=room_id))


