import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "database": "gaming-hub",
    "user": "srimithun",
    "password": "srimithun123",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)