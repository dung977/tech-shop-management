import flask
import uuid
from db_config import conn, get_json_results, generate_new_id

purchase_order_detail_bp = flask.Blueprint('purchase_order_detail_bp', __name__)


@purchase_order_detail_bp.route('/getall', methods=['GET'])
def get_all_purchase_order_detail():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM PurchaseOrderDetail")
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all purchase order detail!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_detail_bp.route('/add', methods=['POST'])
def add_purchase_order_detail():
    cursor = conn.cursor()
    try:
        PurchaseOrderID = flask.request.json.get("PurchaseOrderID")
        PurchaseOrderDetailID = generate_new_id(cursor, "PurchaseOrderDetail", "PurchaseOrderDetailID", "POD")
        NumOrder = flask.request.json.get("NumOrder")
        ProductVariantID = flask.request.json.get("ProductVariantID")
        ImportPrice = flask.request.json.get("ImportPrice")

        cursor.execute("SELECT PurchaseOrderDetailID FROM PurchaseOrderDetail WHERE PurchaseOrderDetailID = ?",
                       (PurchaseOrderDetailID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "PurchaseOrderDetailID already exist!"}), 400
        cursor.execute("SELECT PurchaseOrderID FROM PurchaseOrder WHERE PurchaseOrderID = ?", (PurchaseOrderID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "PurchaseOrder does not exist!"}), 400
        cursor.execute("SELECT ProductVariantID FROM ProductVariant WHERE ProductVariantID = ?", (ProductVariantID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "ProductVariant does not exist!"}), 400
        
        query = """
                INSERT INTO PurchaseOrderDetail(PurchaseOrderDetailID, PurchaseOrderID, 
                ProductVariantID, NumOrder, ImportPrice) VALUES(?, ?, ?, ?, ?)
                """
        cursor.execute(query, (PurchaseOrderDetailID, PurchaseOrderID, ProductVariantID, NumOrder, ImportPrice))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_detail_bp.route('/update/<ID>', methods=['PUT'])
def update_purchase_order_detail(ID):
    cursor = conn.cursor()
    try:
        PurchaseOrderID = flask.request.json.get("PurchaseOrderID")
        ProductVariantID = flask.request.json.get("ProductVariantID")
        NumOrder = flask.request.json.get("NumOrder")
        ImportPrice = flask.request.json.get("ImportPrice")

        cursor.execute("SELECT PurchaseOrderID FROM PurchaseOrder WHERE PurchaseOrderID = ?", (PurchaseOrderID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "PurchaseOrder does not exist!"}), 400
        cursor.execute("SELECT ProductVariantID FROM ProductVariant WHERE ProductVariantID = ?", (ProductVariantID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "ProductVariant does not exist!"}), 400
        
        query = """
                UPDATE PurchaseOrderDetail SET NumOrder = ?,
                ImportPrice = ? WHERE PurchaseOrderDetailID = ?
                """
        cursor.execute(query, (NumOrder, ImportPrice, ID))
        conn.commit()
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_detail_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_purchase_order_detail(ID):
    cursor = conn.cursor()
    try:
        query = "DELETE FROM PurchaseOrderDetail WHERE PurchaseOrderDetailID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500     
