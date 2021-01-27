from . import user
from flask import render_template


@user.route('/', methods=['GET'])
def index():
    return render_template('user/index.html')


@user.route('/signin', methods=['GET', 'POST'])
def signin():
    return render_template('user/signin.html')


@user.route('/register', methods=['GET', 'POST'])
def register():
    return render_template('user/register.html')