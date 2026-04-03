import flask
import uuid
from db_config import conn, get_json_results, generate_new_id
# BẮT BUỘC THÊM DÒNG NÀY ĐỂ BĂM MẬT KHẨU
from werkzeug.security import generate_password_hash

employee_bp = flask.Blueprint('employee_bp', __name__)


@employee_bp.route('/getall', methods=['GET'])
def get_all_employees():
    cursor = conn.cursor()
    cursor.execute('select * from Employee where IsDeleted = 0')
    return flask.jsonify(get_json_results(cursor)), 200


@employee_bp.route('/<id>', methods=['GET'])
def get_employee(id):
    cursor = conn.cursor()
    # SỬA LỖI: Đổi chữ 'where' thứ hai thành 'and'
    cursor.execute('select * from Employee where EmployeeID = ? and IsDeleted = 0', (id,))
    return flask.jsonify(get_json_results(cursor)), 200


@employee_bp.route('/add', methods=['POST'])
def add_employee():
    try:
        cursor = conn.cursor()
        employee_id = generate_new_id(cursor, "Employee", "EmployeeID", "EMP")
        account_id = generate_new_id(cursor, "Account", "AccountID", "ACC")

        username = flask.request.json.get("Username")
        password = flask.request.json.get("Password")
        fullname = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        role = flask.request.json.get("Role", "Employee")

        cursor.execute("select AccountID from Account where Username = ?", (username,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Username already exists"}), 400

        cursor.execute("select EmployeeID from Employee where Phone = ?", (phone,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Phone already exists"}), 400

        cursor.execute("select EmployeeID from Employee where Email = ?", (email,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Email already exists"}), 400

        # Băm mật khẩu
        hashed_password = generate_password_hash(password)

        # Thêm IsDeleted = 0 vào lệnh INSERT
        sql_employee = "insert into Employee(EmployeeID, FullName, Phone, Email, Role, IsDeleted) values (?, ?, ?, ?, ?, 0)"
        cursor.execute(sql_employee, (employee_id, fullname, phone, email, role))

        # Lưu mật khẩu đã băm
        sql_account = "insert into Account(AccountID, Username, Password, Role, IsActive, EmployeeID, IsDeleted) values (?, ?, ?, ?, 1, ?, 0)"
        cursor.execute(sql_account, (account_id, username, hashed_password, role, employee_id))

        conn.commit()
        return flask.jsonify({
            "mess": "Add Successful",
            "EmployeeID": employee_id,
            "AccountID": account_id
        }), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500


@employee_bp.route('/update/<id>', methods=['PUT'])
def update_employee(id):
    try:
        full_name = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        role = flask.request.json.get("Role", "Employee")
        cursor = conn.cursor()
        cursor.execute(
            "update Employee set FullName = ?, Phone = ?, Email = ?, Role = ? where IsDeleted = 0 and EmployeeID = ?",
            (full_name, phone, email, role, id))
        conn.commit()
        return flask.jsonify({"mess": "Update successful"}), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500


@employee_bp.route('/delete/<id>', methods=['PUT'])
def delete_employee(id):
    try:
        employee_id = id
        cursor = conn.cursor()
        cursor.execute("update Account set IsDeleted = 1 where EmployeeID = ?", (employee_id,))
        cursor.execute("update Employee set IsDeleted = 1 where EmployeeID = ?", (employee_id,))
        conn.commit()
        return flask.jsonify({"mess": "Delete successful"}), 200
    except Exception as e:
        conn.rollback()
        return flask.jsonify({"error": str(e)}), 500



@employee_bp.route('/search', methods=['POST'])
def search_employees():
    try:
        keyword = flask.request.args.get('keyword', '')
        cursor = conn.cursor()

        # SỬA LỖI: Thêm cặp ngoặc ( ) để đóng gói các toán tử OR
        sql = """
            SELECT * FROM Employee 
            WHERE IsDeleted = 0 
            AND (FullName LIKE ? OR Phone LIKE ? OR Email LIKE ? OR Role LIKE ?)
        """
        search_term = f"%{keyword}%"

        cursor.execute(sql, (search_term, search_term, search_term, search_term))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400