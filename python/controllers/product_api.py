import json

import flask
import uuid
from db_config import get_connection, get_json_results, generate_new_id

product_bp = flask.Blueprint('product_bp', __name__)


@product_bp.route('/getall', methods=['GET'])
def get_all_product():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT * FROM Product")
        products = get_json_results(cursor)

        for p in products:
            specs_str = p.get('Information')
            if specs_str:
                try:
                    specs_dict = json.loads(specs_str)
                    for group_name, group_details in specs_dict.items():
                        if isinstance(group_details, dict):
                            for detail_key, detail_value in group_details.items():
                                p[detail_key] = detail_value
                        else:
                            p[group_name] = group_details
                except json.JSONDecodeError:
                    pass
            if 'Information' in p:
                del p['Information']

        return flask.jsonify(products), 200
    except Exception as e:
        if cursor:
            cursor.close()
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/<ID>', methods=['GET'])
def get_product_by_id(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT * FROM Product WHERE ProductID = ?", (ID,))
        products = get_json_results(cursor)
        if not products:
            return flask.jsonify({"message": "Product not found!"}), 404

        product = products[0]
        specs_str = product.get('Information')
        if specs_str:
            try:
                specs_dict = json.loads(specs_str)
                for group_name, group_details in specs_dict.items():
                    if isinstance(group_details, dict):
                        for detail_key, detail_value in group_details.items():
                            product[detail_key] = detail_value
                    else:
                        product[group_name] = group_details
            except json.JSONDecodeError:
                pass
        if 'Information' in product:
            del product['Information']

        return flask.jsonify(product), 200
    except Exception as e:
        if cursor:
            cursor.close()
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/add', methods=['POST'])
def add_product():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        ProductID = generate_new_id(cursor, "Product", "ProductID", "PROD")

        ProductName = flask.request.json.get("ProductName")
        Brand = flask.request.json.get("Brand")
        CategoryID = flask.request.json.get("CategoryID")
        # Đã đổi thành Images để Frontend truyền lên cho chuẩn
        Images = flask.request.json.get("Images")
        info_dict = flask.request.json.copy()

        main_columns = ["ProductID", "ProductName", "Brand", "CategoryID", "Images"]

        for col in main_columns:
            info_dict.pop(col, None)

        Information = json.dumps(info_dict, ensure_ascii=False) if info_dict else None

        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "ProductID already exists!"}), 400

        cursor.execute("SELECT CategoryID FROM Category WHERE CategoryID = ?", (CategoryID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Category does not exist!"}), 400

        # SỬA LỖI: Cột Images (có s)
        query = """
                INSERT INTO Product (ProductID, ProductName, Brand, Images, Information, CategoryID) 
                VALUES (?, ?, ?, ?, ?, ?)
                """

        cursor.execute(query, (ProductID, ProductName, Brand, Images, Information, CategoryID))
        db_conn.commit()
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/update/<ID>', methods=['PUT'])
def update_product(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        ProductName = flask.request.json.get("ProductName")
        Brand = flask.request.json.get("Brand")
        CategoryID = flask.request.json.get("CategoryID")
        Images = flask.request.json.get("Images")

        info_dict = flask.request.json.copy()
        main_columns = ["ProductID", "ProductName", "Brand", "CategoryID", "Images"]
        for col in main_columns:
            info_dict.pop(col, None)

        Information = json.dumps(info_dict, ensure_ascii=False) if info_dict else None

        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Product not found!"}), 404

        cursor.execute("SELECT CategoryID FROM Category WHERE CategoryID = ?", (CategoryID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Category does not exist!"}), 400

        # SỬA LỖI: Cột Images (có s)
        query = """
                UPDATE Product 
                SET ProductName = ?, Brand = ?, Images = ?, Information = ?, CategoryID = ?
                WHERE ProductID = ?
                """
        cursor.execute(query, (ProductName, Brand, Images, Information, CategoryID, ID))
        db_conn.commit()
        
        return flask.jsonify({"message": "Update Success!"}), 200

    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/delete/<ID>', methods=['DELETE'])
def delete_product(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        query = "DELETE FROM Productvariant WHERE ProductID = ?"
        cursor.execute(query, (ID,))
        query = "DELETE FROM Product WHERE ProductID = ?"
        cursor.execute(query, (ID,))
        db_conn.commit()

        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/<ID>/variants', methods=['GET'])
def get_product_variant(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        query = """
                SELECT * FROM Productvariant pv 
                JOIN Product pro ON pv.ProductID = pro.ProductID 
                WHERE pv.ProductID = ? AND pv.IsDeleted = 0
                """
        cursor.execute(query, (ID,))
        variants = get_json_results(cursor)

        if not variants:
            cursor.close()
            return flask.jsonify({"message": "Can't find this product!"}), 404

        for v in variants:
            info_str = v.get('Information')
            if info_str:
                try:
                    info_dict = json.loads(info_str)
                    if isinstance(info_dict, dict):
                        for group_name, group_details in info_dict.items():
                            if isinstance(group_details, dict):
                                for detail_key, detail_value in group_details.items():
                                    v[detail_key] = detail_value if detail_value is not None else ""
                            else:
                                v[group_name] = group_details if group_details is not None else ""
                except json.JSONDecodeError:
                    pass
            if 'Information' in v:
                del v['Information']

            desc_str = v.get('Description')
            if desc_str:
                try:
                    desc_dict = json.loads(desc_str)
                    if isinstance(desc_dict, dict):
                        for group_name, group_details in desc_dict.items():
                            if isinstance(group_details, dict):
                                for detail_key, detail_value in group_details.items():
                                    v[detail_key] = detail_value if detail_value is not None else ""
                            else:
                                v[group_name] = group_details if group_details is not None else ""
                except json.JSONDecodeError:
                    pass
            if 'Description' in v:
                del v['Description']

        cursor.close()
        return flask.jsonify(variants), 200

    except Exception as e:
        if cursor:
            cursor.close()
        return flask.jsonify({"error": str(e)}), 500


@product_bp.route('/search', methods=['POST'])
def search_products():
    try:
        keyword = flask.request.args.get('keyword', '')
        db_conn = get_connection()
        cursor = db_conn.cursor()

        sql = """
              SELECT * \
              FROM Product
              WHERE ProductID LIKE ?
                 OR ProductName LIKE ?
                 OR Brand LIKE ?
                 OR Information LIKE ? \
              """
        search_term = f"%{keyword}%"

        cursor.execute(sql, (search_term, search_term, search_term, search_term))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400