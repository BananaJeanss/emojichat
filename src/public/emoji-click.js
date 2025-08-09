document
  .querySelector("emoji-picker")
  .addEventListener("emoji-click", (event) => {
    const selectedEmoji = event.detail.unicode;
    const input = document.getElementById('messageInput');
    if (input) {
      input.value += selectedEmoji;
      input.focus();
    }
  });