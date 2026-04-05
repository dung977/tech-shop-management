import json
import flask
import uuid
from db_config import get_connection, get_json_results, generate_new_id

account_bp = flask.Blueprint('account_bp', __name__)


@account_bp.route('/getall', methods=['GET'])
def get_all_accounts():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("SELECT * FROM Account WHERE IsDeleted = 0")
    return flask.jsonify(get_json_results(cursor)), 200


@account_bp.route('/<id>', methods=['GET'])
def get_account(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("SELECT * FROM Account WHERE AccountID = ? AND IsDeleted = 0", (id,))
    result = get_json_results(cursor)
    if not result:
        return flask.jsonify({"mess": "Account not found"}), 404
    return flask.jsonify(result), 200


@account_bp.route('/add', methods=['POST'])
def add_account():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        data = flask.request.json
        full_name = data.get('FullName')  # Thêm trường Họ và tên
        username = data.get('Username')
        password = data.get('Password')
        role = data.get('Role', 'Customer')

        if not full_name or not username or not password:
            return flask.jsonify({"mess": "Vui lòng nhập đầy đủ Họ tên, Username và Password!"}), 400

        cursor.execute("SELECT AccountID FROM Account WHERE Username = ?", (username,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Username đã tồn tại trên hệ thống!"}), 400

        employee_id = None
        customer_id = None


        if role == 'Customer':
            # Sinh mã Khách hàng mới (VD: CUS16)
            customer_id = generate_new_id(cursor, "Customer", "CustomerID", "CUS")
            cursor.execute("INSERT INTO Customer (CustomerID, FullName, IsDeleted) VALUES (?, ?, 0)",
                           (customer_id, full_name))
        else:

            employee_id = generate_new_id(cursor, "Employee", "EmployeeID", "EMP")
            cursor.execute("INSERT INTO Employee (EmployeeID, FullName, Role, IsDeleted) VALUES (?, ?, ?, 0)",
                           (employee_id, full_name, role))

        account_id = generate_new_id(cursor, "Account", "AccountID", "ACC")
        query = """
            INSERT INTO Account (AccountID, Username, Password, Role, EmployeeID, CustomerID, IsActive, IsDeleted) 
            VALUES (?, ?, ?, ?, ?, ?, 1, 0)
        """
        cursor.execute(query, (account_id, username, password, role, employee_id, customer_id))
        db_conn.commit()

        return flask.jsonify({"mess": "Thêm tài khoản và hồ sơ thành công!", "AccountID": account_id}), 201

    except Exception as e:
        db_conn.rollback()  # Xóa các bước trên nếu có lỗi xảy ra
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({"error": str(e)}), 500
@account_bp.route('/edit/<id>', methods=['PUT'])
def edit_account_password(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        data = flask.request.json
        new_password = data.get('Password')

        if not new_password:
            return flask.jsonify({"mess": "Vui lòng cung cấp mật khẩu mới!"}), 400

        # Kiểm tra tài khoản có tồn tại và chưa bị xóa không
        cursor.execute("SELECT AccountID FROM Account WHERE AccountID = ? AND IsDeleted = 0", (id,))
        if not cursor.fetchone():
            return flask.jsonify({"mess": "Không tìm thấy tài khoản!"}), 404

        # Chỉ cập nhật duy nhất cột Password
        cursor.execute("UPDATE Account SET Password = ? WHERE AccountID = ?", (new_password, id))
        db_conn.commit()

        return flask.jsonify({"mess": "Cập nhật mật khẩu thành công!"}), 200

    except Exception as e:
        db_conn.rollback()
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({"error": str(e)}), 500


@account_bp.route('/delete/<id>', methods=['PUT', 'DELETE'])
def delete_account(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT AccountID FROM Account WHERE AccountID = ? AND IsDeleted = 0", (id,))
        if not cursor.fetchone():
            return flask.jsonify({"mess": "Account does not exist"}), 404

        cursor.execute("UPDATE Account SET IsDeleted = 1 WHERE AccountID = ?", (id,))
        db_conn.commit()
        return flask.jsonify({"mess": "Account deleted"}), 200

    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500


@account_bp.route('/search', methods=['POST'])
def search_accounts():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        keyword = flask.request.args.get('keyword', '')

        # Đã FIX LỖI THIẾU NGOẶC ĐƠN Ở ĐÂY để chặn lấy nhầm tài khoản đã xóa
        sql = "SELECT * FROM Account WHERE IsDeleted = 0 AND (Username LIKE ? OR Role LIKE ?)"
        search_term = f"%{keyword}%"

        cursor.execute(sql, (search_term, search_term))
        return flask.jsonify(get_json_results(cursor)), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({'error': str(e)}), 400