from flask import session
from flask_socketio import join_room, leave_room, emit
from .. import socketio

username = 'username'


@socketio.on('connect', namespace="/")
def connect():
    room = session.get('roomId')
    print("Connected ", username, room)
    join_room(room)
    emit('status', {'msg': username + ' has entered the room.'}, room=room)


@socketio.on('disconnect', namespace="/")
def disconnect():
    room = session.get('roomId')
    print("Disconnect ", username, room)
    leave_room(room)


@socketio.on('data', namespace="/")
def data(data):
    print('Message from {}: {}', data)
    room = session.get('roomId')
    emit('data', data, room=room)
