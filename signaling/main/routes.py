from . import main
from flask import redirect, url_for


@main.route('/', methods=['GET'])
def index():
    return redirect(url_for('room.index'))