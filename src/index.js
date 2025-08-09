import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = new URL(".", import.meta.url).pathname;

// basic security checks
app.disable("x-powered-by");
app.use(express.json({ limit: "2kb" }));

app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

//  clients and messages
const sseClients = new Map();
const recentMessages = [];
const MAX_RECENT = 50;

// server side validation
function splitGraphemes(str) {
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(str || ""), (s) => s.segment);
  } catch {
    return Array.from(str || "");
  }
}
function onlyEmojis(str) {
  return splitGraphemes(str)
    .filter((g) => /\p{Extended_Pictographic}/u.test(g))
    .join("");
}
function emojiCount(str) {
  return splitGraphemes(str).filter((g) => /\p{Extended_Pictographic}/u.test(g))
    .length;
}

const rl = new Map(); // key -> { tokens, last }
const RL_CAPACITY = 5; // burst
const RL_REFILL_PER_SEC = 1; // tokens/sec
function rateLimitOk(key) {
  const now = Date.now();
  const entry = rl.get(key) ?? { tokens: RL_CAPACITY, last: now };
  const elapsed = (now - entry.last) / 1000;
  entry.tokens = Math.min(
    RL_CAPACITY,
    entry.tokens + elapsed * RL_REFILL_PER_SEC
  );
  entry.last = now;
  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    rl.set(key, entry);
    return true;
  }
  rl.set(key, entry);
  return false;
}

// broadcast helper
function broadcast(msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const { res } of sseClients.values()) {
    res.write(data);
  }
}

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  res.write(": connected\n\n");

  // send a history on connect
  for (const m of recentMessages) {
    res.write(`data: ${JSON.stringify(m)}\n\n`);
  }

  const id = Math.random().toString(36).slice(2);
  const keepAlive = setInterval(() => res.write(": ping\n\n"), 30000);
  sseClients.set(id, { res, keepAlive });

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(id);
  });
});

// send endpoint with validation
app.post("/api/send", (req, res) => {
  const key = req.ip || req.headers["x-forwarded-for"] || "anon";
  if (!rateLimitOk(key)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { nameEmoji = "", pfpEmoji = "🙂", text = "" } = req.body || {};

  // sanitize and validate fields
  const cleanName = onlyEmojis(nameEmoji).slice(0, 24); // cap grapheme length by string length approx
  const cleanPfp = onlyEmojis(pfpEmoji);
  const cleanText = onlyEmojis(text);

  const nameLen = emojiCount(cleanName);
  const pfpLen = emojiCount(cleanPfp);
  const textLen = emojiCount(cleanText);

  if (textLen < 1 || textLen > 35) {
    return res.status(400).json({ error: "Message must be 1–35 emojis" });
  }
  if (pfpLen !== 1) {
    return res
      .status(400)
      .json({ error: "Profile picture must be a single emoji" });
  }

  const msg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    pfp: cleanPfp,
    name: nameLen > 0 ? cleanName : "",
    text: cleanText,
    ts: Date.now(),
  };

  recentMessages.push(msg);
  if (recentMessages.length > MAX_RECENT) recentMessages.shift();

  broadcast(msg);
  return res.status(201).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`emojichat server is running on http://localhost:${PORT}`);
});
