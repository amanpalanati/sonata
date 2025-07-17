from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
)
from flask_session import Session
from config import Config
from models.user import User
import os
from models.forms import SignUpForm, LoginForm

# Initialize Flask app
app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static",
)
app.config.from_object(Config)

# Initialize session
Session(app)

# Initialize user model
user_model = User(app.config["SUPABASE_URL"], app.config["SUPABASE_KEY"])


@app.before_request
def refresh_session():
    if "user_id" in session:
        session.permanent = True  # Resets session lifetime


@app.route("/")
def index():
    """Homepage - check if user is logged in"""
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return render_template("index.html")


@app.route("/about")
def about():
    """Show about page"""
    return render_template("about.html")


@app.route("/help")
def help():
    """Show help page"""
    return render_template("help.html")


@app.route("/signup")
def signup():
    """Show account type selection"""
    return render_template("account_type.html")


@app.route("/signup/<account_type>", methods=["GET", "POST"])
def signup_form(account_type):
    """Show signup form for specific account type"""
    if account_type not in ["student", "teacher", "parent"]:
        flash("Invalid account type", "error")
        return redirect(url_for("signup"))

    form = SignUpForm()

    # For GET requests, set the account_type
    if request.method == "GET":
        form.account_type.data = account_type

    if form.validate_on_submit():
        try:
            # Create user
            result = user_model.create_user(
                form.email.data,
                form.password.data,
                form.account_type.data,
                form.first_name.data,
                form.last_name.data,
            )

            if result["success"]:
                # Log user in (set session)
                session["user_id"] = result["user"]["id"]
                session["user_email"] = result["user"]["email"]
                session["account_type"] = result["user"]["account_type"]
                session["first_name"] = result["user"]["first_name"]
                session.permanent = True

                flash("Account created successfully!", "success")
                return redirect(url_for("dashboard"))
            else:
                flash(result["error"], "error")
                # Form will automatically retain the user's input

        except Exception as e:
            flash(f"An error occurred: {str(e)}", "error")
            # Form will automatically retain the user's input

    return render_template("signup.html", form=form, account_type=account_type)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Show login form and handle authentication"""
    form = LoginForm()

    if form.validate_on_submit():
        try:
            # Authenticate user
            result = user_model.authenticate_user(form.email.data, form.password.data)

            if result["success"]:
                # Log user in (set session)
                user = result["user"]
                session["user_id"] = user["id"]
                session["user_email"] = user["email"]
                session["account_type"] = user["account_type"]
                session["first_name"] = user["first_name"]
                session.permanent = True

                flash("Login successful!", "success")
                return redirect(url_for("dashboard"))
            else:
                flash(result["error"], "error")
                # Form will automatically retain the email input

        except Exception as e:
            flash(f"An error occurred: {str(e)}", "error")
            # Form will automatically retain the email input

    return render_template("login.html", form=form)


@app.route("/dashboard")
def dashboard():
    """User dashboard - requires login"""
    if "user_id" not in session:
        flash("Please log in to access your dashboard", "error")
        return redirect(url_for("login"))

    # Get fresh user data
    user_data = user_model.get_user(session["user_id"])
    if not user_data:
        flash("User not found", "error")
        return redirect(url_for("logout"))

    return render_template("dashboard.html", user=user_data)


@app.route("/logout")
def logout():
    """Log user out"""
    session.clear()
    return redirect(url_for("index"))


@app.route("/profile")
def profile():
    """User profile page"""
    if "user_id" not in session:
        flash("Please log in to view your profile", "error")
        return redirect(url_for("login"))

    # Get fresh user data
    user_data = user_model.get_user(session["user_id"])
    if not user_data:
        flash("User not found", "error")
        return redirect(url_for("logout"))

    return render_template("profile.html", user=user_data)


if __name__ == "__main__":
    app.run(debug=True)
