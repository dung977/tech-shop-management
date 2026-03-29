import flask
import uuid
from db_config import conn, get_json_results

employee_bp = flask.Blueprint('employee_bp', __name__)

@employee_bp.route('/getall', methods = ['GET'])
def get_all_employees():
    cursor = conn.cursor()
    cursor.execute('select * from Employee')
    return flask.jsonify(get_json_results(cursor)), 200

@employee_bp.route('/<id>', methods = ['GET'])
def get_employee(id):
    cursor = conn.cursor()
    cursor.execute('select * from Employee where EmployeeID = ?', (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@employee_bp.route('/add', methods = ['POST'])
def add_employee():
    try:
        employee_id = "EMP_" + str(uuid.uuid4())[:6]
        account_id = "ACC_" + str(uuid.uuid4())[:6]
        username = flask.request.json.get("Username")
        password = flask.request.json.get("Password")
        fullname = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        role = flask.request.json.get("Role", "Employee")
        cursor = conn.cursor()
        cursor.execute("select AccountID from Account where Username = ?", (username,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Username already exists"}), 400
        cursor.execute("select EmployeeID from Employee where Phone = ?", (phone,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Phone already exists"}), 400
        cursor.execute("select EmployeeID from Employee where Email = ?", (email,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Email already exists"}), 400

        sql_employee = "insert into Employee(EmployeeID, FullName, Phone, Email, Role) values (?, ?, ?, ?, ?)"
        cursor.execute(sql_employee, (employee_id, fullname, phone, email, role))

        sql_account = "insert into Account(AccountID, Username, Password, Role, IsActive, EmployeeID) values (?, ?, ?, ?, 1, ?)"
        cursor.execute(sql_account, (account_id, username, password, role, employee_id))
        conn.commit()
        return flask.jsonify({
            "mess": "Add Successful",
            "EmployeeID": employee_id,
            "AccountID": account_id
        }), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500


@employee_bp.route('/update/<id>', methods = ['PUT'])
def update_employee(id):
    try:
        full_name = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        role = flask.request.json.get("Role", "Employee")
        cursor = conn.cursor()
        cursor.execute("update Employee set FullName = ?, Phone = ?, Email = ?, Role = ? where EmployeeID = ?", (full_name, phone, email, role, id))
        conn.commit()
        return flask.jsonify({"mess": "Update successful"}), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@employee_bp.route('/delete/<id>', methods = ['DELETE'])
def delete_employee(id):
    try:
        customer_id = id
        cursor = conn.cursor()
        cursor.execute("delete from Account where EmployeeID = ?", (customer_id,))
        cursor.execute("delete from Employee where EmployeeID = ?", (customer_id,))
        conn.commit()
        return flask.jsonify({"mess": "Delete successful"}), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@employee_bp.route('/search', methods=['POST'])
def search_employees():
    try:
        keyword = flask.request.args.get('keyword','' )
        cursor = conn.cursor()
        sql = "select * from Employee where FullName like ? or Phone like ? or Email like ? or Role like ?"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term, search_term, search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400