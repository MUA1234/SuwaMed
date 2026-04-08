Backend (from suwamed-backend/):
  cd suwamed-backend
  npm run dev
  This starts the server with nodemon + ts-node on port 5000.

  Frontend (from suwamed-mobile/):
  cd suwamed-mobile
  npx expo start --tunnel
  Use --tunnel since you're opening it on your iPhone via Expo Go — this uses ngrok (you already have       
  @expo/ngrok installed) to create a public URL that your phone can reach regardless of network
  configuration.

  Then scan the QR code shown in the terminal with your iPhone camera, and it will open in Expo Go.

  Note: Make sure your API_URL in constants.ts (http://172.20.10.5:5000/api) matches your computer's current
   local IP on the same network as your iPhone. If your IP has changed, update it accordingly.



   1. Clear the ngrok cache and retry:
  npx expo start --tunnel --clear                                                                              
  2. If that still fails, try without tunnel using your local network instead:                              
  npx expo start
  This will show a QR code using your LAN IP. Make sure your iPhone and computer are on the same Wi-Fi
  network.

  3. If ngrok keeps failing, reinstall it:
  npm install @expo/ngrok@^4.1.3
  npx expo start --tunnel

  4. If none of the above work, ngrok may require a free account now. Sign up at https://ngrok.com, get your
   auth token, then run:
  npx ngrok config add-authtoken YOUR_TOKEN
  npx expo start --tunnel

  The simplest path is option 2 — just use npx expo start (no tunnel) and make sure both devices are on the 
  same network.



  1. Always activate the venv first before using notebooklm. Every new terminal session:
bashC:\Users\malit\.notebooklm-venv\Scripts\Activate.ps1

2. Make it less annoying — add a PowerShell function to your profile. Run this once:
bashnotepad $PROFILE
If it asks to create the file, say yes. Paste this in and save:
powershellfunction nblm {
    & C:\Users\malit\.notebooklm-venv\Scripts\Activate.ps1
    python -m notebooklm @args
}
Now from any terminal, any directory, you can just run:
bashnblm list
nblm ask "what's in my sources"
nblm create "Travion Research"
It auto-activates the venv and passes args through. Much cleaner.