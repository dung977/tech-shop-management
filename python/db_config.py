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