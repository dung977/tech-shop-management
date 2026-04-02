import flask
import uuid
from db_config import conn, get_json_results

supplier_bp = flask.Blueprint('supplier_bp', __name__)

@supplier_bp.route('/getall', methods=['GET'])
def get_all_supplier():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Supplier where IsDeleted = 0")
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all supplier!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@supplier_bp.route('/add', methods=['POST'])
def add_supplier():
    cursor = conn.cursor()
    try:
        SupplierID = "SUP_" + str(uuid.uuid4())[:6]
        SupplierName = flask.request.json.get("SupplierName")
        Address = flask.request.json.get("Address")
        Phone = flask.request.json.get("Phone")
        Email = flask.request.json.get("Email")
        isDeleted = flask.request.json.get("IsDeleted")
        cursor.execute("SELECT SupplierID FROM Supplier WHERE SupplierID = ?", (SupplierID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "SupplierID already exist!"}), 400
        cursor.execute("SELECT SupplierName FROM Supplier WHERE SupplierName = ?", (SupplierName,))
        if cursor.fetchone():
            return flask.jsonify({"message": "Supplier name already exist!"}), 400
        query = """
                INSERT INTO Supplier(SupplierID, SupplierName, Address, Phone, Email, IsDeleted)
                VALUES(?, ?, ?, ?, ?, ?)
                """
        cursor.execute(query, (SupplierID, SupplierName, Address, Phone, Email, isDeleted))
        conn.commit()
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@supplier_bp.route('/update/<ID>', methods=['PUT'])
def update_supplier(ID):
    cursor = conn.cursor()
    try:
        SupplierName = flask.request.json.get("SupplierName")
        Address = flask.request.json.get("Address")
        Phone = flask.request.json.get("Phone")
        Email = flask.request.json.get("Email")
        query = "UPDATE Supplier SET SupplierName = ?, Address = ?, Phone = ?, Email = ? WHERE SupplierID = ?"
        query = "UPDATE Supplier SET, SupplierName = ?, Address = ?, Phone = ?, Email = ? WHERE IsDeleted = 0 and SupplierID = ?"
        cursor.execute(query, (SupplierName, Address, Phone, Email, ID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@supplier_bp.route('/delete/<ID>', methods=['PUT'])
def delete_supplier(ID):
    cursor = conn.cursor()
    try:
        query = "UPDATE Supplier SET IsDeleted = 1 WHERE SupplierID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
@supplier_bp.route('/search', methods=['POST'])
def search_suppliers():
    try:
        keyword = flask.request.args.get('keyword', )
        cursor = conn.cursor()
        sql = "select * from Supplier where SupplierName like ? or Address like ? or Email like ? or Phone like ?"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term, search_term, search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400
