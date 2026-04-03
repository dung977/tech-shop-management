import flask
import uuid
from db_config import get_connection, get_json_results

bill_bp = flask.Blueprint('bill_bp', __name__)
@bill_bp.route('/getall', methods = ['GET'])
def get_all_bills():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('select * from Bill')
    return flask.jsonify(get_json_results(cursor)), 200

@bill_bp.route('/<id>', methods = ['GET'])
def get_bill(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('select * from Bill where BillID = ?', (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@bill_bp.route('/add', methods = ['POST'])
def create_bill():
    try:
        cursor = conn.cursor()
        bill_id = generate_new_id(cursor, "Bill", "BillID", "BIL")
        cus_id = flask.request.json.get("CustomerID")
        emp_id = flask.request.json.get("EmployeeID")
        payment_method = flask.request.json.get("PaymentMethod")
        status = flask.request.json.get("Status", "Draft")
        total = flask.request.json.get("TotalPrice", 0)
        db_conn = get_connection()
        cursor = db_conn.cursor()
        if cus_id:
            cursor.execute("SELECT CustomerID FROM Customer WHERE CustomerID = ?", (cus_id,))
            if not cursor.fetchone():
                return flask.jsonify({"mess": f"Lỗi: Khách hàng mang mã '{cus_id}' không tồn tại!"}), 400

            # 2. Bắt lỗi Khóa Ngoại: Kiểm tra Nhân viên có tồn tại không
        if emp_id:
            cursor.execute("SELECT EmployeeID FROM Employee WHERE EmployeeID = ?", (emp_id,))
        sql = "insert into Bill(BillID, CustomerID, EmployeeID, TotalPrice, PayMethod, Status) values (?, ?, ?, ?, ?, ?)"
        cursor.execute(sql, (bill_id, cus_id, emp_id, total, payment_method, status))
        db_conn.commit()
        return flask.jsonify({"mess": "Bill created successfully",
                              "BillID": bill_id}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@bill_bp.route('/<id>/checkout', methods = ['POST'])
def checkout_bill(id):
    try:
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("select ProductVariantID, Num from BillDetail where BillID = ?", (id,))
        details = cursor.fetchall()

        for detail in details:
            variant_id = detail[0]
            num_order = detail[1]
            cursor.execute("select StockQuantity from ProductVariant where ProductVariantID = ?", (variant_id,))
            current_stock = cursor.fetchone()[0]
            if current_stock < num_order:
                return flask.jsonify({"mess": f"Product {variant_id} is out of stock"}), 200
            cursor.execute("update ProductVariant set StockQuantity = StockQuantity - ? where ProductVariantID = ?", (num_order, variant_id))
        cursor.execute("update Bill set Status = 'Completed' where BillID = ?", (id,))
        db_conn.commit()
        return flask.jsonify({"mess": "Payment successful, stock has been deducted!"}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500
@bill_bp.route('/<id>/cancel', methods = ['POST'])
def cancel_bill(id):
    try:
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("select Status from Bill where BillID = ?", (id,))
        status = cursor.fetchone()[0]
        if status == 'Completed':
            cursor.execute("select ProductVariantID, Num from BillDetail where BillID = ?", (id,))
            for val in cursor.fetchall():
                cursor.execute("update ProductVariant set StockQuantity = StockQuantity + ? where ProductVariantID = ?", (val[1], val[0]))
        cursor.execute("update Bill set Status = 'Cancelled' where BillID = ?", (id,))
        db_conn.commit()
        return flask.jsonify({"mess": "Bill canceled successfully"}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@bill_bp.route('/<id>/stock', methods = ['GET'])
def check_stock(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("select StockQuantity from ProductVariant where ProductVariantID = ?", (id,))
    stock = cursor.fetchone()
    if stock:
        return flask.jsonify({"ProductVariantID": id,
                              "StockQuantity": stock[0]}), 200
    return flask.jsonify({"error": "Product not found"}), 404