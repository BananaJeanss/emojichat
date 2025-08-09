(function () {
  const openBtn = document.getElementById("settingsOpenButton");
  const menuHost = document.getElementById("menuPlaceholder");
  const avatarChip = document.getElementById("avatarChip");

  // settings ui
  const overlay = document.createElement("div");
  overlay.id = "settingsOverlay";
  overlay.className = "settings-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="settings-modal" role="dialog" aria-modal="true">
      <div class="settings-row">
        <span class="settings-label">🏷️</span>
        <input id="nameEmojiInput" class="emoji-input" type="text" inputmode="none" placeholder="😀" />
      </div>

      <div class="settings-row">
        <span class="settings-label">🖼️</span>
        <span id="pfpPreview" class="pfp-preview">🙂</span>
        <button id="clearPfp" class="icon-btn" aria-label="clear">🚫</button>
      </div>

      <emoji-picker id="pfpPicker" class="mini-picker"></emoji-picker>

      <div class="settings-actions">
        <button id="cancelSettings" class="icon-btn">❌</button>
        <button id="saveSettings" class="icon-btn">✅</button>
      </div>
    </div>
  `;
  menuHost.appendChild(overlay);

  const nameInput = overlay.querySelector("#nameEmojiInput");
  const pfpPicker = overlay.querySelector("#pfpPicker");
  const pfpPreview = overlay.querySelector("#pfpPreview");
  const saveBtn = overlay.querySelector("#saveSettings");
  const cancelBtn = overlay.querySelector("#cancelSettings");
  const clearPfpBtn = overlay.querySelector("#clearPfp");

  let pickerTarget = "name";

  function updateSelectionUI() {
    nameInput.classList.toggle("is-selected", pickerTarget === "name");
    pfpPreview.classList.toggle("is-selected", pickerTarget === "pfp");
  }

  // only allow emojis in the name input
  function onlyEmojis(str) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(str), (s) => s.segment)
        .filter((g) => /\p{Extended_Pictographic}/u.test(g))
        .join("");
    } catch {
      return Array.from(str)
        .filter((ch) => /\p{Extended_Pictographic}/u.test(ch))
        .join("");
    }
  }

  function openModal() {
    overlay.hidden = false;
    pickerTarget = "name";
    updateSelectionUI();
    nameInput.focus();
  }

  function closeModal() {
    overlay.hidden = true;
  }

  // Load persisted values
  function loadIdentity() {
    const savedName = localStorage.getItem("nameEmoji") || "";
    const savedPfp = localStorage.getItem("pfpEmoji") || "🙂";
    nameInput.value = savedName;
    pfpPreview.textContent = savedPfp;
    avatarChip.textContent = savedPfp;
  }

  openBtn.addEventListener("click", openModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") closeModal();
  });

  // switch picker target yadayada
  nameInput.addEventListener("focus", () => {
    pickerTarget = "name";
    updateSelectionUI();
  });
  pfpPreview.addEventListener("click", () => {
    pickerTarget = "pfp";
    updateSelectionUI();
  });

  nameInput.addEventListener("input", () => {
    nameInput.value = onlyEmojis(nameInput.value);
  });

  pfpPicker.addEventListener("emoji-click", (event) => {
    const selected = event.detail.unicode;
    if (pickerTarget === "name" || document.activeElement === nameInput) {
      nameInput.value = onlyEmojis((nameInput.value || "") + selected);
      pickerTarget = "name";
      updateSelectionUI();
      nameInput.focus();
    } else {
      pfpPreview.textContent = selected;
      pickerTarget = "pfp";
      updateSelectionUI();
    }
  });

  clearPfpBtn.addEventListener("click", () => {
    pfpPreview.textContent = "🙂";
  });

  saveBtn.addEventListener("click", () => {
    const nameEmoji = onlyEmojis(nameInput.value || "");
    const pfpEmoji = pfpPreview.textContent || "🙂";
    localStorage.setItem("nameEmoji", nameEmoji);
    localStorage.setItem("pfpEmoji", pfpEmoji);
    avatarChip.textContent = pfpEmoji;
    closeModal();
  });

  loadIdentity();
  updateSelectionUI();
})();
