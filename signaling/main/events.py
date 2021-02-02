from flask import session, request
from flask_socketio import join_room, leave_room, emit
from .. import socketio
from collections import defaultdict


@socketio.on('connect', namespace="/")
def connect():
    username = session.get('username')
    room = session.get('roomId')
    sid = request.sid
    print(sid)
    print("Connected ", username, room)
    join_room(room)
    emit('ready', {'msg': username + ' has entered the room.'}, to=room, broadcast=True, include_self=False)


@socketio.on('disconnect', namespace="/")
def disconnect():
    username = session.get('username')
    room = session.get('roomId')
    print("Disconnect ", username, room)
    leave_room(room)
    print(session.get('username'))
    session.pop('username')
    print(session.get('username'))
    emit('disconnect', {'msg': username + ' has leave the room.'}, to=room, broadcast=True, include_self=False)


@socketio.on('data', namespace="/")
def data(data):
    print('Message from {}: {}', data)
    room = session.get('roomId')
    emit('data', data, to=room, broadcast=True, include_self=False)
