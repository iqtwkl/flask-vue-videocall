from . import api
from flask import session


@api.route('user/get-username', methods=['GET'])
def get_username():
    print('get username')
    try:
        return {'username': session.get('username')}
    except:
        return {'username': None}