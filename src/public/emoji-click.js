document
  .querySelector("emoji-picker")
  .addEventListener("emoji-click", (event) => {
    const selectedEmoji = event.detail.unicode;
    const input = document.getElementById("messageInput");
    const emojiCountSpan = document.getElementById("emojiCount");
    if (!input) return;

    let arr;
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      arr = Array.from(seg.segment(input.value || ""), (s) => s.segment)
        .filter((g) => /\p{Extended_Pictographic}/u.test(g));
    } catch {
      arr = Array.from(input.value || "")
        .filter((ch) => /\p{Extended_Pictographic}/u.test(ch));
    }

    if (arr.length < 35) {
      arr.push(selectedEmoji);
      input.value = arr.join("");
      if (emojiCountSpan) emojiCountSpan.textContent = arr.length;
      input.focus();
    }
  });