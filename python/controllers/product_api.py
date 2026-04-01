import flask
import uuid
from db_config import conn, get_json_results

product_bp = flask.Blueprint('product_bp', __name__)

@product_bp.route('/getall', methods=['GET'])
def get_all_product():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Product")
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all product!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@product_bp.route('/<ID>', methods=['GET'])
def get_product_by_id(ID):
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM Product pr WHERE pr.ProductID = ?"
        cursor.execute(query, (ID,))
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't find this product!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/add', methods=['POST'])
def add_product():
    cursor = conn.cursor()
    try:
        ProductID = "PRO_" + str(uuid.uuid4())[:6]
        ProductName = flask.request.json.get("ProductName")
        Brand = flask.request.json.get("Brand")
        CategoryID = flask.request.json.get("CategoryID")
        Image = flask.request.json.get("Image")
        Information = flask.request.json.get("Information")
        Status = flask.request.json.get("Status")
        
        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "ProductID already exists!"}), 400
        cursor.execute("SELECT ProductName FROM Product WHERE ProductName = ?", (ProductName,))
        if cursor.fetchone():
            return flask.jsonify({"message": "Product name already exist!"}), 400
        cursor.execute("SELECT CategoryID FROM Product WHERE CategoryID = ?", (CategoryID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Category does not exist!"}), 400
        query = """
                INSERT INTO Product(ProductID, ProductName, Brand, 
                Image, Information, Status, CategoryID) 
                VALUES(?, ?, ?, ?, ?, ?, ?)
                """
        cursor.execute(query, (ProductID, ProductName, Brand, Image, Information, Status, CategoryID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/update/<ID>', methods=['PUT'])
def update_product(ID):
    cursor = conn.cursor()
    try:
        ProductName = flask.request.json.get("ProductName")
        Brand = flask.request.json.get("Brand")
        Image = flask.request.json.get("Image")
        CategoryID = flask.request.json.get("CategoryID")

        cursor.execute("SELECT CategoryID FROM Product WHERE CategoryID = ?", (CategoryID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Category does not exist!"}), 400
        Information = flask.request.json.get("Information")
        Status = flask.request.json.get("Status")
        query = """
                UPDATE Product SET ProductName = ?, Brand = ?, Image = ?,
                Information = ?, Status = ?, CategoryID = ?
                WHERE ProductID = ?
                """
        cursor.execute(query, (ProductName, Brand, Image, Information, Status, CategoryID, ID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_product(ID):
    cursor = conn.cursor()
    try:       
        query = "DELETE FROM Productvariant WHERE ProductID = ?"
        cursor.execute(query, (ID,))
        query = "DELETE FROM Product WHERE ProductID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
    
@product_bp.route('/<ID>/variants', methods=['GET'])
def get_product_variant(ID):
    cursor = conn.cursor()
    try:
        query = """
                SELECT * FROM Productvariant pv 
                JOIN Product pro ON pv.ProductID = pro.ProductID 
                WHERE pv.ProductID = ?
                """
        cursor.execute(query, (ID,))
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message":"Can't find this product variant!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
    
@product_bp.route('/search', methods=['POST'])
def search_products():
    try:
        keyword = flask.request.args.get('keyword', )
        cursor = conn.cursor()
        sql = "select * from Product where ProductName like ? or Brand like ? or Information like ? or Status like ?"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term, search_term, search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400
