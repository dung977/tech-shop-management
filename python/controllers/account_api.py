import flask
import uuid
from db_config import get_connection, get_json_results
account_bp = flask.Blueprint('account_bp', __name__)

@account_bp.route('/getall', methods = ['GET'])
def get_all_accounts():
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("select * from Account where isDeleted = 0")
    return flask.jsonify(get_json_results(cursor)), 200

@account_bp.route('/<id>', methods = ['GET'])
def get_account(id):
    db_conn = get_connection()
    cursor = db_conn.cursor()
    cursor.execute("select * from Account where AccountID = ?", (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@account_bp.route('/delete/<id>', methods = ['PUT'])
def delete_account(id):
    try:
        db_conn = get_connection()
        cursor = db_conn.cursor()
        cursor.execute("select AccountID from Account where AccountID = ? and isDeleted = 0", (id,))

        if not cursor.fetchone():
            return flask.jsonify({"mess": "Account does not exist"}), 404
        cursor.execute("update Account set IsDeleted = 1 where AccountID = ?", (id,))

        db_conn.commit()
        return flask.jsonify({"mess": "Account deleted"}), 200
    except Exception as e:
        return flask.jsonify({"mess": str(e)}), 500

@account_bp.route('/search', methods=['POST'])
def search_accounts():
    try:
        keyword = flask.request.args.get('keyword', )
        db_conn = get_connection()
        cursor = db_conn.cursor()
        sql = "select * from Account where IsDeleted = 0 and Username like ? or Role like ?"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400