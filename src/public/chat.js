const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendButton");
const emojiCountSpan = document.getElementById("emojiCount");

// helpers
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

function appendMessage({ pfp, name, text }) {
  if (!messagesEl) return;

  const wrapper = document.createElement("div");
  wrapper.className = "messageTemplate";

  const pfpEl = document.createElement("p");
  pfpEl.className = "pfptemplate";
  pfpEl.textContent = pfp || "🙂";

  const content = document.createElement("div");
  content.className = "messageContent";

  const nameEl = document.createElement("span");
  nameEl.className = "name";
  nameEl.textContent = name || "👤";

  const hr = document.createElement("hr");

  const textEl = document.createElement("span");
  textEl.className = "text";
  textEl.textContent = text;

  content.appendChild(nameEl);
  content.appendChild(hr);
  content.appendChild(textEl);

  wrapper.appendChild(pfpEl);
  wrapper.appendChild(content);

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const raw = inputEl?.value || "";
  const cleanText = onlyEmojis(raw);
  const count = emojiCount(cleanText);
  if (count < 1 || count > 35) return;

  const nameEmoji = onlyEmojis(localStorage.getItem("nameEmoji") || "");
  const pfpEmoji = onlyEmojis(localStorage.getItem("pfpEmoji") || "🙂") || "🙂";

  try {
    sendBtn.disabled = true;
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEmoji, pfpEmoji, text: cleanText }),
    });
    if (!res.ok) return;

    if (inputEl) inputEl.value = "";
    if (emojiCountSpan) emojiCountSpan.textContent = "0";
  } catch {
    // ignore
  } finally {
    sendBtn.disabled = false;
  }
}

function connectStream() {
  // clear placeholders wasdfghjkl
  if (messagesEl) messagesEl.innerHTML = "";

  const es = new EventSource("/api/stream");
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      appendMessage(msg);
    } catch {
        // ignore
    }
  };
  es.onerror = () => {
    es.close();
    setTimeout(connectStream, 2000);
  };
}

if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

connectStream();
