from discord_webhook import DiscordWebhook
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, render_template, redirect, url_for

app = Flask(__name__)

#initialize db and discord url
DB = 'project.db'
discord_webhook_url = 'https://discord.com/api/webhooks/1311759381519663134/VyuHh3PJmIF0m3s2pyowMBCXuDxm6OAqaj3CMODHoWEuk3tJxAK-Fd8_9Yp0vu9kLDLT'


#connect the db
def get_db():
    conn = sqlite3.connect(DB)
    return conn

#messages table
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
    conn.close()

#init main route
@app.route('/')
def index():
    return render_template('index.html')

#post messages
@app.route('/message', methods=['POST'])
def message():
    try:
        text = request.form.get('text')
        
        if not text:
            return render_template('redirect.html', status='error')
        
        discordMessage(text)
        save_to_database(text)

        return render_template('redirect.html')
        
    except Exception as e:
        return render_template('redirect.html', status='error')

#save to discord
def discordMessage(text):
    webhook = DiscordWebhook(url=discord_webhook_url, content=text)
    webhook.execute()

#save text to the db
def save_to_database(text):
    conn = get_db()
    cursor = conn.cursor()
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('INSERT INTO messages (content, timestamp) VALUES (?, ?)', (text, current_time))
    conn.commit()
    conn.close()

#display recent messages
@app.route('/get_all_messages')
def messages():
    cutoff_time = datetime.now() - timedelta(minutes=30)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT content, timestamp FROM messages WHERE timestamp >= ?', (cutoff_time,))
    messages = cursor.fetchall()
    conn.close()

    #sort messages
    sorted_messages = sorted(messages, key=lambda msg: datetime.strptime(msg[1], "%Y-%m-%d %H:%M:%S"), reverse=True)

    return render_template('messages.html', messages=sorted_messages)


create_table()

if __name__ == '__main__':
    app.run(debug=True)
