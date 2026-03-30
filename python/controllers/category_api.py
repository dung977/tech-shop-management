import flask
import uuid
from db_config import conn, get_json_results

category_bp = flask.Blueprint('category_bp', __name__)

@category_bp.route('/getall', methods=['GET'])
def get_all_category():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Category")
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't get all category!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@category_bp.route('/<ID>', methods=['GET'])
def get_category_by_id(ID):
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM Category ct WHERE ct.CategoryID = ?"
        cursor.execute(query, (ID,))
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message": "Can't find this category!"}), 404
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@category_bp.route('/add', methods=['POST'])
def add_categories():
    cursor = conn.cursor()
    try:
        CategoryID = "CAT_" + str(uuid.uuid4())[:6]
        Name = flask.request.json.get("Name")
        cursor.execute("SELECT CategoryID FROM Category WHERE CategoryID = ?", (CategoryID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "CategoryID already exists!"}), 400
        query = "INSERT INTO Category(CategoryID, Name) VALUES(?, ?)"
        cursor.execute(query, (CategoryID, Name))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@category_bp.route('/update/<ID>', methods=['PUT'])
def update_category(ID):
    cursor = conn.cursor()
    try:
        Name = flask.request.json.get("Name")
        query = "UPDATE Category SET Name = ? WHERE CategoryID = ?"
        cursor.execute(query, (Name, ID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@category_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_category(ID):
    cursor = conn.cursor()
    try:
        query = "DELETE FROM Category WHERE CategoryID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@category_bp.route('/search', methods=['POST'])
def search_categories():
    try:
        keyword = flask.request.args.get('keyword', )
        cursor = conn.cursor()
        sql = "select * from Category where Name like ?"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400
        
@category_bp.route('/getall/products/<name>', methods=['GET'])
def get_product_by_category(name):
    cursor = conn.cursor()
    try:
        query = """
                SELECT * FROM Category ct 
                JOIN Product pr ON ct.CategoryID = pr.CategoryID
                WHERE Name = ?
                """
        cursor.execute(query, (name,))
        res = get_json_results(cursor)
        if res:
            return flask.jsonify(res), 200
        else:
            return flask.jsonify({"message":"Can't find any product in that category!"}), 400
    except Exception as e:
        return flask.jsonify({"error":str(e)}), 500
