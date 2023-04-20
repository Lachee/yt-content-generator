# yt-content-generator
For those who are unoriginal

# usage
Will pull a top article from reddit
```
pnpm i
pnpm start
```

Oh yeah you will need some keys and stuff. Mostly a google client_secrets.json you get from an oAuth2 credential, and a .env with teh following:
```
GOOGLE_CREDENTIAL_PATH=./client_secret.json
GOOGLE_API_KEY=<google api key>
GOOGLE_FOLDER=<google drive folder id (optional)>
PEXELS_KEY=<pexels key for stock video>
CHATGPT_KEY=<chat gpt key for moderation (optional)>

OUTPUT_DIR=outputs                      # Location of files
HISTORY_FILE=outputs/history.txt        # History so it doesnt repeat
```

# License
This is not licensed, you may not use it other than research purposes.
- Do not use this to make actual shorts
- Do not sell any content generated 
- Do not upload any content generated
- You use at your own risk
- You may not sell or distribute this software
- I retain sole propriatary rights to this software

TL;DR it's still my code im just sharing it as a reference.
