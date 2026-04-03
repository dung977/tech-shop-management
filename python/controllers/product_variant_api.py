import flask
import uuid
import json
from db_config import conn, get_json_results, generate_new_id

variant_bp = flask.Blueprint('variant_bp', __name__)

@variant_bp.route('/getall', methods=['GET'])
def get_all_variant():
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM ProductVariant")
        variants = get_json_results(cursor)
        
        for v in variants:
            specs_str = v.get('Description')
            if specs_str:
                try:
                    specs_dict = flask.json.loads(specs_str)
                    for group_name, group_details in specs_dict.items():
                        if isinstance(group_details, dict):
                            for detail_key, detail_value in group_details.items():
                                v[detail_key] = detail_value
                        else:
                            v[group_name] = group_details
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

@variant_bp.route('/<ID>', methods=['GET'])
def get_variant_by_id(ID):
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM ProductVariant WHERE ProductVariantID = ?", (ID,))
        variants = get_json_results(cursor)
        variant = variants[0]
        specs_str = variant.get('Description')
        if specs_str:
            try:
                specs_dict = flask.json.loads(specs_str)
                for group_name, group_details in specs_dict.items():
                    if isinstance(group_details, dict):
                        for detail_key, detail_value in group_details.items():
                            variant[detail_key] = detail_value
                    else:
                        variant[group_name] = group_details
            except json.JSONDecodeError:
                pass 
            if 'Description' in variant:
                del variant['Description']
                
        cursor.close()
        return flask.jsonify(variants), 200
        
    except Exception as e:
        if cursor:
            cursor.close()
        return flask.jsonify({"error": str(e)}), 500

@variant_bp.route('/add', methods=['POST'])
def add_variant():
    cursor = conn.cursor()
    try:
        ProductVariantID = generate_new_id(cursor, "ProductVariant", "ProductVariantID", "VAR")
        ProductID = flask.request.json.get("ProductID")
        Color = flask.request.json.get("Color")
        StockQuantity = flask.request.json.get("StockQuantity")
        SellingPrice = flask.request.json.get("SellingPrice")
        Images = flask.request.json.get("Images")
        IsDeleted = flask.request.json.get("IsDeleted")
        Status = flask.request.json.get("Status")
        des_dict = flask.request.json.copy()
        
        main_columns = ["ProductVariantID", "ProductID", "Color", "SellingPrice", "StockQuantity", "IsDeleted", "Images", "Status"]
        
        for col in main_columns:
            des_dict.pop(col, None)

        Description = flask.json.dumps(des_dict, ensure_ascii=False) if des_dict else None        
        
        cursor.execute("SELECT ProductVariantID FROM ProductVariant WHERE ProductVariantID = ?", (ProductVariantID,))
        if cursor.fetchone():
            return flask.jsonify({"message": "ProductVariantID already exist!"}), 400
        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Product does not exist!"}), 400
        
        query = """
                INSERT INTO ProductVariant(ProductVariantID, ProductID, Color, SellingPrice,
                StockQuantity, Description, IsDeleted, Images, Status) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
        cursor.execute(query, (ProductVariantID, ProductID, Color, SellingPrice, StockQuantity, Description, IsDeleted, Images, Status))
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
        Images = flask.request.json.get("Images")
        Status = flask.request.json.get("Status")
        
        des_dict = flask.request.json.copy()
        
        main_columns = ["ProductVariantID", "ProductID", "Color", "SellingPrice", "StockQuantity", "IsDeleted", "Images", "Status"]
        
        for col in main_columns:
            des_dict.pop(col, None)

        Description = flask.json.dumps(des_dict, ensure_ascii=False) if des_dict else None      

        query = """
                UPDATE Productvariant SET ProductID = ?, Color = ?,
                SellingPrice = ?, StockQuantity = ?, Description = ?, Images = ?, Status = ?
                WHERE ProductVariantID = ?
                """
        cursor.execute(query, (ProductID, Color, SellingPrice, StockQuantity, Description, Images, Status, ID))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@variant_bp.route('/delete/<ID>', methods=['PUT'])
def delete_variant(ID):
    cursor = conn.cursor()
    try:
        query = "UPDATE Productvariant SET IsDeleted = 1 WHERE ProductVariantID = ?"
        cursor.execute(query, (ID,))
        conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
