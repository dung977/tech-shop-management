import flask
import uuid
import json
from db_config import get_connection, get_json_results

variant_bp = flask.Blueprint('variant_bp', __name__)

@variant_bp.route('/getall', methods=['GET'])
def get_all_variant():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT * FROM ProductVariant")
        variants = get_json_results(cursor)

        # MẸO KIỂM TRA: In ra console để xem lấy được bao nhiêu dòng
        print(f"DEBUG: Lay duoc {len(variants) if variants else 0} variants")

        if not variants:
            cursor.close()
            return flask.jsonify([]), 200

        for v in variants:
            # Ép kiểu an toàn
            if v.get('SellingPrice') is not None:
                v['SellingPrice'] = float(v['SellingPrice'])
            if v.get('StockQuantity') is not None:
                v['StockQuantity'] = int(v['StockQuantity'])

            # Xử lý Description cực kỳ cẩn thận
            specs_str = v.get('Description')
            if specs_str:
                try:
                    # Chỉ giải mã nếu nó trông giống JSON (bắt đầu bằng { )
                    if specs_str.strip().startswith('{'):
                        specs_dict = flask.json.loads(specs_str)
                        if isinstance(specs_dict, dict):
                            for key, value in specs_dict.items():
                                v[key] = value
                    else:
                        # Nếu là text thuần (như "8GB 128GB"), cho vào một key tạm
                        v['Note'] = specs_str
                except:
                    pass

            if 'Description' in v:
                del v['Description']

        cursor.close()
        return flask.jsonify(variants), 200

    except Exception as e:
        if cursor: cursor.close()
        # DÒNG NÀY SẼ GIÚP ÔNG BIẾT CHÍNH XÁC LỖI GÌ TRÊN TRÌNH DUYỆT
        import traceback
        print(traceback.format_exc())  # In lỗi chi tiết ra terminal đen
        return flask.jsonify({"error": str(e), "detail": "Xem terminal Flask"}), 500

@variant_bp.route('/<ID>', methods=['GET'])
def get_variant_by_id(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute("SELECT * FROM ProductVariant WHERE ProductVariantID = ?", (ID,))
        variants = get_json_results(cursor)


        # Tránh lỗi văng Index Out Of Range ở dòng variants[0]
        if not variants:
            cursor.close()
            return flask.jsonify({"message": "Không tìm thấy biến thể!"}), 404

        variant = variants[0]

        #  Ép kiểu Số/Decimal sang Float/Int để jsonify không sập
        if 'SellingPrice' in variant and variant['SellingPrice'] is not None:
            variant['SellingPrice'] = float(variant['SellingPrice'])

        if 'StockQuantity' in variant and variant['StockQuantity'] is not None:
            variant['StockQuantity'] = int(variant['StockQuantity'])

        #Xử lý chuỗi an toàn cho Description
        specs_str = variant.get('Description')
        if specs_str:
            try:
                specs_dict = flask.json.loads(specs_str)
                # Check chắc cốp nó là Dict thì mới lặp
                if isinstance(specs_dict, dict):
                    for group_name, group_details in specs_dict.items():
                        if isinstance(group_details, dict):
                            for detail_key, detail_value in group_details.items():
                                variant[detail_key] = detail_value
                        else:
                            variant[group_name] = group_details
            except Exception:  # Đổi thành Exception chung để bắt tuốt mọi lỗi ép kiểu text
                pass

                # Xóa cái cột gốc đi sau khi đã tách key
        if 'Description' in variant:
            del variant['Description']

        cursor.close()

        # SỬA NHẸ: Nên trả về biến 'variant' (1 object) thay vì 'variants' (1 mảng)
        return flask.jsonify(variant), 200

    except Exception as e:
        if cursor:
            cursor.close()
        return flask.jsonify({"error": str(e)}), 500
@variant_bp.route('/add', methods=['POST'])
def add_variant():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        ProductVariantID = generate_new_id(cursor, "ProductVariant", "ProductVariantID", "VAR")
        ProductID = flask.request.json.get("ProductID")
        Color = flask.request.json.get("Color")
        StockQuantity = flask.request.json.get("StockQuantity")
        SellingPrice = flask.request.json.get("SellingPrice")
        Image = flask.request.json.get("Image")
        IsDeleted = flask.request.json.get("IsDeleted")
        Status = flask.request.json.get("Status")
        des_dict = flask.request.json.copy()
        
        main_columns = ["ProductVariantID", "ProductID", "Color", "SellingPrice", "StockQuantity", "IsDeleted", "Image", "Status"]
        
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
                StockQuantity, Description, IsDeleted, Image, Status) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
        cursor.execute(query, (ProductVariantID, ProductID, Color, SellingPrice, StockQuantity, Description, IsDeleted, Image, Status))
        db_conn.commit()
        return flask.jsonify({"message": "Success!"}), 201
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500

@variant_bp.route('/update/<ID>', methods=['PUT'])
def update_variant(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        ProductID = flask.request.json.get("ProductID")
        cursor.execute("SELECT ProductID FROM Product WHERE ProductID = ?", (ProductID,))
        if not cursor.fetchone():
            return flask.jsonify({"message": "Product does not exist!"}), 400
        Color = flask.request.json.get("Color")
        StockQuantity = flask.request.json.get("StockQuantity")
        SellingPrice = flask.request.json.get("SellingPrice")
        Image = flask.request.json.get("Image")
        Status = flask.request.json.get("Status")
        
        des_dict = flask.request.json.copy()
        
        main_columns = ["ProductVariantID", "ProductID", "Color", "SellingPrice", "StockQuantity", "IsDeleted", "Image", "Status"]
        
        for col in main_columns:
            des_dict.pop(col, None)

        Description = flask.json.dumps(des_dict, ensure_ascii=False) if des_dict else None      

        query = """
                UPDATE Productvariant SET ProductID = ?, Color = ?,
                SellingPrice = ?, StockQuantity = ?, Description = ?, Image = ?, Status = ?
                WHERE ProductVariantID = ?
                """
        cursor.execute(query, (ProductID, Color, SellingPrice, StockQuantity, Description, Image, Status, ID))
        db_conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@variant_bp.route('/delete/<ID>', methods=['PUT'])
def delete_variant(ID):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    try:
        query = "UPDATE Productvariant SET IsDeleted = 1 WHERE ProductVariantID = ?"
        cursor.execute(query, (ID,))
        db_conn.commit()
        
        return flask.jsonify({"message": "Success!"}), 200
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500
