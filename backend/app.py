from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_session import Session
from config import Config
from models.user import User
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize session
Session(app)

# Initialize user model
user_model = User(app.config['SUPABASE_URL'], app.config['SUPABASE_KEY'])

@app.before_request
def refresh_session():
    if 'user_id' in session:
        session.permanent = True  # Resets session lifetime

@app.route('/')
def index():
    """Homepage - check if user is logged in"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/signup/<account_type>')
def signup_form(account_type):
    """Show signup form for specific account type"""
    if account_type not in ['student', 'teacher', 'parent']:
        flash('Invalid account type', 'error')
        return redirect(url_for('signup'))
    
    return render_template('signup.html', account_type=account_type)

@app.route('/register', methods=['POST'])
def register():
    """Handle user registration"""
    try:
        # Get form data
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        account_type = request.form.get('account_type')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        
        # Validate inputs
        if not all([email, password, confirm_password, account_type, first_name, last_name]):
            flash('All fields are required', 'error')
            return redirect(url_for('signup_form', account_type=account_type))
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('signup_form', account_type=account_type))
        
        if len(password) < 8:
            flash('Password must be at least 8 characters long', 'error')
            return redirect(url_for('signup_form', account_type=account_type))
        
        # Check if email already exists
        if user_model.email_exists(email):
            flash('Email already exists', 'error')
            return redirect(url_for('signup_form', account_type=account_type))
        
        # Create user
        result = user_model.create_user(email, password, account_type, first_name, last_name)
        
        if result['success']:
            # Log user in
            session['user_id'] = result['user']['id']
            session['user_email'] = result['user']['email']
            session['account_type'] = result['user']['account_type']
            session['first_name'] = result['user']['first_name']
            session.permanent = True
            
            flash('Account created successfully!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash(f'Error creating account: {result["error"]}', 'error')
            return redirect(url_for('signup_form', account_type=account_type))
            
    except Exception as e:
        flash(f'An error occurred: {str(e)}', 'error')
        return redirect(url_for('signup'))

@app.route('/login')
def login():
    """Show login form"""
    return render_template('login.html')

@app.route('/authenticate', methods=['POST'])
def authenticate():
    """Handle user login"""
    try:
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Email and password are required', 'error')
            return redirect(url_for('login'))
        
        # Authenticate user
        result = user_model.authenticate_user(email, password)
        
        if result['success']:
            # Set session
            user = result['user']
            session['user_id'] = user['id']
            session['user_email'] = user['email']
            session['account_type'] = user['account_type']
            session['first_name'] = user['first_name']
            session.permanent = True
            
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash(f'Login failed: {result["error"]}', 'error')
            return redirect(url_for('login'))
            
    except Exception as e:
        flash(f'An error occurred: {str(e)}', 'error')
        return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    """User dashboard - requires login"""
    if 'user_id' not in session:
        flash('Please log in to access your dashboard', 'error')
        return redirect(url_for('login'))
    
    # Get fresh user data
    user_data = user_model.get_user_by_id(session['user_id'])
    if not user_data:
        flash('User not found', 'error')
        return redirect(url_for('logout'))
    
    return render_template('dashboard.html', user=user_data)

@app.route('/logout')
def logout():
    """Log user out"""
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/profile')
def profile():
    """User profile page"""
    if 'user_id' not in session:
        flash('Please log in to view your profile', 'error')
        return redirect(url_for('login'))
    
    # Get fresh user data
    user_data = user_model.get_user_by_id(session['user_id'])
    if not user_data:
        flash('User not found', 'error')
        return redirect(url_for('logout'))
    
    return render_template('profile.html', user=user_data)

if __name__ == '__main__':
    app.run(debug=True)