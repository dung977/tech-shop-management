import pandas as pd
import flask
import uuid
from db_config import get_connection, get_json_results, generate_new_id

customer_bp = flask.Blueprint('customer_bp', __name__)
@customer_bp.route('/getall', methods=['GET'])
def get_all_customers():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('SELECT * FROM Customer where IsDeleted = 0')
    return flask.jsonify(get_json_results(cursor)), 200

@customer_bp.route('/<id>', methods = ['GET'])
def get_customer(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute('select * from Customer where CustomerID = ? and IsDeleted= 0', (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@customer_bp.route('/add', methods = ['POST'])
def add_customer():
    try:
        db_conn = get_connection()
        cursor = db_conn.cursor()
        customer_id = generate_new_id(cursor, "Customer", "CustomerID", "CUS")
        account_id = generate_new_id(cursor, "Account", "AccountID", "ACC")
        username = flask.request.json.get("Username")
        password = flask.request.json.get("Password")
        fullname = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        address = flask.request.json.get("Address")

        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("select AccountID from Account where Username = ?", (username,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Username already exists"}), 400
        cursor.execute("select CustomerID from Customer where Phone = ?", (phone,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Phone already exists"}), 400
        cursor.execute("select CustomerID from Customer where Email = ?", (email,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Email already exists"}), 400

        sql_customer = "insert into Customer(CustomerID, FullName, Phone, Email, Address) values (?, ?, ?, ?, ?)"
        cursor.execute(sql_customer, (customer_id, fullname, phone, email, address))
        sql_account = "insert into Account(AccountID, Username, Password, Role, IsActive, CustomerID) values (?,?,?, 'Customer', 1,?)"
        cursor.execute(sql_account, (account_id, username, password, customer_id))
        db_conn.commit()
        return flask.jsonify({
            "mess": "Add Successful",
            "CustomerID": customer_id,
            "AccountID": account_id
        }), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500


@customer_bp.route('/update/<id>', methods = ['PUT'])
def update_customer(id):
    try:
        full_name = flask.request.json.get("FullName")
        phone = flask.request.json.get("Phone")
        email = flask.request.json.get("Email")
        address = flask.request.json.get("Address")
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("update Customer set FullName = ?, Phone = ?, Email = ?, Address = ? where CustomerID = ? and IsDeleted = 0", (full_name, phone, email, address, id))
        db_conn.commit()
        return flask.jsonify({"mess": "Update successful"}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@customer_bp.route('/delete/<id>', methods = ['PUT'])
def delete_customer(id):
    try:
        customer_id = id
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute('select top 1 BillID from Bill where CustomerID = ?', (customer_id,))
        if cursor.fetchone():
            return flask.jsonify({"mess": "Cannot delete! This customer already has invoice history"}), 400

        cursor.execute("update Account set IsDeleted =1 where CustomerID = ?", (customer_id,))
        cursor.execute("update Customer set IsDeleted =1 where CustomerID = ?", (customer_id,))
        db_conn.commit()
        return flask.jsonify({"mess": "Delete successful"}), 200
    except Exception as e:
        db_conn.rollback()
        return flask.jsonify({"error": str(e)}), 500

@customer_bp.route('/search', methods=['POST'])
def search_customers():
    try:
        keyword = flask.request.args.get('keyword','' )
        db_conn = get_connection()
        cursor = db_conn.cursor()
        sql = "select * from Customer where IsDeleted = 0 and FullName like ? or Phone like ? or Email like ? "
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term, search_term, ))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400
    
@customer_bp.route('/import', methods=['POST'])
def import_customer():
    file = flask.request.files.get('file')
    if not file or file.filename == '':
        return flask.jsonify({"message": "File is not selected!"}), 400
    
    if not file.filename.endswith(('.xls', '.xlsx')):
        return flask.jsonify({"message": "Invalid file format. Please upload an Excel file."}), 400
    
    cursor = db_conn.cursor()
    try:
        df = pd.read_excel(file)        
        df = df[df['FullName'].notna()]        
        df = df.where(pd.notnull(df), None)
        
        query = """
                INSERT INTO Customer (CustomerID, FullName, Phone, Email, Address)
                VALUES (?, ?, ?, ?, ?)
                """
        
        data_to_insert = []
        for _, row in df.iterrows():
            customer_id = "CUS_" + str(uuid.uuid4())[:6]
            data_to_insert.append((
                customer_id,
                row.get('FullName'),
                row.get('Phone'),
                row.get('Email'),
                row.get('Address')
            ))
            
        cursor.executemany(query, data_to_insert)        
        db_conn.commit() 
        
        return flask.jsonify({
            "message": "Success!", 
            "total_inserted": len(data_to_insert)
        }), 200
        
    except Exception as e:
        db_conn.rollback() 
        return flask.jsonify({"error": {str(e)}}), 500
    finally:
        cursor.close()
