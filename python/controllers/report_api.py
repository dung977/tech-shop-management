import flask
import uuid
from db_config import get_connection, get_json_results

report_bp = flask.Blueprint('report_bp', __name__)

@report_bp.route('/revenue', methods=['GET'])
def report_revenue():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("SELECT SUM(TotalPrice) FROM Bill WHERE   Status = 'Completed'")
    rev = cursor.fetchone()[0]
    if rev is None:
        rev = 0
    return flask.jsonify({"TotalRevenue": rev}), 200


@report_bp.route('/top-products', methods=['GET'])
def top_products():
    try:
        db_conn = get_connection()
        cursor = db_conn.cursor()

        # SỬA LỖI: Đã xóa pv.Capacity ra khỏi SELECT và GROUP BY
        sql = """
            SELECT TOP 10 
                p.ProductName, pv.ProductID, pv.Color, SUM(bd.Num) as TotalSold
            FROM BillDetail bd
            INNER JOIN Bill b ON bd.BillID = b.BillID
            INNER JOIN ProductVariant pv ON bd.ProductVariantID = pv.ProductVariantID
            INNER JOIN Product p ON pv.ProductID = p.ProductID
            WHERE b.Status = 'Completed'
            GROUP BY p.ProductName, pv.ProductID, pv.Color
            ORDER BY TotalSold DESC
        """
        cursor.execute(sql)
        return flask.jsonify(get_json_results(cursor)), 200

    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500