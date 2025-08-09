document.getElementById("backspaceButton").addEventListener("click", () => {
  const input = document.getElementById("messageInput");
  const barFill = document.getElementById("emojiBarFill");
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
  if (arr.length > 0) arr.pop();
  input.value = arr.join("");

  if (barFill) {
    const pct = Math.max(0, Math.min(1, arr.length / 35));
    barFill.style.height = `${pct * 100}%`;
    const hue = 120 - 120 * pct;
    barFill.style.backgroundColor = `hsl(${hue} 85% 45%)`;
  }

  input.focus();
});
