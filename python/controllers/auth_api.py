import flask
import uuid
from db_config import get_connection, get_json_results
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = flask.Blueprint('auth_bp', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        user = flask.request.json.get("Username")
        pwd = flask.request.json.get("Password")
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute(
            "select AccountID, Role, EmployeeID, CustomerID, Password from Account where Username = ? AND IsActive = 1",
            (user,))
        account = cursor.fetchone()

        if account:
            account_id = account[0]
            role = account[1]
            db_password = account[4]

            # (Hash của werkzeug thường bắt đầu bằng scrypt: hoặc pbkdf2:)
            is_hashed = db_password.startswith('scrypt:') or db_password.startswith('pbkdf2:')

            is_valid = False
            if is_hashed:
                is_valid = check_password_hash(db_password, pwd)
            else:
                is_valid = (db_password == pwd)
                if is_valid:
                    new_hashed_pwd = generate_password_hash(pwd)
                    cursor.execute("UPDATE Account SET Password = ? WHERE AccountID = ?", (new_hashed_pwd, account_id))
                    conn.commit()
            if is_valid:
                return flask.jsonify({
                    "mess": "Login Successful",
                    "AccountID": account_id,
                    "Role": role
                }), 200
            else:
                return flask.jsonify({"mess": "Sai mật khẩu"}), 401
        else:
            return flask.jsonify({"mess": "Tài khoản không tồn tại"}), 401
    except Exception as e:
        return flask.jsonify({"mess": str(e)}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        username = flask.request.json.get("Username")
        password = flask.request.json.get("Password")
        fullname = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        address = flask.request.json.get("Address")

        hashed_password = generate_password_hash(password)

        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("select AccountID from Account where Username = ?", (username,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Username already exists"}), 400
        cursor.execute("select CustomerID from Customer where Phone = ?", (phone,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Phone already exists"}), 400
        cursor.execute("select CustomerID from Customer where Email = ?", (email,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Email already exists"}), 400

        customer_id = generate_new_id(cursor, "Customer", "CustomerID", "CUS")
        account_id = generate_new_id(cursor, "Account", "AccountID", "ACC")

        sql_customer = "insert into customer(CustomerID, FullName, Phone, Email, Address) values (?, ?, ?, ?, ?)"
        cursor.execute(sql_customer, (customer_id, fullname, phone, email, address))
        sql_account = "insert into account(AccountID, Username, Password, Role, IsActive, CustomerID) values (?, ?, ?, 'Customer', 1, ?)"
        cursor.execute(sql_account, (account_id, username, hashed_password, customer_id))

        db_conn.commit()

        return flask.jsonify({
            "mess": "Register Successful",
            "Username": username,
            "AccountID": account_id
        }), 200
    except Exception as e:
        db_conn.rollback()
        print(e)
        return flask.jsonify({"mess": "Error system: " + str(e)}), 500