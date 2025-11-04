from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, UserPreference
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('login') or not data.get('password'):
            return jsonify({'error': 'Username/email and password are required'}), 400
            
        login_input = data['login']
        password = data['password']
        
        user = User.query.filter(
            (User.username == login_input) | (User.email == login_input)
        ).first()
        
        if user and user.check_password(password):
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid username/email or password'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200


@app.route('/api/user/<int:user_id>/preferences', methods=['GET'])
def get_user_preferences(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        prefs = UserPreference.query.get(user_id)
        if not prefs:
            # return default preferences if none exist yet
            prefs = UserPreference(
                user_id=user_id,
                visual=False,
                adhd=False,
                due_dates=False,
                onboarding_complete=False,
            )
            db.session.add(prefs)
            db.session.commit()

        return jsonify(prefs.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/<int:user_id>/preferences', methods=['PUT', 'POST'])
def upsert_user_preferences(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json() or {}
        prefs = UserPreference.query.get(user_id)
        if not prefs:
            prefs = UserPreference(user_id=user_id)
            db.session.add(prefs)

        if 'visual' in data:
            prefs.visual = bool(data['visual'])
        if 'adhd' in data:
            prefs.adhd = bool(data['adhd'])
        if 'due_dates' in data:
            prefs.due_dates = bool(data['due_dates'])
        if 'onboarding_complete' in data:
            prefs.onboarding_complete = bool(data['onboarding_complete'])

        db.session.commit()
        return jsonify({'message': 'Preferences saved', 'preferences': prefs.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)