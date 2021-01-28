from flask import Blueprint

user = Blueprint('user', __name__, template_folder="../user/templates")

from . import routes