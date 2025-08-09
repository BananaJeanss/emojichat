document.getElementById("backspaceButton").addEventListener("click", () => {
  const input = document.getElementById("messageInput");
  if (input) {
    input.disabled = false; // input disabled and then enabled cause otherwise it wont work for whatever reason
    input.value = [...input.value].slice(0, -1).join("");
    input.disabled = true;
    input.focus();
  }
});
