import flask
import uuid
from db_config import get_connection, get_json_results

bill_detail_bp = flask.Blueprint('bill_detail_bp', __name__)

@bill_detail_bp.route('/getall', methods = ['GET'])
def get_all_bill_details():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('select * from BillDetail')
    return flask.jsonify(get_json_results(cursor)), 200

@bill_detail_bp.route('/get/<id>', methods = ['GET'])
def get_bill_detail(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('select * from BillDetail where BillID = ?', (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@bill_detail_bp.route('/add', methods=['POST'])
def add_bill_detail():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        bd_id = "BD_" + str(uuid.uuid4())[:6]
        bill_id = flask.request.json.get("BillID")
        variant_id = flask.request.json.get("ProductVariantID")
        num = flask.request.json.get("Num")

        # 1. Lấy giá bán hiện tại của sản phẩm
        cursor.execute("SELECT SellingPrice FROM ProductVariant WHERE ProductVariantID=?", variant_id)
        price_row = cursor.fetchone()
        if not price_row:
            return flask.jsonify({"mess": "Sản phẩm không tồn tại"}), 404
        price = price_row[0]

        # 2. Thêm vào chi tiết hóa đơn (lưu lại giá ngay thời điểm mua)
        sql_insert = "INSERT INTO BillDetail(BillDetailID, BillID, ProductVariantID, Num, Price) VALUES(?, ?, ?, ?, ?)"
        cursor.execute(sql_insert, (bd_id, bill_id, variant_id, num, price))

        # 3. Cập nhật lại TotalPrice trong bảng Bill tổng
        cursor.execute("UPDATE Bill SET TotalPrice = TotalPrice + (? * ?) WHERE BillID=?", (price, num, bill_id))

        db_conn.commit()
        return flask.jsonify({"mess": "Thêm sản phẩm vào đơn thành công",
                              "BillDetailID": bd_id}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

