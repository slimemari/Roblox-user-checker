# Render-ready Roblox Username Checker

## Deploy on Render

1. Put these files in a GitHub repository:
   - index.html
   - server.js
   - package.json
   - render.yaml
2. In Render, create a new Web Service from that GitHub repository.
3. Render can use the included `render.yaml`, or use:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Deploy.
5. Open the `.onrender.com` URL Render gives you.

The server listens on Render's PORT environment variable and binds to 0.0.0.0.

Important:
- This does not create Roblox accounts or collect passwords.
- It does not bypass Roblox rate limits.
- If Roblox returns a rate-limit response, the checker stops.
- Discord arbitrary username availability checking is not included.
