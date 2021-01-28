from .. import socketio
from flask_socketio import join_room, leave_room, emit
import json


@socketio.on('connect')
async def io_connect():
    print('connecting')
    username = 'username' #data['username']
    room = 'room' #data['room']
    print("Connected ", username, room)
    await emit('ready')
    join_room(room)


@socketio.on('disconnect')
def io_disconnect():
    username = 'username'  # data['username']
    room = 'room'  # data['room']
    print("Disconnect ", username, room)
    leave_room(room)


@socketio.on('data')
async def io_data(data):
    print('Message from {}: {}', data)
    await emit('data', data, room=data['room'])


@socketio.on_error_default  # handles all namespaces without an explicit error handler
def default_error_handler(e):
    print(json.dumps(e))