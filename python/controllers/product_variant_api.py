import flask
import uuid
from db_config import conn, get_json_results

variant_bp = flask.Blueprint('variant_bp', __name__)

@variant_bp.route('/getall', methods=['GET'])
def get_all_variant():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Productvariant")
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all product variant!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@variant_bp.route('/<ID>', methods=['GET'])
def get_variant_by_id(ID):
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM Productvariant WHERE ProductVariantID = ?"
        cursor.execute(query, (ID,))
        res = get_json_results(cursor)
        return flask.jsonify(res), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@variant_bp.route('/add', methods=['POST'])
def add_variant():
    cursor = conn.cursor()
    try:
        ProductVariantID = "VAR_" + str(uuid.uuid4())[:6]
        ProductID = flask.request.json.get("ProductID")
        Color = flask.request.json.get("Color")
        StockQuantity = flask.request.json.get("StockQuantity")
        SellingPrice = flask.request.json.get("SellingPrice")
        Description = flask.request.json.get("SellingPrice")
        isDelete = 0

        cursor.execute("SELECT ProductVariantID FROM ProductVariant WHERE ProductVariantID = ?", (ProductVariantID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "ProductVariantID already exist!"}), 400
        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Product does not exist!"}), 400
        
        query = """
                INSERT INTO ProductVariant(ProductVariantID, ProductID, Color,  
                SellingPrice, StockQuantity, Description, isDelete) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """
        cursor.execute(query, (ProductVariantID, ProductID, Color, SellingPrice, StockQuantity, Description, isDelete))
        conn.commit()   
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@variant_bp.route('/update/<ID>', methods=['PUT'])
def update_variant(ID):
    cursor = conn.cursor()
    try:
        ProductID = flask.request.json.get("ProductID")
        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Product does not exist!"}), 400
        Color = flask.request.json.get("Color")
        StockQuantity = flask.request.json.get("StockQuantity")
        SellingPrice = flask.request.json.get("SellingPrice")
        Description = flask.request.json.get("Description")

        query = """
                UPDATE Productvariant SET ProductID = ?, Color = ?,
                SellingPrice = ?, StockQuantity = ?, Description = ?
                WHERE ProductVariantID = ?
                """
        cursor.execute(query, (ProductID, Color, SellingPrice, StockQuantity, Description, ID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@variant_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_variant(ID):
    cursor = conn.cursor()
    try:
        query = "UPDATE FROM Productvariant SET isDelete = 1 WHERE ProductVariantID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
