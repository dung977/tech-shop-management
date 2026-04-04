import flask
import uuid
from db_config import get_connection, get_json_results, generate_new_id

purchase_order_bp = flask.Blueprint('purchase_order-bp', __name__)

@purchase_order_bp.route('/getall', methods=['GET'])
def get_all_purchase_order():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("""
                       SELECT po.PurchaseOrderID,
                              sp.SupplierName,
                              em.FullName AS EmployeeName,
                              po.OrderDate,
                              po.Status
                       FROM PurchaseOrder po
                                JOIN Supplier sp ON po.SupplierID = sp.SupplierID
                                JOIN EMPLOYEE em ON po.EmployeeID = em.EmployeeID
                       """)
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all purchase order!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_bp.route('/<ID>')
def get_purchase_order_detail(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        query = """
                SELECT * FROM PurchaseOrder po JOIN PurchaseOrderDetail pod 
                ON po.PurchaseOrderID = pod.PurchaseOrderID
                WHERE po.PurchaseOrderID = ?
                """
        cursor.execute(query, (ID,))
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't find this purchase order detail!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_bp.route('/add', methods=['POST'])
def add_purchase_order():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        PurchaseOrderID = generate_new_id(cursor, "PurchaseOrder", "PurchaseOrderID", "PO")
        Status = flask.request.json.get("Status")
        EmployeeID = flask.request.json.get("EmployeeID")
        SupplierID = flask.request.json.get("SupplierID")
        
        cursor.execute("SELECT PurchaseOrderID FROM PurchaseOrder WHERE PurchaseOrderID = ?", (PurchaseOrderID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "PurchaseOrderID already exist!"}), 400
        cursor.execute("SELECT SupplierID FROM Supplier WHERE SupplierID = ?", (SupplierID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Supplier does not exist!"}), 400
        cursor.execute("SELECT EmployeeID FROM Employee WHERE EmployeeID = ?", (EmployeeID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Employee does not exist!"}), 400
        query = """
                INSERT INTO PurchaseOrder(PurchaseOrderID, SupplierID, EmployeeID,  Status) 
                VALUES(?, ?, ?, ?)
                """
        cursor.execute(query, (PurchaseOrderID, SupplierID, EmployeeID, Status))
        db_conn.commit()

        return flask.jsonify({
            "message": "Success!",
            "PurchaseOrderID": PurchaseOrderID
        }), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_bp.route('/update/<ID>', methods=['PUT'])
def update_purchase_order(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        Status = flask.request.json.get("Status")
        EmployeeID = flask.request.json.get("EmployeeID")
        SupplierID = flask.request.json.get("SupplierID")
        cursor.execute("SELECT SupplierID FROM Supplier WHERE SupplierID = ?", (SupplierID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Supplier does not exist!"}), 400
        cursor.execute("SELECT EmployeeID FROM Employee WHERE EmployeeID = ?", (EmployeeID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Employee does not exist!"}), 400
        
        query = """
                UPDATE PurchaseOrder SET SupplierID = ?, EmployeeID = ?, Status = ?
                WHERE PurchaseOrderID = ?
                """
        cursor.execute(query, (SupplierID, EmployeeID, Status, ID))
        db_conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_purchase_order(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        query = "DELETE FROM PurchaseOrderDetail WHERE PurchaseOrderID = ?"
        cursor.execute(query, (ID,))
        query = "DELETE FROM PurchaseOrder WHERE PurchaseOrderID = ?"
        cursor.execute(query, (ID,))
        db_conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@purchase_order_bp.route('/<ID>/confirm', methods=['POST'])
def confirm_purchase_order(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT Status FROM PurchaseOrder WHERE PurchaseOrderID = ?", (ID,))
        status_list = get_json_results(cursor)
        if not status_list:
            return flask.jsonify({"error": "Not found"}), 404
        if status_list[0]['Status'] == 'Pending Payment':
            return flask.jsonify({"error": "This order has been confirmed before"}), 400
        
        cursor.execute("UPDATE PurchaseOrder SET Status = 'Pending Payment' WHERE PurchaseOrderID = ?", (ID,))
        update_stock_query = """
            UPDATE pv
            SET pv.StockQuantity = pv.StockQuantity + pod.NumOrder
            FROM Productvariant pv
            JOIN PurchaseOrderDetail pod ON pv.ProductVariantID = pod.ProductVariantID
            WHERE pod.PurchaseOrderID = ?
            """
        cursor.execute(update_stock_query, (ID,))
        db_conn.commit()
    
        return flask.jsonify({"message": "Confirmed and stock updated successfully!"}), 200
    except Exception as e:
        if db_conn:
            db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500
    finally:
        if db_conn:
            db_conn.close()

@purchase_order_bp.route('/<ID>/pay', methods=['POST'])
def pay_purchase_order(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT Status FROM PurchaseOrder WHERE PurchaseOrderID = ?", (ID,))
        status_list = get_json_results(cursor)

        if not status_list:
            return flask.jsonify({"error": "Not found"}), 404
        if status_list[0]['Status'] == 'Completed':
            return flask.jsonify({"error": "This order has been payed before"}), 400
        cursor.execute("UPDATE PurchaseOrder SET Status = 'Completed' WHERE PurchaseOrderID = ?", (ID,))
        db_conn.commit()
        return flask.jsonify({"message": "Confirmed and stock updated successfully!"}), 200
    
    except Exception as e:
        if db_conn:
            db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500
    finally:
        if db_conn:
            db_conn.close()
