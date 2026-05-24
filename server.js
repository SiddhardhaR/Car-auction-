const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = __dirname;
const DB_PATH = path.join(__dirname, "data", "db.json");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function minimumNextBid(auction) {
  if (!auction.currentBid) return auction.reserve || 500;
  return auction.currentBid + Math.max(1000, Math.ceil((auction.currentBid * 0.02) / 500) * 500);
}

function updateAuctionStatuses(db) {
  const now = Date.now();
  db.auctions = db.auctions.map((auction) => {
    if (auction.status === "live" && new Date(auction.endTime).getTime() <= now) {
      return { ...auction, status: "ended" };
    }
    return auction;
  });
}

async function handleApi(req, res, url) {
  const db = readDb();
  updateAuctionStatuses(db);

  if (req.method === "GET" && url.pathname === "/api/auctions") {
    sendJson(res, 200, db.auctions);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/results") {
    sendJson(res, 200, db.results);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard") {
    const live = db.auctions.filter((auction) => auction.status === "live");
    sendJson(res, 200, {
      liveCount: live.length,
      activeBidVolume: live.reduce((sum, auction) => sum + auction.currentBid, 0),
      awaitingApproval: db.auctions.filter((auction) => auction.status === "upcoming").length + db.submissions.length,
      activeComments: db.auctions.reduce((sum, auction) => sum + auction.comments, 0),
      postSaleWorkflows: db.auctions.filter((auction) => auction.status === "ended").length,
      depositsVerified: 86
    });
    return;
  }

  const bidMatch = url.pathname.match(/^\/api\/auctions\/([^/]+)\/bids$/);
  if (req.method === "POST" && bidMatch) {
    const { amount, user = "you" } = await parseBody(req);
    const auction = db.auctions.find((item) => item.id === bidMatch[1]);

    if (!auction) {
      sendJson(res, 404, { error: "Auction not found." });
      return;
    }

    const nextBid = minimumNextBid(auction);
    if (!Number.isFinite(Number(amount)) || Number(amount) < nextBid) {
      sendJson(res, 422, { error: `Bid must be at least $${nextBid.toLocaleString()}.`, nextBid });
      return;
    }

    auction.currentBid = Number(amount);
    auction.status = "live";
    auction.bidHistory.unshift({ user, amount: auction.currentBid, at: new Date().toISOString() });
    auction.thread.unshift({
      user: "system",
      text: `New high bid recorded at $${auction.currentBid.toLocaleString()}.`,
      at: "Just now"
    });
    auction.comments += 1;

    const remaining = new Date(auction.endTime).getTime() - Date.now();
    if (remaining > 0 && remaining < 2 * 60 * 1000) {
      auction.endTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      auction.thread.unshift({
        user: "system",
        text: "Anti-sniping protection extended this auction by two minutes.",
        at: "Just now"
      });
      auction.comments += 1;
    }

    writeDb(db);
    sendJson(res, 201, auction);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/submissions") {
    const body = await parseBody(req);
    const required = ["title", "vin", "reserve", "location", "condition"];
    const missing = required.filter((field) => !body[field]);

    if (missing.length) {
      sendJson(res, 422, { error: `Missing required fields: ${missing.join(", ")}.` });
      return;
    }

    const submission = {
      id: `draft-${Date.now()}`,
      title: String(body.title),
      vin: String(body.vin),
      reserve: Number(body.reserve),
      location: String(body.location),
      condition: String(body.condition),
      status: "pending-review",
      createdAt: new Date().toISOString()
    };
    db.submissions.unshift(submission);
    writeDb(db);
    sendJson(res, 201, submission);
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR) || filePath.includes(`${path.sep}.git${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(contents);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mikes Auction dynamic server running at http://localhost:${PORT}`);
});
