import flask
import uuid
from db_config import get_connection, get_json_results

bill_detail_bp = flask.Blueprint('bill_detail_bp', __name__)

@bill_detail_bp.route('/getall', methods=['GET'])
def get_all_bill_details():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        # JOIN để lấy thêm Tên sản phẩm, Màu sắc và Hình ảnh
        query = """
            SELECT 
                bd.*, 
                p.ProductName, 
                pv.Color, 
                pv.Image
            FROM BillDetail bd
            LEFT JOIN ProductVariant pv ON bd.ProductVariantID = pv.ProductVariantID
            LEFT JOIN Product p ON pv.ProductID = p.ProductID
        """
        cursor.execute(query)
        details = get_json_results(cursor)

        # Ép kiểu an toàn cho JSON (tránh lỗi nếu Database lưu Decimal)
        for d in details:
            if d.get('Price') is not None:
                d['Price'] = float(d['Price'])
            if d.get('Num') is not None:
                d['Num'] = int(d['Num'])

        cursor.close()
        return flask.jsonify(details), 200

    except Exception as e:
        if cursor: cursor.close()
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({"error": str(e)}), 500


@bill_detail_bp.route('/get/<id>', methods=['GET'])
def get_bill_detail(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        # JOIN tương tự như getall, nhưng lọc theo BillID
        query = """
            SELECT 
                bd.*, 
                p.ProductName, 
                pv.Color, 
                pv.Image
            FROM BillDetail bd
            LEFT JOIN ProductVariant pv ON bd.ProductVariantID = pv.ProductVariantID
            LEFT JOIN Product p ON pv.ProductID = p.ProductID
            WHERE bd.BillID = ?
        """
        cursor.execute(query, (id,))
        details = get_json_results(cursor)

        if not details:
            cursor.close()
            return flask.jsonify([]), 200

        # Ép kiểu an toàn cho JSON
        for d in details:
            if d.get('Price') is not None:
                d['Price'] = float(d['Price'])
            if d.get('Num') is not None:
                d['Num'] = int(d['Num'])

        cursor.close()
        return flask.jsonify(details), 200

    except Exception as e:
        if cursor: cursor.close()
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({"error": str(e)}), 500


@bill_detail_bp.route('/add', methods=['POST'])
def add_bill_detail():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        bd_id = "BD_" + str(uuid.uuid4())[:6]
        bill_id = flask.request.json.get("BillID")
        variant_id = flask.request.json.get("ProductVariantID")
        num = flask.request.json.get("Num")

        # 1. Lấy giá bán hiện tại của sản phẩm (Đã thêm dấu ngoặc đơn cho variant_id)
        cursor.execute("SELECT SellingPrice FROM ProductVariant WHERE ProductVariantID=?", (variant_id,))
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
        return flask.jsonify({"mess": "Thêm sản phẩm vào đơn thành công", "BillDetailID": bd_id}), 200
    except Exception as e:
        db_conn.rollback()
        import traceback
        print(traceback.format_exc())
        return flask.jsonify({"error": str(e)}), 500