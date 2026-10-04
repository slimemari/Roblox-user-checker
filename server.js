const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const INDEX = path.join(__dirname, "index.html");

function send(res, status, body, type="application/json") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/") {
      const html = fs.readFileSync(INDEX);
      return send(res, 200, html, "text/html; charset=utf-8");
    }

    if (url.pathname === "/api/check") {
      const username = url.searchParams.get("username") || "";
      if (!/^[A-Za-z0-9]{3,4}$/.test(username)) {
        return send(res, 400, JSON.stringify({error:"Invalid username format."}));
      }

      const birthday = "2000-01-01";
      const target =
        "https://auth.roblox.com/v1/usernames/validate" +
        "?request.username=" + encodeURIComponent(username) +
        "&request.birthday=" + birthday +
        "&request.context=Signup";

      const r = await fetch(target, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "RobloxUsernameChecker/1.0"
        }
      });

      const text = await r.text();
      let data;
      try { data = JSON.parse(text); }
      catch { data = {}; }

      if (r.status === 429) {
        return send(res, 429, JSON.stringify({
          error:"Roblox rate-limited the checker. Stop and wait before trying again."
        }));
      }

      if (!r.ok) {
        return send(res, r.status, JSON.stringify({
          error:`Roblox returned HTTP ${r.status}.`
        }));
      }

      return send(res, 200, JSON.stringify({
        available: data.code === 0,
        code: data.code
      }));
    }

    return send(res, 404, JSON.stringify({error:"Not found"}));
  } catch (err) {
    console.error(err);
    return send(res, 502, JSON.stringify({
      error:"Could not contact Roblox. Check your internet connection and try again later."
    }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Roblox username checker running at http://127.0.0.1:${PORT}`);
});
