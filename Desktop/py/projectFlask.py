from flask import Flask, request, jsonify, render_template
from discord_webhook import DiscordWebhook

import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)

#database setup
DB = 'project.db'

def get_db():
    conn = sqlite3.connect(DB)
    return conn

# create the messages table 
def create_table():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            timestamp DATETIME
        )
    ''')
    conn.commit()

discord_webhook_url = 'https://discord.com/api/webhooks/1311759381519663134/VyuHh3PJmIF0m3s2pyowMBCXuDxm6OAqaj3CMODHoWEuk3tJxAK-Fd8_9Yp0vu9kLDLT'

@app.route('/message', methods=['POST'])
def message():
    try:
        # Check if the request is JSON or form-encoded
        if request.is_json:
            data = request.get_json()
        else:
            # Handle form data if not JSON
            data = request.form
        
        text = data.get('text') 
        
        # Validate text input
        if not text:
            return jsonify({"status": "error", "message": "Text is required"}), 400
        
        # Send text to Discord server (Endpoint 2)
        send_to_discord(text)
        
        # Save text to SQLite database (store messages)
        save_to_database(text)
        
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Endpoint 2 - Discord Integration: Sends the text to Discord
def send_to_discord(text):
    webhook = DiscordWebhook(url=discord_webhook_url, content=text)
    webhook.execute()

# Save the received text to SQLite database
def save_to_database(text):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO messages (content, timestamp) VALUES (?, ?)', (text, datetime.now()))
    conn.commit()

@app.route('/get_all_messages', methods=['GET'])
def get_messages():
    try:
        cutoff_time = datetime.now() - timedelta(minutes=30)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT content, timestamp FROM messages WHERE timestamp >= ?', (cutoff_time,))
        messages = cursor.fetchall()
        
        # Format messages for response
        message_data = [{"content": msg[0], "timestamp": msg[1]} for msg in messages]
        
        return jsonify({"status": "success", "messages": message_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Serving the HTML page
@app.route('/')
def index():
    return render_template('index.html')

# Initialize the database when the app starts
create_table()

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
