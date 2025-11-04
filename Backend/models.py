from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class UserPreference(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    visual = db.Column(db.Boolean, default=False, nullable=False)
    adhd = db.Column(db.Boolean, default=False, nullable=False)
    due_dates = db.Column(db.Boolean, default=False, nullable=False)
    onboarding_complete = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship('User', backref=db.backref('preferences', uselist=False))

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'visual': self.visual,
            'adhd': self.adhd,
            'due_dates': self.due_dates,
            'onboarding_complete': self.onboarding_complete,
        }