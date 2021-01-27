from .. import socketio
from flask_socketio import join_room, leave_room, emit


@socketio.on('connect')
async def io_connect(data):
    username = data['username']
    room = data['room']
    print("Connected ", username, room)
    await emit('ready')
    join_room(room)


@socketio.on('disconnect')
def io_disconnect(data):
    username = data['username']
    room = data['room']
    print("Disconnect ", username, room)
    leave_room(room)


@socketio.on('data')
async def io_data(data):
    print('Message from {}: {}', data)
    await emit('data', data, room=data['room'])