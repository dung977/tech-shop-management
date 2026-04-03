import pyodbc

con_str = (
    "Driver={SQL Server};"
    "Server=localhost\\SQLEXPRESS;"
    "Database=Dulieu;"
    "Trusted_Connection=yes;"
)
conn = pyodbc.connect(con_str) 
def get_json_results(cursor):
    res = []
    keys = [i[0] for i in cursor.description]
    for val in cursor.fetchall():
        res.append(dict(zip(keys, val)))
    return res


def generate_new_id(cursor, table_name, column_name, prefix):
    query = f"SELECT TOP 1 {column_name} FROM {table_name} ORDER BY LEN({column_name}) DESC, {column_name} DESC"
    cursor.execute(query)
    result = cursor.fetchone()

    if result:
        last_id = result[0]
        last_num = int(last_id.replace(prefix, ""))
        new_num = last_num + 1
    else:
        new_num = 1
    new_id = f"{prefix}{new_num:02d}"

    return new_id