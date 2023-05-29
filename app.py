import string
import sqlite3
import random
import traceback
import logging
from datetime import datetime
from flask import * 
from functools import wraps

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None


def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u


# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/room')
@app.route('/room/<chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')


@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404


# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API

# @app.route('/api/signup')
# def login():
#   ...


@app.route('/api/login', methods=['POST'])
def login():
    print("login")
    
    if request.method == 'POST':
        name = request.json.get('user')
        print(name)
        password = request.json.get('pass')
        print(password)

        u = query_db('select * from users where name = ? and password = ?', [name, password], one=True)

        if u:
            return jsonify({'Success': True, 'id': u['id'], 'name': u['name'], 'api_key': u['api_key']})
        
        else:
            print("couldn't find that user")
            return jsonify({'Success': False})



@app.route('/api/signup', methods=['GET'])
def signup():
    print("signup")
    if request.method == 'GET':
        user = new_user()
        return jsonify({'Success': True, 'api_key': user['api_key'], 'id': user['id'], 'name': user['name'], 'pass': user['password']})
    return jsonify({'Success': False})



@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    rooms = query_db('select * from rooms')

    if rooms:
        json_rooms = []
        for room in rooms:
            json_message = {
                'id': room[0],
                'name': room[1]
            }
            json_rooms.append(json_message)
        
    
        return jsonify({'Success': True, 'rooms': json_rooms})
        
    else:
        return jsonify({'Success': False})


@app.route('/api/logout')
def logout():
    return None


# Endpoint to update user's username
@app.route('/api/username', methods=['POST'])
def update_username():
    
    user_id = request.json.get('user')
    new_name = request.json.get('name')
    API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

    # Check if API key is provided and valid
    if request.headers.get('api_key') != API_KEY[0]:
        return jsonify({'error': 'Invalid API key'}), 401

    # Update user's username in database
    username = query_db('UPDATE users SET name = ? WHERE id = ?', [new_name, user_id])

    return jsonify({'Success': True, 'message': 'Username updated successfully'})


# POST to change the user's password
@app.route('/api/password', methods=['POST'])
def update_password():
    
    user_id = request.json.get('user')
    new_pass = request.json.get('pass')
    API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

    if len(new_pass) > 0:
        # Check if API key is provided and valid
        if request.headers.get('api_key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        # Update user's password in database
        password = query_db('UPDATE users SET password = ? WHERE id = ?', [new_pass, user_id])

        return jsonify({'Success': True, 'message': 'Password updated successfully'}), 200
    
    return jsonify({'message': 'Password needs to be greater than 0 length'}), 401



# POST to change the name of a room
@app.route('/api/roomname', methods=['POST', 'GET'])
def update_room_name():
    
    if request.method == 'POST':
        user_id = request.json.get('user')
        room_id = request.json.get('room')
        new_name = request.json.get('name')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if len(new_name) > 0:
            # Check if API key is provided and valid
            if request.headers.get('api_key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

            # Update user's password in database
            room_name = query_db('UPDATE rooms SET name = ? WHERE id = ?', [new_name, room_id])

            return jsonify({'Success': True, 'message': 'Room name updated successfully'})
        return jsonify({'message': 'Name needs to be greater than 0 length'}), 401

    if request.method == 'GET':
        room_id = request.headers.get('room_id')
        room_name = query_db('select name from rooms where id = ?', [room_id], one=True)

        return jsonify({'Success': True, 'name': room_name[0]})



# GET / POST to get or post a new message to a room
@app.route('/api/messages', methods=['GET', 'POST'])
def get_post_message():
    
    if request.method == 'POST':
        user_id = request.json.get('user')
        room_id = request.json.get('room')
        body = request.json.get('message')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if len(body) > 0:
            # Check if API key is provided and valid
            if request.headers.get('API_Key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

            # Insert message into database
            message = query_db('INSERT INTO messages (user_id, room_id, body) VALUES (?, ?, ?)', [user_id, room_id, body], one=True)

            return jsonify({'message': 'Message posted successfully'}), 200
        return jsonify({'message': 'Message needs to be greater than 0 length'}), 401

    if request.method == "GET":
        user_id = request.headers.get('user')
        room_id = request.headers.get('room')
        last_ind = request.headers.get('ind')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        # Check if API key is provided and valid
        if request.headers.get('API_Key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        # Get messages from database
        messages = query_db('select name, body, messages.id from messages LEFT JOIN users on messages.user_id = users.id WHERE room_id = ? and messages.id >= ?', [room_id, last_ind])

        if messages:
            json_messages = []
            for message in messages:
                json_message = {
                    'name': message[0],
                    'body': message[1],
                    'id': message[2]
                }
                json_messages.append(json_message)


            return jsonify({'flag': True, 'messages': json_messages})
        
        else:
            return jsonify({'flag': False})


@app.route('/api/createrooms', methods=['GET'])
def create_room():
    if (request.method == 'GET'):
        name = "Unnamed Room " + ''.join(random.choices(string.digits, k=6))
        room = query_db('insert into rooms (name) values (?) returning id', [name], one=True)            
        return jsonify({'flag': True, 'room_name': name, 'room_id': room['id']})
    else:
        return jsonify({'flag': False})