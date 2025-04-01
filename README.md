# 🤖 DiscordBot – Simple Python Bot for Discord

This is a basic yet powerful **Discord bot** built with [`discord.py`](https://github.com/Rapptz/discord.py).  
It's designed as a lightweight foundation for personal bots, automation, and community features in your Discord server.

---

## 🚀 Features

- 👋 Responds to user commands (e.g. `!hello`)
- 🔁 Event-driven structure using `discord.py`
- 🧱 Modular and easy to extend
- 🧪 Great starting point for learning Discord bot development

---

## 📁 Project Structure

```
discordBot/
├── main.py              # Bot entry point
├── commands/            # (Optional) command modules
├── .env                 # Bot token (not included)
└── README.md
```

---

## ▶️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/edensitko/discordBot.git
cd discordBot
```

### 2. Install dependencies

Make sure you have Python 3.8+ installed.

```bash
pip install -r requirements.txt
```

### 3. Add your Discord bot token

Create a `.env` file in the root directory and add:

```
DISCORD_TOKEN=your_bot_token_here
```

Or you can directly replace `"YOUR_BOT_TOKEN_HERE"` in `main.py`.

### 4. Run the bot

```bash
python main.py
```

---

## 🛠️ Built With

- [discord.py](https://github.com/Rapptz/discord.py) – Python API wrapper for Discord
- [dotenv](https://pypi.org/project/python-dotenv/) – Secure token loading (optional)

---

## 🧠 Example Commands

You can extend the bot with custom commands like:

```python
@client.event
async def on_message(message):
    if message.content == "!hello":
        await message.channel.send("Hello there! 👋")
```

You can also split commands into files under the `commands/` folder for better structure.

---

