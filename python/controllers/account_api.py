import flask
import uuid
from db_config import conn, get_json_results

account_bp = flask.Blueprint('account_bp', __name__)

@account_bp.route('/getall', methods = ['GET'])
def get_all_accounts():
    cursor = conn.cursor()
    cursor.execute("select * from Account where IsDeleted = 0")
    return flask.jsonify(get_json_results(cursor)), 200

@account_bp.route('/<id>', methods = ['GET'])
def get_account(id):
    cursor = conn.cursor()
    cursor.execute("select * from Account where AccountID = ? and IsDeleted = 0", (id,))
    return flask.jsonify(get_json_results(cursor)), 200

@account_bp.route('/delete/<id>', methods = ['PUT'])
def delete_account(id):
    try:
        cursor = conn.cursor()
        cursor.execute("update Account set IsDeleted = 1 where AccountID = ?", (id,))
        conn.commit()
        return flask.jsonify({"mess": "Account deleted"}), 200
    except Exception as e:
        return flask.jsonify({"mess": str(e)}), 500

@account_bp.route('/search', methods=['POST'])
def search_accounts():
    try:
        keyword = flask.request.args.get('keyword', )
        cursor = conn.cursor()
        sql = "select * from Account where Username like ? or Role like ? and IsDeleted = 0"
        search_term = f"%{keyword}%"
        cursor.execute(sql, (search_term, search_term,))
        return flask.jsonify(get_json_results(cursor)), 200
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 400