import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const db = getFirestore(window.firebaseApp); // Your initialized app
const auth = window.auth; // Your initialized auth

function showDeleteConfirmModal(message) {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.89);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    // Optional: click to close overlay and restore scroll
    overlay.addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "";
    });

    document.body.appendChild(overlay);

    // Create modal box
    const modal = document.createElement("div");
    modal.style = `
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px); /* for Safari */
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      border: none;
      padding: 20px;
      border-radius: 8px;
      max-width: 320px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Roboto, sans-serif;
      font-size: 22px;
      color: white;
    `;

    const msg = document.createElement("p");
    msg.textContent = message;
    msg.style.margin = "0 0 12px 0";
    msg.style.display = "block";
    msg.style.textAlign = "left";

    const buttonsDiv = document.createElement("div");
    buttonsDiv.style =
      "margin-top: 8px; display: flex; width: 100%; justify-content: flex-start; gap: 6px;";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.style = `
      padding: 6px 12px;
      background: #d33;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style = `
      padding: 6px 12px;
      background: #ccc;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    buttonsDiv.appendChild(confirmBtn);
    buttonsDiv.appendChild(cancelBtn);

    modal.appendChild(msg);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    function cleanup() {
      document.body.removeChild(overlay);
    }
  });
}

// =====================
// To-Do Section Content
// =====================
function getTodoContent() {
  return `
  <div
    class="progress"
    style="
      flex: 0 0 calc(60% - 12px);
      padding: 40px;
      border: none;
      max-width: 80%;
      margin: 4px auto;
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 25px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      border: none;
    "
  >
    <p
      style="
        font-family: Arial;
        text-align: left;
        margin-bottom: 20px;
        font-weight: 600;
        font-size: 40px;
      "
    >
      <span>To-Do</span>
      <span
        id="app-version"
        style="
          font-size: 18px;
          font-weight: 600;
          margin-left: 12px;
          opacity: 0.9;
          cursor: pointer;
        "
        title="Click to edit version"
        >v1.19.5 GS</span
      >
      <span
        id="version-edit"
        style="
          margin-left: 0px;
          font-size: 14px;
          color: var(--text-color);
          opacity: 0.9;
          cursor: pointer;
          vertical-align: baseline;
        "
        title="Edit version"
        >(edit)</span
      >
      <span
        id="todo-date"
        style="
          float: right;
          font-weight: 500;
          font-size: 18px;
          color: var(--text-color);
          margin-top: 25px;
        "
        >--</span
      >
    </p>
    <div style="text-align: left">
      <div
        style="display: flex; align-items: center; gap: 10px; margin: 8px 0 8px"
      >
        <div
          id="todo-progress"
          style="
            position: relative;
            height: 10px;
            background: rgba(0, 0, 0, 0.15);
            border-radius: 6px;
            overflow: hidden;
            flex: 1;
          "
        >
          <div
            id="todo-progress-fill"
            style="
              height: 100%;
              width: 0%;
              background: linear-gradient(
                90deg,
                rgb(44, 201, 199),
                rgb(72, 201, 176),
                rgb(126, 214, 223)
              );
              transition: width 0.3s ease;
            "
          ></div>
        </div>
        <span
          id="todo-progress-summary"
          style="
            font-size: 12px;
            color: var(--text-color);
            opacity: 0.85;
            white-space: nowrap;
          "
          >0% • 0/0</span
        >
      </div>
      <div
        id="todo-controls"
        style="
          display: flex;
          column-gap: 8px;
          row-gap: 0px;
          margin-top: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
          align-items: center;
        "
      >
        <div style="display: flex; gap: 8px">
          <button
            id="todo-add"
            class="nav-bar6"
            style="
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 6px;
              background: transparent;
              color: var(--text-color);
              border: 1px solid var(--all-text);
            "
          >
            Add
          </button>
          <button
            id="todo-edit"
            class="nav-bar6"
            style="
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 6px;
              background: transparent;
              color: var(--text-color);
              border: 1px solid var(--all-text);
            "
          >
            Edit
          </button>
          <button
            id="todo-save"
            class="nav-bar6"
            style="
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 6px;
              background: transparent;
              color: var(--text-color);
              border: 1px solid var(--all-text);
            "
          >
            Save
          </button>
          <button
            id="todo-reset"
            class="nav-bar6"
            style="
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 6px;
              background: transparent;
              color: var(--text-color);
              border: 1px solid var(--all-text);
            "
          >
            Reset
          </button>
        </div>
        <span
          id="todo-admin-note"
          style="
            display: block;
            flex-basis: 100%;
            margin-top: 0px;
            margin-bottom: 20px;
            font-size: 12px;
            line-height: 1.1;
            opacity: 0.75;
            white-space: nowrap;
          "
        ></span>
      </div>
      <p
        id="todo-empty"
        style="display: none; font-size: 13px; opacity: 0.8; margin: 4px 0 8px 0"
      >
        No tasks yet — use Add to create your first task.
      </p>
      <ul id="todo-list" style="list-style: none; padding-left: 0; margin: 0">
      </ul>
    </div>
  </div>`;
}

// =====================
// To-Do Logic (Dashboard)
// =====================
function initTodoDashboard() {
  const ADMIN_UIDS = ["WbuZJ31aQ6Qt0Wp9aWqlUInfihn2"]; // keep in sync

  const els = {
    date: document.getElementById("todo-date"),
    list: document.getElementById("todo-list"),
    progressFill: document.getElementById("todo-progress-fill"),
    add: document.getElementById("todo-add"),
    edit: document.getElementById("todo-edit"),
    save: document.getElementById("todo-save"),
    reset: document.getElementById("todo-reset"),
    adminNote: document.getElementById("todo-admin-note"),
    versionText: document.getElementById("app-version"),
    versionEdit: document.getElementById("version-edit"),
  };

  if (!els.list || !els.progressFill) return;

  // Date
  try {
    if (els.date) {
      const now = new Date();
      const day = now.toLocaleDateString(undefined, { weekday: "short" });
      const dateStr = now.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      els.date.textContent = `${day}, ${dateStr}`;
    }
  } catch {}

  const state = {
    items: [],
    editing: false,
    isAdmin: false,
    isFirstAdmin: false,
    loaded: false,
    version: (window.AppVersion && String(window.AppVersion)) || "v1.19.5 GS",
    currentUserUid: null,
    targetUid: null,
  };

  function updateAllVersionDisplays() {
    try {
      if (els.versionText) els.versionText.textContent = state.version;
      window.AppVersion = state.version;
      document.querySelectorAll('[data-role="app-version"]').forEach((el) => {
        el.textContent = state.version;
      });
      window.dispatchEvent(
        new CustomEvent("app-version-changed", {
          detail: { version: state.version },
        })
      );
    } catch {}
  }

  function computeProgress() {
    const total = state.items.length || 1;
    const done = state.items.filter((i) => i.done).length;
    return Math.round((done / total) * 100);
  }

  function renderList() {
    els.list.innerHTML = "";
    const canEditOwner = !!(
      state.currentUserUid && state.currentUserUid === state.targetUid
    );
    state.items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.style.cssText =
        "display:flex; align-items:center; gap:12px; padding:10px 0; margin:6px 0;";
      li.dataset.index = String(idx);
      if (canEditOwner && state.editing) {
        li.draggable = false;
        li.style.transition = "border 120ms ease, background-color 120ms ease, transform 150ms ease-out, box-shadow 150ms ease-out";
        li.style.willChange = "transform, box-shadow";
        li.style.borderTop = "2px solid transparent";
        li.style.borderBottom = "2px solid transparent";
      }

      const num = document.createElement("span");
      num.textContent = `${idx + 1}.`;
      num.style.cssText =
        "min-width: 24px; text-align: right; opacity: 0.8; font-size: 18px;";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!item.done;
      cb.disabled = !(canEditOwner && !state.editing);
      cb.style.margin = "0 6px 0 0";
      cb.style.verticalAlign = "middle";
      cb.style.cursor = canEditOwner && !state.editing ? "pointer" : "default";
      cb.style.alignSelf = "center";
      cb.style.appearance = "none";
      cb.style.webkitAppearance = "none";
      cb.style.MozAppearance = "none";
      cb.style.width = "18px";
      cb.style.height = "18px";
      cb.style.border = "2px solid var(--all-text)";
      cb.style.borderRadius = "4px";
      cb.style.backgroundColor = "transparent";
      cb.style.opacity = cb.disabled ? "0.6" : "0.95";
      cb.style.display = "inline-block";
      cb.style.backgroundRepeat = "no-repeat";
      cb.style.backgroundPosition = "center";
      cb.style.backgroundSize = "14px 14px";
      cb.style.position = "relative";
      cb.style.top = "-1px";

      const setCheckboxVisual = () => {
        if (cb.checked) {
          cb.style.borderColor = "rgb(44, 201, 199)";
          cb.style.backgroundColor = "rgb(44, 201, 199)";
          cb.style.backgroundImage =
            "url(data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>)";
        } else {
          cb.style.borderColor = "var(--all-text)";
          cb.style.backgroundColor = "transparent";
          cb.style.backgroundImage = "none";
        }
      };
      setCheckboxVisual();

      let textEl = null;
      cb.addEventListener("change", async () => {
        item.done = cb.checked;
        setCheckboxVisual();
        if (!state.editing && textEl && textEl.classList) {
          if (cb.checked) textEl.classList.add("completed");
          else textEl.classList.remove("completed");
        }
        updateProgress();
        if (canEditOwner && !state.editing) {
          await saveToFirestore();
        }
      });

      textEl = document.createElement(state.editing ? "input" : "span");
      if (state.editing) {
        textEl.type = "text";
        textEl.value = item.text || "";
        textEl.style.cssText =
          "flex:1; padding:6px 8px; height:38px; border:1px solid var(--all-text); background: transparent; color: var(--text-color, #fff); border-radius:6px; font-size:22px; line-height:1.35;";
        textEl.addEventListener("input", () => (item.text = textEl.value));
        textEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const val = (textEl.value || "").trim();
            const inputs = els.list.querySelectorAll('input[type="text"]');
            const inputsArr = Array.from(inputs);
            const isLast = inputsArr[inputsArr.length - 1] === textEl;
            if (val.length > 0 && isLast) {
              state.items.push({ text: "", done: false });
              renderList();
              updateButtons();
              const newInputs = els.list.querySelectorAll('input[type="text"]');
              const last = newInputs[newInputs.length - 1];
              if (last) last.focus();
            } else {
              const idxInput = inputsArr.indexOf(textEl);
              if (idxInput >= 0 && inputsArr[idxInput + 1]) {
                inputsArr[idxInput + 1].focus();
              }
            }
          }
        });
      } else {
        textEl.textContent = item.text || "";
        textEl.style.cssText = "flex:1; font-size:22px; line-height:1.35;";
        textEl.className = "todo-text";
        if (item.done) textEl.classList.add("completed");
      }

      if (canEditOwner && state.editing) {
        const handle = document.createElement("span");
        handle.title = "Drag to reorder";
        handle.className = "drag-handle";
        handle.draggable = true;
        // Container for three bars
        handle.style.cssText =
          "cursor: grab; user-select: none; opacity:0.95; min-width: 28px; text-align:center; margin-right: 6px; display:inline-flex; flex-direction:column; justify-content:center; align-items:center; gap:5px; width: 28px; height: 26px;";
        const makeBar = () => {
          const bar = document.createElement("span");
          bar.style.cssText =
            "display:block; width: 26px; height: 3px; background: var(--all-text); border-radius: 2px; opacity: 0.95;";
          return bar;
        };
        handle.appendChild(makeBar());
        handle.appendChild(makeBar());
        handle.appendChild(makeBar());
        li.appendChild(handle);
      }

      li.appendChild(num);
      li.appendChild(cb);
      li.appendChild(textEl);

      if (canEditOwner && state.editing) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "todo-btn";
        delBtn.style.cssText =
          "display:inline-flex; align-items:center; height:32px; padding:5px 10px; font-size:12px; border-radius:6px; background:transparent; color: var(--text-color); border:1px solid var(--all-text);";
        delBtn.addEventListener("click", () => {
          state.items.splice(idx, 1);
          renderList();
          updateProgress();
          updateButtons();
        });
        li.appendChild(delBtn);
      }

      els.list.appendChild(li);
    });

    if (state.editing) {
      const li = document.createElement("li");
      li.style.cssText =
        "display:flex; align-items:center; gap:12px; padding:10px 0; margin:6px 0;";
      li.tabIndex = 0;
      const nextNum = document.createElement("span");
      nextNum.textContent = `${state.items.length + 1}.`;
      nextNum.style.cssText =
        "min-width: 24px; text-align: right; opacity: 0.8; font-size: 18px;";
      li.appendChild(nextNum);
      const placeholder = document.createElement("span");
      placeholder.textContent = "Add new task, object, etc..";
      placeholder.style.cssText = "flex:1; opacity:0.8; font-style: italic;";
      li.appendChild(placeholder);
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.className = "todo-btn";
      addBtn.style.cssText =
        "display:inline-flex; align-items:center; height:32px; padding:5px 10px; font-size:12px; border-radius:6px; background:transparent; color: var(--text-color); border:1px solid var(--all-text)";
      addBtn.addEventListener("click", () => {
        state.items.push({ text: "", done: false });
        renderList();
        updateButtons();
        const inputs = els.list.querySelectorAll('input[type="text"]');
        const last = inputs[inputs.length - 1];
        if (last) last.focus();
      });
      li.appendChild(addBtn);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addBtn.click();
        }
      });
      els.list.appendChild(li);
    }

    if (canEditOwner && state.editing) setupDragAndDrop();

    const emptyEl = document.getElementById("todo-empty");
    if (emptyEl)
      emptyEl.style.display =
        state.items.length || state.editing ? "none" : "block";
  }

  function setupDragAndDrop() {
    const listItems = Array.from(els.list.querySelectorAll("li"));
    let dragSrcIndex = null;
    let lastHoverEl = null; // currently highlighted <li>
    let lastHoverPos = null; // 'above' | 'below'
    let rafId = 0; // throttle DOM writes
    const ACCENT = "rgb(44, 201, 199)";
    const HOVER_BG = "rgba(44, 201, 199, 0.08)";
    const SHIFT_PX = 4; // smaller shift to reduce perceived jitter

    const clearIndicators = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (lastHoverEl) {
        lastHoverEl.style.borderTop = "2px solid transparent";
        lastHoverEl.style.borderBottom = "2px solid transparent";
        lastHoverEl.style.backgroundColor = "";
        lastHoverEl.style.transform = "";
      }
      lastHoverEl = null;
      lastHoverPos = null;
    };

    listItems.forEach((li) => {
      const hasPlaceholder =
        !!li.querySelector(".todo-btn") &&
        !li.querySelector('input[type="checkbox"]');
      const isPlaceholderRow =
        !li.querySelector('input[type="checkbox"]') && hasPlaceholder;
      if (isPlaceholderRow) return;

      const handle = li.querySelector(".drag-handle");
      const dragStartTarget = handle || li;
      if (!handle) li.draggable = true;

      dragStartTarget.addEventListener("dragstart", (e) => {
        dragSrcIndex = parseInt(li.dataset.index || "0", 10);
        li.style.opacity = "0.5";
        // Emphasize dragged item
        li.style.transform = "scale(1.03)";
        li.style.boxShadow = "0 10px 24px rgba(0,0,0,0.30)";
        const h = li.querySelector(".drag-handle");
        if (h) h.style.cursor = "grabbing";
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(dragSrcIndex));
          try {
            e.dataTransfer.setDragImage(li, 10, 10);
          } catch {}
        }
      });

      dragStartTarget.addEventListener("dragend", () => {
        li.style.opacity = "";
        li.style.transform = "";
        li.style.boxShadow = "";
        const h = li.querySelector(".drag-handle");
        if (h) h.style.cursor = "grab";
        dragSrcIndex = null;
        clearIndicators();
      });

      const onDragPosition = (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        const rect = li.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const deadzone = Math.max(4, Math.min(10, rect.height * 0.2));
        const rawPos = e.clientY < midY ? "above" : "below";
        // Apply hysteresis near the midpoint to avoid rapid flipping
        const withinDeadzone = Math.abs(e.clientY - midY) < deadzone;
        const nextPos = withinDeadzone && lastHoverEl === li && lastHoverPos
          ? lastHoverPos
          : rawPos;

        // Only update if target or position changed
        if (lastHoverEl === li && lastHoverPos === nextPos) return;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // clear previous highlighted element
          if (lastHoverEl && lastHoverEl !== li) {
            lastHoverEl.style.borderTop = "2px solid transparent";
            lastHoverEl.style.borderBottom = "2px solid transparent";
            lastHoverEl.style.backgroundColor = "";
            lastHoverEl.style.transform = "";
          }

          // apply to current element
          if (nextPos === "above") {
            li.style.borderTop = `2px solid ${ACCENT}`;
            li.style.borderBottom = "2px solid transparent";
            li.style.backgroundColor = HOVER_BG;
            li.style.transform = `translateY(-${SHIFT_PX}px)`;
          } else {
            li.style.borderBottom = `2px solid ${ACCENT}`;
            li.style.borderTop = "2px solid transparent";
            li.style.backgroundColor = HOVER_BG;
            li.style.transform = `translateY(${SHIFT_PX}px)`;
          }
          lastHoverEl = li;
          lastHoverPos = nextPos;
        });
      };

      li.addEventListener("dragover", onDragPosition);
      li.addEventListener("dragenter", onDragPosition);

      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const from =
          dragSrcIndex ??
          parseInt(
            (e.dataTransfer && e.dataTransfer.getData("text/plain")) || "0",
            10
          );
        let to = parseInt(li.dataset.index || "0", 10);
        if (Number.isNaN(from) || Number.isNaN(to)) return;
        const insertPos =
          lastHoverEl === li && lastHoverPos === "below" ? to + 1 : to;
        const adjustedInsert = from < insertPos ? insertPos - 1 : insertPos;
        if (from === adjustedInsert) return;
        const moved = state.items.splice(from, 1)[0];
        state.items.splice(adjustedInsert, 0, moved);
        clearIndicators();
        renderList();
        updateProgress();
      });

      li.addEventListener("dragleave", () => {
        if (lastHoverEl === li) {
          li.style.borderTop = "2px solid transparent";
          li.style.borderBottom = "2px solid transparent";
          li.style.backgroundColor = "";
          li.style.transform = "";
        }
      });
    });

    els.list.addEventListener("dragleave", (e) => {
      if (!els.list.contains(e.relatedTarget)) clearIndicators();
    });
    els.list.addEventListener("dragover", (e) => e.preventDefault());
    // Clear any lingering hover styles when a drop happens on the list container
    els.list.addEventListener("drop", () => clearIndicators());
  }

  function updateProgress() {
    const pct = computeProgress();
    if (els.progressFill) els.progressFill.style.width = pct + "%";
    const done = state.items.filter((i) => i.done).length;
    const total = state.items.length;
    const statusOutside = document.getElementById("todo-progress-summary");
    if (statusOutside) statusOutside.textContent = `${pct}% • ${done}/${total}`;
    const statusInside = document.getElementById("todo-progress-status");
    if (statusInside) statusInside.textContent = `${pct}% • ${done}/${total}`;
  }

  function setEditing(edit) {
    state.editing = !!edit;
    renderList();
    updateButtons();
  }

  function updateButtons() {
    const canEdit = !!(
      state.currentUserUid && state.currentUserUid === state.targetUid
    );
    if (els.add) els.add.style.display = "none";
    if (els.edit)
      els.edit.style.display =
        canEdit && !state.editing ? "inline-block" : "none";
    if (els.save)
      els.save.style.display =
        canEdit && state.editing ? "inline-block" : "none";
    if (els.reset) els.reset.style.display = canEdit ? "inline-block" : "none";
    if (els.versionText) {
      const isUnauthed = !state.currentUserUid;
      const showVersion = state.isFirstAdmin || isUnauthed;
      els.versionText.style.display = showVersion ? "inline-block" : "none";
      els.versionText.style.cursor = state.isFirstAdmin ? "pointer" : "default";
      els.versionText.title = state.isFirstAdmin ? "Click to edit version" : "";
    }
    if (els.versionEdit) {
      els.versionEdit.style.display = state.isFirstAdmin
        ? "inline-block"
        : "none";
    }
    if (els.adminNote) {
      els.adminNote.style.marginTop = "20px"; // add spacing above status line
      els.adminNote.style.marginBottom = "20px";
      els.adminNote.style.lineHeight = "1";
      if (!state.currentUserUid && state.targetUid) {
        els.adminNote.textContent =
          "View-only • showing the default admin's To-Do list";
      } else if (canEdit) {
        els.adminNote.textContent = state.editing
          ? "Editing your list: add, edit texts, delete; then Save."
          : "Your To-Do list: click Edit to modify.";
      } else {
        els.adminNote.textContent = "View-only";
      }
    }
    if (els.add) els.add.disabled = true;
    if (els.edit) els.edit.disabled = !canEdit || state.editing;
    if (els.save) els.save.disabled = !canEdit || !state.editing;
    if (els.reset) els.reset.disabled = !canEdit;
  }

  let todoDocRef = null;
  function updateTodoRef() {
    if (db && state.targetUid) {
      todoDocRef = doc(db, "userTodos", state.targetUid);
    } else {
      todoDocRef = null;
    }
  }
  const LEGACY_TODO_DOC = () => doc(db, "adminData", "todoChecklist");
  const VERSION_DOC = () => doc(db, "adminData", "appMeta");

  async function loadFromFirestore() {
    try {
      if (!todoDocRef) {
        state.items = [];
        state.loaded = true;
        renderList();
        updateProgress();
        return;
      }
      const snap = await getDoc(todoDocRef);
      if (snap.exists()) {
        const data = snap.data();
        state.items = Array.isArray(data.items) ? data.items : [];
      } else {
        if (
          state.isAdmin &&
          state.currentUserUid &&
          state.currentUserUid === state.targetUid
        ) {
          try {
            const legacy = await getDoc(LEGACY_TODO_DOC());
            if (legacy.exists()) {
              const data = legacy.data() || {};
              state.items = Array.isArray(data.items) ? data.items : [];
              const payload = {
                items: state.items.map((i) => ({
                  text: i.text || "",
                  done: !!i.done,
                })),
                updatedAt: Date.now(),
                updatedBy:
                  (auth && auth.currentUser && auth.currentUser.uid) || null,
              };
              await setDoc(todoDocRef, payload, { merge: true });
            } else {
              state.items = [];
            }
          } catch (mErr) {
            console.warn("Legacy To-Do migration skipped:", mErr);
            state.items = [];
          }
        } else {
          state.items = [];
        }
      }
      state.loaded = true;
      renderList();
      updateProgress();
    } catch (e) {
      console.error("Failed to load To-Do:", e);
    }
  }

  async function loadVersionFromFirestore() {
    try {
      const snap = await getDoc(VERSION_DOC());
      if (snap.exists()) {
        const data = snap.data();
        if (data && typeof data.version === "string" && data.version.trim()) {
          state.version = data.version.trim();
        }
      }
    } catch (e) {
      console.warn("Failed to load version:", e);
    } finally {
      updateAllVersionDisplays();
    }
  }

  async function saveToFirestore() {
    try {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      if (!todoDocRef) return;
      const payload = {
        items: state.items.map((i) => ({ text: i.text || "", done: !!i.done })),
        updatedAt: Date.now(),
        updatedBy: (auth && auth.currentUser && auth.currentUser.uid) || null,
      };
      await setDoc(todoDocRef, payload, { merge: true });
    } catch (e) {
      console.error("Failed to save To-Do:", e);
    }
  }

  async function saveVersionToFirestore() {
    try {
      const payload = {
        version: state.version,
        versionUpdatedAt: Date.now(),
        versionUpdatedBy:
          (auth && auth.currentUser && auth.currentUser.uid) || null,
      };
      await setDoc(VERSION_DOC(), payload, { merge: true });
    } catch (e) {
      console.error("Failed to save version:", e);
    }
  }

  async function resetInFirestore() {
    try {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      if (!todoDocRef) return;
      await updateDoc(todoDocRef, { items: [], updatedAt: Date.now() });
      state.items = [];
      renderList();
      updateProgress();
    } catch (e) {
      try {
        if (!todoDocRef) return;
        await setDoc(todoDocRef, { items: [], updatedAt: Date.now() });
        state.items = [];
        renderList();
        updateProgress();
      } catch (err) {
        console.error("Failed to reset To-Do:", err);
      }
    }
  }

  function startInlineVersionEdit() {
    if (!state.isFirstAdmin || !els.versionText) return;
    if (els.versionText.dataset.editing === "1") return;
    els.versionText.dataset.editing = "1";
    const original = state.version || els.versionText.textContent || "";
    const input = document.createElement("input");
    input.type = "text";
    input.value = original;
    input.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-left: 12px;
      opacity: 0.95;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid var(--all-text);
      background: transparent;
      color: var(--text-color);
      outline: none;
      width: auto;
      min-width: 120px;`;
    const span = els.versionText;
    const parent = span.parentNode;
    const marker = document.createTextNode("");
    parent.replaceChild(marker, span);
    parent.insertBefore(input, marker);
    input.focus();
    input.setSelectionRange(0, input.value.length);
    let cancelled = false;
    if (els.versionEdit) els.versionEdit.textContent = "(save)";
    const saveNow = () => commit(input.value);
    if (els.versionEdit) els.versionEdit.addEventListener("click", saveNow);
    function commit(value) {
      parent.replaceChild(span, input);
      delete els.versionText.dataset.editing;
      if (els.versionEdit) {
        els.versionEdit.textContent = "(edit)";
        els.versionEdit.removeEventListener("click", saveNow);
      }
      if (cancelled) return;
      const next = String(value || "").trim();
      if (!next || next === original) {
        els.versionText.textContent = original;
        return;
      }
      state.version = next;
      updateAllVersionDisplays();
      saveVersionToFirestore().catch((e) =>
        console.warn("saveVersionToFirestore failed", e)
      );
    }
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit(input.value);
      } else if (e.key === "Escape") {
        cancelled = true;
        commit(original);
      }
    });
    input.addEventListener("blur", () => commit(input.value));
  }

  if (els.versionEdit)
    els.versionEdit.addEventListener("click", startInlineVersionEdit);
  if (els.versionText)
    els.versionText.addEventListener("click", startInlineVersionEdit);
  if (els.add)
    els.add.addEventListener("click", () => {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      if (!state.editing) setEditing(true);
      state.items.push({ text: "", done: false });
      renderList();
      updateButtons();
      if (state.editing) {
        const inputs = els.list.querySelectorAll('input[type="text"]');
        const last = inputs[inputs.length - 1];
        if (last) last.focus();
      }
    });
  if (els.edit)
    els.edit.addEventListener("click", () => {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      setEditing(true);
    });
  if (els.save)
    els.save.addEventListener("click", async () => {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      state.items = state.items
        .map((i) => ({ text: (i.text || "").trim(), done: !!i.done }))
        .filter((i) => i.text.length > 0);
      await saveToFirestore();
      setEditing(false);
      renderList();
      updateProgress();
    });
  if (els.reset)
    els.reset.addEventListener("click", () => {
      if (!state.currentUserUid || state.currentUserUid !== state.targetUid)
        return;
      showInlineResetConfirm();
    });

  function showInlineResetConfirm() {
    const controls = document.getElementById("todo-controls");
    if (!controls) return;
    if (controls.querySelector(".todo-reset-confirm")) return;
    const bar = document.createElement("div");
    bar.className = "todo-reset-confirm";
    bar.style.cssText = `
      display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 10px; margin-top: 8px;
      border: 1px solid var(--all-text); border-radius: 8px; background: rgba(150, 150, 150, 0.1);
      backdrop-filter: blur(6px);`;
    const msg = document.createElement("p");
    msg.textContent = "Reset To-Do list? This will clear all items.";
    msg.style.cssText = "font-size: 12px; opacity: 0.9; margin: 0 0 6px 0; text-align: left; width: 100%;";

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display: flex; gap: 6px; justify-content: flex-start; width: 100%;";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.className = "nav-bar6";
    confirmBtn.style.cssText = `padding: 5px 10px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-color); border: 1px solid var(--all-text);`;
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "nav-bar6";
    cancelBtn.style.cssText = confirmBtn.style.cssText;
    bar.appendChild(msg);
    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);
    bar.appendChild(btnRow);
    controls.appendChild(bar);
    cancelBtn.addEventListener("click", () => bar.remove());
    confirmBtn.addEventListener("click", async () => {
      try {
        await resetInFirestore();
        setEditing(false);
      } finally {
        bar.remove();
      }
    });
  }

  function applyAuth(user) {
    state.currentUserUid = user ? user.uid : null;
    state.isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
    state.isFirstAdmin = !!(
      user &&
      ADMIN_UIDS.length > 0 &&
      ADMIN_UIDS[0] === user.uid
    );
    const defaultAdmin = ADMIN_UIDS[0] || null;
    state.targetUid = state.currentUserUid
      ? state.currentUserUid
      : defaultAdmin;
    updateTodoRef();
    updateButtons();
  }

  // hook dashboard auth
  applyAuth(auth && auth.currentUser ? auth.currentUser : null);
  onAuthStateChanged(auth, (user) => {
    applyAuth(user);
    loadFromFirestore();
    loadVersionFromFirestore();
  });

  updateTodoRef();
  loadFromFirestore();
  loadVersionFromFirestore();
}

// Replace the existing showEditPostModal function
// Replace the existing showEditPostModal function
function showEditPostModal(post, postId) {
  return new Promise(async (resolve) => {
    // Organized tags by groups (same as library script)
    const tagGroups = {
      Timeline: [
        "Y1S2",
        "Y2S2",
        "Y2S3",
        "Y3S1",
        "Y3S2",
        "Y3S3",
        "Y4S1",
        "Y4S2",
      ],
      System: ["RS", "ES", "NS", "UGS", "CVS", "GIS", "MSS"],
      Subject: [
        "Anatomy",
        "Physiology",
        "Histology",
        "Pathology",
        "Microbiology",
        "Immunology",
        "Genetics",
        "Public Health",
        "Biostatisics",
        "HCM",
        "HIS",
        "BS",
        "CS",
        "IC",
      ],
      Others: [
        "Past papers",
        "USMLE",
        "Quiz",
        "QBank",
        "Summary",
        "Sheet",
        "Lab",
        "Midterm",
        "Final",
        "Exam",
      ],
    };

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.89);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    document.body.style.overflow = "hidden";

    overlay.addEventListener("click", () => {
      cleanup();
      resolve(null); // Cancel
    });

    // Modal box
    const modal = document.createElement("div");
    modal.style = `
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      border: none;
      padding: 20px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      text-align: center;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      color: white;
    `;

    // Stop click inside modal from closing overlay
    modal.addEventListener("click", (e) => e.stopPropagation());

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = post.title || "";
    titleInput.placeholder = "Title";
    titleInput.style = `
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 6px; border: 1px solid white; background: rgba(255,255,255,0.1); color: white;
    `;

    const contentInput = document.createElement("textarea");
    contentInput.value = post.content || "";
    contentInput.placeholder = "Content";
    contentInput.rows = 4;
    contentInput.style = `
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 6px; border: 1px solid white; background: rgba(255,255,255,0.1); color: white;
    `;

    const fileLinkInput = document.createElement("input");
    fileLinkInput.type = "text";
    fileLinkInput.value = post.fileLink || "";
    fileLinkInput.placeholder =
      "Google Drive or Telegram Preview Link or others (optional)";
    fileLinkInput.style = `
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 6px; border: 1px solid white; background: rgba(255,255,255,0.1); color: white;
    `;

    // Tag selection section with visual grouping
    const tagSection = document.createElement("div");
    tagSection.style = "margin-bottom: 15px; text-align: left;";

    const tagLabel = document.createElement("h4");
    tagLabel.textContent = "Library Tags:";
    tagLabel.style = "margin-bottom: 15px; color: white; text-align: center;";

    const tagContainer = document.createElement("div");
    tagContainer.style = `
      max-height: 300px; overflow-y: auto; 
      border: 1px solid rgba(255,255,255,0.3); padding: 20px; 
      background: rgba(255,255,255,0.05); border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    `;

    // Get current tags from library entry if exists
    let currentLibraryTags = [];
    try {
      const libraryQuery = query(
        collection(db, "library"),
        where("postId", "==", postId)
      );
      const librarySnapshot = await getDocs(libraryQuery);
      if (!librarySnapshot.empty) {
        const libraryData = librarySnapshot.docs[0].data();
        currentLibraryTags = libraryData.tags || [];
      }
    } catch (error) {
      console.error("Error fetching library tags:", error);
    }

    // Create visually grouped tag sections
    Object.entries(tagGroups).forEach(([groupName, tags]) => {
      // Create a card-like container for each group
      const groupCard = document.createElement("div");
      groupCard.style = `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--all-text);
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      `;

      // Add subtle hover effect to group cards
      groupCard.addEventListener("mouseenter", () => {
        groupCard.style.background = "rgba(255, 255, 255, 0.12)";
        groupCard.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
      });
      groupCard.addEventListener("mouseleave", () => {
        groupCard.style.background = "rgba(255, 255, 255, 0.08)";
        groupCard.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      });

      // Group heading with icon/color coding
      const groupHeading = document.createElement("div");
      groupHeading.textContent = groupName;

      // Color coding for different groups
      const groupColors = {
        Timeline: "#FF6B6B",
        System: "#4ECDC4",
        Subject: "#45B7D1",
        Others: "#96CEB4",
      };

      groupHeading.style = `
        font-weight: bold;
        color: ${groupColors[groupName] || "#4CAF50"};
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 2px solid ${groupColors[groupName] || "#4CAF50"};
        font-size: 16px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
      `;

      // Group container for tags with better spacing
      const groupContainer = document.createElement("div");
      groupContainer.style = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      `;

      tags.forEach((tag) => {
        const label = document.createElement("label");
        label.style = `
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.15);
          border: 1px solid var(--all-text);
          transition: all 0.3s ease;
          user-select: none;
          min-width: 70px;
          justify-content: center;
        `;

        // Enhanced hover and selection effects
        label.addEventListener("mouseenter", () => {
          if (!label.querySelector('input[type="checkbox"]').checked) {
            label.style.background = "rgba(255,255,255,0.25)";
            label.style.transform = "translateY(-1px)";
            label.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
          }
        });
        label.addEventListener("mouseleave", () => {
          const checkbox = label.querySelector('input[type="checkbox"]');
          if (checkbox.checked) {
            label.style.background = `${groupColors[groupName] || "#4CAF50"}40`;
            label.style.borderColor = groupColors[groupName] || "#4CAF50";
          } else {
            label.style.background = "rgba(255,255,255,0.15)";
            label.style.borderColor = "rgba(255,255,255,0.3)";
          }
          label.style.transform = "translateY(0)";
          label.style.boxShadow = "none";
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.checked = currentLibraryTags.includes(tag);
        checkbox.className = "edit-tag-checkbox";
        checkbox.style =
          "margin-right: 8px; cursor: pointer; transform: scale(1.1);";

        // Update label styling when checkbox changes
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            label.style.background = `${groupColors[groupName] || "#4CAF50"}40`;
            label.style.borderColor = groupColors[groupName] || "#4CAF50";
            label.style.color = "white";
            label.style.fontWeight = "bold";
          } else {
            label.style.background = "rgba(255,255,255,0.15)";
            label.style.borderColor = "rgba(255,255,255,0.3)";
            label.style.color = "white";
            label.style.fontWeight = "normal";
          }
        });

        // Set initial styling
        if (checkbox.checked) {
          label.style.background = `${groupColors[groupName] || "#4CAF50"}40`;
          label.style.borderColor = groupColors[groupName] || "#4CAF50";
          label.style.fontWeight = "bold";
        }

        const span = document.createElement("span");
        span.textContent = tag;
        span.style = "color: white; font-size: 12px;";

        label.appendChild(checkbox);
        label.appendChild(span);
        groupContainer.appendChild(label);
      });

      groupCard.appendChild(groupHeading);
      groupCard.appendChild(groupContainer);
      tagContainer.appendChild(groupCard);
    });

    tagSection.appendChild(tagLabel);
    tagSection.appendChild(tagContainer);

    const buttonsDiv = document.createElement("div");
    buttonsDiv.style =
      "display: flex; justify-content: space-around; margin-top: 20px;";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style = `
      padding: 12px 24px; background: #4caf50; color: white; border: none; 
      border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    saveBtn.addEventListener("mouseenter", () => {
      saveBtn.style.background = "#45a049";
      saveBtn.style.transform = "translateY(-2px)";
      saveBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });
    saveBtn.addEventListener("mouseleave", () => {
      saveBtn.style.background = "#4caf50";
      saveBtn.style.transform = "translateY(0)";
      saveBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    });

    // Replace the saveBtn.onclick handler in your showEditPostModal function with this:
    saveBtn.onclick = async () => {
      const selectedTags = Array.from(
        document.querySelectorAll(".edit-tag-checkbox:checked")
      ).map((cb) => cb.value);

      const updatedPost = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        fileLink: fileLinkInput.value.trim(),
      };

      // Always handle library entry - whether to update, create, or delete
      try {
        const db = getFirestore(window.firebaseApp);
        const libraryQuery = query(
          collection(db, "library"),
          where("postId", "==", postId)
        );
        const librarySnapshot = await getDocs(libraryQuery);

        if (selectedTags.length > 0) {
          // Tags are selected - update or create library entry
          if (!librarySnapshot.empty) {
            // Update existing library entry
            const libraryDoc = librarySnapshot.docs[0];
            await updateDoc(doc(db, "library", libraryDoc.id), {
              name: updatedPost.title,
              url: updatedPost.fileLink || "#",
              tags: selectedTags,
              // PRESERVE original content for reposting
              originalTitle: updatedPost.title,
              originalContent: updatedPost.content,
              originalFileLink: updatedPost.fileLink || "",
            });
            console.log(
              "Library entry updated with new tags and preserved content"
            );
          } else {
            // Create new library entry
            await addDoc(collection(db, "library"), {
              name: updatedPost.title,
              url: updatedPost.fileLink || "#",
              tags: selectedTags,
              timestamp: serverTimestamp(),
              postId: postId,
              // PRESERVE original content for reposting
              originalTitle: updatedPost.title,
              originalContent: updatedPost.content,
              originalFileLink: updatedPost.fileLink || "",
            });
            console.log("New library entry created with preserved content");
          }
        } else {
          // No tags selected - remove from library if it exists
          if (!librarySnapshot.empty) {
            const deletePromises = librarySnapshot.docs.map((libraryDoc) =>
              deleteDoc(doc(db, "library", libraryDoc.id))
            );
            await Promise.all(deletePromises);
            console.log("Library entry removed (no tags selected)");
          }
          // If no existing library entry and no tags, do nothing
        }

        // Refresh library if the refresh function exists
        if (typeof window.refreshLibrary === "function") {
          await window.refreshLibrary();
        }
      } catch (error) {
        console.error("Error updating library entry:", error);
      }

      cleanup();
      resolve(updatedPost);
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style = `
      padding: 12px 24px; background: #666; color: white; border: none; 
      border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#555";
      cancelBtn.style.transform = "translateY(-2px)";
      cancelBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#666";
      cancelBtn.style.transform = "translateY(0)";
      cancelBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    });

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(cancelBtn);

    modal.appendChild(titleInput);
    modal.appendChild(contentInput);
    modal.appendChild(fileLinkInput);
    modal.appendChild(tagSection);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup() {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    }
  });
}

// ADD THIS NEW FUNCTION - place it after showEditPostModal function
function showLibraryOnlyEditModal(postId, libraryData) {
  return new Promise(async (resolve) => {
    const tagGroups = {
      Timeline: [
        "Y1S2",
        "Y2S2",
        "Y2S3",
        "Y3S1",
        "Y3S2",
        "Y3S3",
        "Y4S1",
        "Y4S2",
      ],
      System: ["RS", "ES", "NS", "UGS", "CVS", "GIS", "MSS"],
      Subject: [
        "Anatomy",
        "Physiology",
        "Histology",
        "Pathology",
        "Microbiology",
        "Immunology",
        "Genetics",
        "Public Health",
        "Biostatisics",
        "HCM",
        "HIS",
        "BS",
        "CS",
        "IC",
      ],
      Others: [
        "Past papers",
        "USMLE",
        "Quiz",
        "QBank",
        "Summary",
        "Sheet",
        "Lab",
        "Midterm",
        "Final",
        "Exam",
      ],
    };

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.89);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    document.body.style.overflow = "hidden";

    overlay.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    // Modal box
    const modal = document.createElement("div");
    modal.style = `
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      border: none;
      padding: 20px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      text-align: center;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      color: white;
    `;

    modal.addEventListener("click", (e) => e.stopPropagation());

    // Title for library-only editing
    const titleDiv = document.createElement("h3");
    titleDiv.textContent = "Edit Library Entry";
    titleDiv.style = "margin-bottom: 20px; color: #2196F3;";
    modal.appendChild(titleDiv);

    // Library entry inputs
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = libraryData.name || "";
    nameInput.placeholder = "Entry Name";
    nameInput.style = `
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 6px; border: 1px solid white; background: rgba(255,255,255,0.1); color: white;
    `;

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = libraryData.url || "";
    urlInput.placeholder = "Entry URL/Link";
    urlInput.style = `
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 6px; border: 1px solid white; background: rgba(255,255,255,0.1); color: white;
    `;

    // Tag selection section
    const tagSection = document.createElement("div");
    tagSection.style = "margin-bottom: 15px; text-align: left;";

    const tagLabel = document.createElement("h4");
    tagLabel.textContent = "Library Tags:";
    tagLabel.style = "margin-bottom: 15px; color: white; text-align: center;";

    const tagContainer = document.createElement("div");
    tagContainer.style = `
      max-height: 300px; overflow-y: auto; 
      border: 1px solid rgba(255,255,255,0.3); padding: 20px; 
      background: rgba(255,255,255,0.05); border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    `;

    const currentTags = libraryData.tags || [];

    // Create tag groups
    Object.entries(tagGroups).forEach(([groupName, tags]) => {
      const groupCard = document.createElement("div");
      groupCard.style = `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--all-text);
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      `;

      const groupColors = {
        Timeline: "#FF6B6B",
        System: "#4ECDC4",
        Subject: "#45B7D1",
        Others: "#96CEB4",
      };

      const groupHeading = document.createElement("div");
      groupHeading.textContent = groupName;
      groupHeading.style = `
        font-weight: bold;
        color: ${groupColors[groupName] || "#4CAF50"};
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 2px solid ${groupColors[groupName] || "#4CAF50"};
        font-size: 16px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
      `;

      const groupContainer = document.createElement("div");
      groupContainer.style = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      `;

      tags.forEach((tag) => {
        const label = document.createElement("label");
        label.style = `
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.15);
          border: 1px solid var(--all-text);
          transition: all 0.3s ease;
          user-select: none;
          min-width: 70px;
          justify-content: center;
        `;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.checked = currentTags.includes(tag);
        checkbox.className = "library-edit-tag-checkbox";
        checkbox.style =
          "margin-right: 8px; cursor: pointer; transform: scale(1.1);";

        // Update styling based on checkbox state
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            label.style.background = `${groupColors[groupName] || "#4CAF50"}40`;
            label.style.borderColor = groupColors[groupName] || "#4CAF50";
            label.style.fontWeight = "bold";
          } else {
            label.style.background = "rgba(255,255,255,0.15)";
            label.style.borderColor = "rgba(255,255,255,0.3)";
            label.style.fontWeight = "normal";
          }
        });

        // Set initial styling
        if (checkbox.checked) {
          label.style.background = `${groupColors[groupName] || "#4CAF50"}40`;
          label.style.borderColor = groupColors[groupName] || "#4CAF50";
          label.style.fontWeight = "bold";
        }

        const span = document.createElement("span");
        span.textContent = tag;
        span.style = "color: white; font-size: 12px;";

        label.appendChild(checkbox);
        label.appendChild(span);
        groupContainer.appendChild(label);
      });

      groupCard.appendChild(groupHeading);
      groupCard.appendChild(groupContainer);
      tagContainer.appendChild(groupCard);
    });

    tagSection.appendChild(tagLabel);
    tagSection.appendChild(tagContainer);

    // Buttons
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style =
      "display: flex; justify-content: space-around; margin-top: 20px;";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Changes";
    saveBtn.style = `
      padding: 12px 24px; background: #4caf50; color: white; border: none; 
      border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;
    `;

    saveBtn.onclick = async () => {
      const selectedTags = Array.from(
        document.querySelectorAll(".library-edit-tag-checkbox:checked")
      ).map((cb) => cb.value);

      const updatedData = {
        name: nameInput.value.trim(),
        url: urlInput.value.trim(),
        tags: selectedTags,
      };

      cleanup();
      resolve(updatedData);
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style = `
      padding: 12px 24px; background: #666; color: white; border: none; 
      border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;
    `;

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(cancelBtn);

    modal.appendChild(nameInput);
    modal.appendChild(urlInput);
    modal.appendChild(tagSection);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup() {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    }
  });
}

function initDashboard() {
  console.log("[DASHBOARD] initDashboard called");

  const mainContent = document.getElementById("main-content");
  const logoutBtn = document.getElementById("logoutBtn");
  const navButtons = document.querySelectorAll(".nav-btn");

  const adminUIDs = ["WbuZJ31aQ6Qt0Wp9aWqlUInfihn2"];

  let currentUser = null;

  // Generate profile HTML dynamically
  function getProfileContent(user) {
    const lastLogin = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toLocaleString()
      : "N/A";
    const createdAt = user.metadata.creationTime
      ? new Date(user.metadata.creationTime).toLocaleString()
      : "N/A";

    return `
      <h1 style="padding-bottom:20px; text-align:center; margin-top: 30px;">Your Profile</h1>
      <div id="user-profile" style="text-align: center;margin-top: 10px; padding: 30px; width: 60%; margin: 0 auto;">
        <div class="user-profile-wrapper">
          <p><strong>UID:</strong> ${user.uid}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Name:</strong> ${user.displayName || "N/A"}</p>
          <p><strong>Last Login:</strong> ${lastLogin}</p>
          <p><strong>Account Created:</strong> ${createdAt}</p>
          ${
            user.photoURL
              ? `<img src="${user.photoURL}" alt="User Photo" style="max-width: 100px; max-height: 100px; border-radius: 50%; margin: 10px auto 0; margin-top: 30px; display: block;" />`
              : ""
          }
        </div>
      </div>
    `;
  }

  // Generate files content (static example)
  function getFilesContent() {
    const files = ["Coming Soon"];
    return `
      <h1 style="padding-bottom:10px; text-align:center; margin-top: 30px;">Your Files</h1>
      <div id="files-content">
        ${files
          .map(
            (file) =>
              `<p style="text-align:center; margin-top: 10px; padding: 50px; width: 30%; margin: 0 auto;   background: rgba(150, 150, 150, 0.205);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px); /* for Safari */
                border-radius: 25px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                border: none;">   Coming Soon <br/> May be cancelled later.  </div>
              </p>`
          )
          .join("")}
      </div>
    `;
  }

  // Generate posts content for admin or message for others
  function getPostsContent(isAdmin) {
    if (!isAdmin) {
      return `
      <p style="text-align:center;">You do not have permission to add posts.</p>
    `;
    }

    // Define available tags for selection
    const availableTags = [
      "Y1S2",
      "Y2S2",
      "Y2S3",
      "Y3S1",
      "Y3S2",
      "Y3S3",
      "Y4S1",
      "Y4S2",
      "RS",
      "ES",
      "NS",
      "UGS",
      "CVS",
      "GIS",
      "MSS",
      "Anatomy",
      "Physiology",
      "Histology",
      "Pathology",
      "Microbiology",
      "Immunology",
      "Genetics",
      "Public Health",
      "Biostatisics",
      "HCM",
      "HIS",
      "BS",
      "CS",
      "IC",
      "Past papers",
      "USMLE",
      "Quiz",
      "QBank",
      "Summary",
      "Sheet",
      "Lab",
      "Midterm",
      "Final",
      "Exam",
    ];

    return `
<h1 style="text-align:center; margin-top:30px">Your Post</h1>
<div id="admin-post-form" style="max-width: 500px; margin: 10px auto; margin-top: 20px;">
  <input id="post-title" style="font-size:19px; background:none; border:1px solid var(--all-text); width:100%; padding:8px; margin-bottom:15px;" type="text" placeholder="Title" />
  
  <textarea id="post-content" style="font-size:19px; background:none; border:1px solid var(--all-text); width:100%; padding:8px; margin-bottom:15px;" rows="4" placeholder="Content"></textarea>

  <input id="post-file-link" style="font-size:19px; background:none; border:1px solid var(--all-text); width:100%; padding:8px; margin-bottom:15px;" type="text" placeholder="Google Drive or Telegram Preview Link or others (optional)" />

 <!-- Tag Selection Section with Grouped Styling -->
  <div style="margin-bottom:20px;">
    <h3 style="margin-bottom:15px; color: var(--all-text); text-align: center;">Select Tags for Library:</h3>
    <div id="tag-selection" style="
      max-height: 400px; 
      overflow-y: auto; 
      border: 1px solid var(--all-text);
      padding: 20px; 
      background: rgba(255,255,255,0.05); 
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    ">
      ${(() => {
        const tagGroups = {
          Timeline: [
            "Y1S2",
            "Y2S2",
            "Y2S3",
            "Y3S1",
            "Y3S2",
            "Y3S3",
            "Y4S1",
            "Y4S2",
          ],
          System: ["RS", "ES", "NS", "UGS", "CVS", "GIS", "MSS"],
          Subject: [
            "Anatomy",
            "Physiology",
            "Histology",
            "Pathology",
            "Microbiology",
            "Immunology",
            "Genetics",
            "Public Health",
            "Biostatisics",
            "HCM",
            "HIS",
            "BS",
            "CS",
            "IC",
          ],
          Others: [
            "Past papers",
            "USMLE",
            "Quiz",
            "QBank",
            "Summary",
            "Sheet",
            "Lab",
            "Midterm",
            "Final",
            "Exam",
          ],
        };

        const groupColors = {
          Timeline: "#FF6B6B",
          System: "#4ECDC4",
          Subject: "#45B7D1",
          Others: "#96CEB4",
        };

        return Object.entries(tagGroups)
          .map(
            ([groupName, tags]) => `
          <div style="
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid var(--all-text);
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          " 
          onmouseenter="this.style.background='rgba(255, 255, 255, 0.12)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.4)';"
          onmouseleave="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.3)';">
            
            <div style="
              font-weight: bold;
              color: ${groupColors[groupName]};
              margin-bottom: 12px;
              padding: 8px 0;
              border-bottom: 2px solid ${groupColors[groupName]};
              font-size: 16px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">${groupName}</div>
            
            <div style="
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              justify-content: center;
            ">
              ${tags
                .map(
                  (tag) => `
                <label style="
                  display: inline-flex;
                  align-items: center;
                  cursor: pointer;
                  font-size: 13px;
                  padding: 6px 12px;
                  border-radius: 20px;
                  background: rgba(255,255,255,0.15);
                  border: 1px solid var(--all-text);
                  transition: all 0.3s ease;
                  user-select: none;
                  min-width: 70px;
                  justify-content: center;
                "
                onmouseenter="
                  if (!this.querySelector('input').checked) {
                    this.style.background='rgba(255,255,255,0.25)';
                    this.style.transform='translateY(-1px)';
                    this.style.boxShadow='0 2px 5px rgba(0,0,0,0.2)';
                  }
                "
                onmouseleave="
                  const checkbox = this.querySelector('input');
                  if (checkbox.checked) {
                    this.style.background='${groupColors[groupName]}40';
                    this.style.borderColor='${groupColors[groupName]}';
                  } else {
                    this.style.background='rgba(255,255,255,0.15)';
                    this.style.borderColor='rgba(255,255,255,0.3)';
                  }
                  this.style.transform='translateY(0)';
                  this.style.boxShadow='none';
                ">
                  <input type="checkbox" value="${tag}" class="tag-checkbox" style="margin-right: 8px; cursor: pointer; transform: scale(1.1);"
                    onchange="
                      const label = this.parentElement;
                      if (this.checked) {
                        label.style.background = '${groupColors[groupName]}40';
                        label.style.borderColor = '${groupColors[groupName]}';
                        label.style.color = 'white';
                        label.style.fontWeight = 'bold';
                      } else {
                        label.style.background = 'rgba(255,255,255,0.15)';
                        label.style.borderColor = 'rgba(255,255,255,0.3)';
                        label.style.color = 'white';
                        label.style.fontWeight = 'normal';
                      }
                    ">
                  <span style="color: var(--all-text); font-size: 12px;">${tag}</span>
                </label>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("");
      })()}
    </div>
    <p style="font-size:12px; color:var(--all-text); margin-top:10px; text-align: center;">Select tags that will appear in the library for this post. <br />Note that if no tags are selected, the post will not appear in the library, but only the home page.</p>
  </div>

  <button id="submit-post" style="
        background-color: transparent;
        color: var(--all-text);
        border: 1px solid var(--all-text);
        padding: 12px 24px;
        font-size: 16px;
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        font-weight: 600;
        min-width: 200px;
        display: block;
        margin: 0 auto 0 auto;
      "
      onmouseover="this.style.backgroundColor='var(--all-text)'; this.style.color='var(--scrl)'; this.style.boxShadow='0 6px 12px rgba(0,0,0,0.2)';"
      onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--all-text)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';">
    Submit Post
  </button>
  <p id="post-status" style="font-size:18px; font-weight:600; text-align:center;"></p>
</div>
<hr style="margin-top:20px" />
<h1 style="margin-top:70px; text-align:center;">Your Posts</h1>
<div id="posts-list">
  <!-- Posts will be rendered here -->
</div>
`;
  }

  // Show section content inside mainContent and animate
  function showSection(sectionName) {
    if (!currentUser) return;

    let html = "";
    const isAdmin = adminUIDs.includes(currentUser.uid);

    if (sectionName === "profile") {
      html = getProfileContent(currentUser);
    } else if (sectionName === "files") {
      html = getFilesContent();
    } else if (sectionName === "posts") {
      html = getPostsContent(isAdmin);
    } else if (sectionName === "todo") {
      html = getTodoContent();
    } else {
      html = "<p>Unknown section</p>";
    }

    mainContent.innerHTML = html;

    animateStackedFadeIn(mainContent);

    // Attach post form event if admin and on posts section
    if (sectionName === "posts" && isAdmin) {
      initPostForm();
      fetchAndRenderPosts(); // <--- Fetch and render posts here
    }

    // Initialize To-Do when section is shown
    if (sectionName === "todo") {
      initTodoDashboard();
    }

    // Save current section in localStorage
    localStorage.setItem("dashboardCurrentSection", sectionName);
  }

  // Post submit form handler
  function initPostForm() {
    const submitPostBtn = document.getElementById("submit-post");
    if (!submitPostBtn) return;

    submitPostBtn.onclick = async () => {
      const titleInput = document.getElementById("post-title");
      const contentInput = document.getElementById("post-content");
      const fileLinkInput = document.getElementById("post-file-link");
      const statusEl = document.getElementById("post-status");

      // Style the status element with transparent background
      statusEl.style = `
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      background: transparent;
      color: var(--all-text);
      margin-top: 8px;
      `;
      // Hidden by default; does not occupy space
      statusEl.style.display = "none";
      statusEl.style.background = "transparent";
      statusEl.style.color = "var(--all-text)";
      statusEl.style.border = "1px solid var(--all-text)";
      statusEl.style.transition = "all 0.3s ease";

      // Get selected tags
      const selectedTags = Array.from(
        document.querySelectorAll(".tag-checkbox:checked")
      ).map((checkbox) => checkbox.value);

      if (!titleInput.value.trim() || !contentInput.value.trim()) {
        statusEl.textContent = "Please enter both title and content.";
        statusEl.style.display = "block";

        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          statusEl.style.display = "none";
        }, 5000);
        return;
      }

      try {
        // Show loading message
        statusEl.textContent = "Submitting post...";
        statusEl.style.display = "block";

        // Add to posts collection (existing functionality)
        const docRef = await addDoc(collection(db, "posts"), {
          title: titleInput.value.trim(),
          content: contentInput.value.trim(),
          fileLink: fileLinkInput.value.trim() || "",
          timestamp: serverTimestamp(),
        });

        // Add to library collection (FIXED VERSION)
        if (selectedTags.length > 0) {
          await addDoc(collection(db, "library"), {
            name: titleInput.value.trim(),
            url: fileLinkInput.value.trim() || "#",
            tags: selectedTags,
            timestamp: serverTimestamp(),
            postId: docRef.id,
            // PRESERVE original post data for future reposting
            originalTitle: titleInput.value.trim(),
            originalContent: contentInput.value.trim(),
            originalFileLink: fileLinkInput.value.trim() || "",
          });
        }

        statusEl.textContent = "Post submitted successfully!";
        statusEl.style.display = "block";

        // Clear form
        titleInput.value = "";
        contentInput.value = "";
        fileLinkInput.value = "";

        // Uncheck all tag checkboxes
        document
          .querySelectorAll(".tag-checkbox")
          .forEach((cb) => (cb.checked = false));

        fetchAndRenderPosts(); // refresh posts list

        // Auto-hide success message after 6 seconds
        setTimeout(() => {
          statusEl.style.display = "none";
        }, 6000);
      } catch (error) {
        console.error("Error submitting post:", error);
        statusEl.innerHTML = `
        <strong>Error submitting post!</strong><br>
        ${error.message}
      `;
        statusEl.style.display = "block";

        // Auto-hide error message after 8 seconds
        setTimeout(() => {
          statusEl.style.display = "none";
        }, 8000);
      }
    };
  }

  // Animation for fade+slide on children
  function animateStackedFadeIn(container) {
    const children = Array.from(container.children);
    children.forEach((child) => {
      child.style.opacity = "0";
      child.style.transform = "translateY(20px)";
      child.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      child.style.transitionDelay = "0s";
    });

    void container.offsetWidth; // force reflow

    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.15}s`;
      child.style.opacity = "1";
      child.style.transform = "translateY(0)";
    });
  }

  // Listen for auth changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[DASHBOARD] User is logged in:", user.email);
      currentUser = user;

      // Show/hide Posts button based on admin
      navButtons.forEach((btn) => {
        if (btn.getAttribute("data-section") === "posts") {
          btn.style.display = adminUIDs.includes(user.uid)
            ? "inline-block"
            : "none";
        }
      });

      // Load last viewed section from localStorage or default to profile
      const savedSection = localStorage.getItem("dashboardCurrentSection");
      const validSections = ["profile", "files", "posts", "todo"];
      const sectionToShow = validSections.includes(savedSection)
        ? savedSection
        : "profile";

      // Update nav buttons active state accordingly
      navButtons.forEach((btn) => btn.classList.remove("active"));
      const activeBtn = [...navButtons].find(
        (btn) => btn.getAttribute("data-section") === sectionToShow
      );
      if (activeBtn) activeBtn.classList.add("active");

      // Show saved or default section
      showSection(sectionToShow);
    } else {
      console.log("[DASHBOARD] No user logged in");
      currentUser = null;
      mainContent.innerHTML =
        '<p style="font-size:19px; margin-top: -30px; text-align:center;   background: rgba(150, 150, 150, 0.205); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);  border-radius: 25px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); border: none; padding: 35px; width: 80%; margin: 0 auto;">Please log in to view dashboard.<br/> Press on the <a href="cont/011215071914/login01.html" style="text-decoration: none; color: inherit; font-weight: bold;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">&nbsp;Account<i style="font-size: 17px; padding-left: 10px" class="fa">&#xf007;</i></a>&nbsp;&nbsp;to&nbsp;login&nbsp;in.</p>';

      // Hide all nav buttons
      navButtons.forEach((btn) => {
        btn.style.display = "none";
        btn.classList.remove("active");
      });
    }
  });

  // Nav buttons event listeners
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const section = btn.getAttribute("data-section");
      showSection(section);
    });
  });

  // Logout handler
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      signOut(auth)
        .then(() => {
          console.log("[DASHBOARD] User signed out");
          // Reload or redirect for all users after logout
          window.location.href = "index.html"; // or window.location.reload();
        })
        .catch((error) => {
          console.error("[DASHBOARD] Sign out error:", error);
        });
    };
  }
}

function getEmbeddableDriveLink(link) {
  if (!link) return "";
  const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return link; // fallback to what user entered
}
// Enhanced function to check post existence in different locations
async function checkPostStatus(postId) {
  try {
    // Check if post exists in posts collection
    const postDoc = await getDoc(doc(db, "posts", postId));
    const existsInHome = postDoc.exists();

    // Check if post exists in library collection
    const libraryQuery = query(
      collection(db, "library"),
      where("postId", "==", postId)
    );
    const librarySnapshot = await getDocs(libraryQuery);
    const existsInLibrary = !librarySnapshot.empty;

    return {
      existsInHome,
      existsInLibrary,
      shouldShow: existsInHome || existsInLibrary, // Show if exists in either location
    };
  } catch (error) {
    console.error("Error checking post status:", error);
    return { existsInHome: false, existsInLibrary: false, shouldShow: false };
  }
}

// Enhanced delete modal that shows current status and disables unavailable options
async function showDeleteConfirmModalWithOptions(
  message,
  showOptions = false,
  postId = null
) {
  return new Promise(async (resolve) => {
    let postStatus = { existsInHome: true, existsInLibrary: true };

    // Check current post status if postId provided
    if (postId) {
      postStatus = await checkPostStatus(postId);
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.89);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    // Click to close overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null); // Cancel
      }
    });

    // Create modal box
    const modal = document.createElement("div");
    modal.style = `
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      padding: 25px;
      max-width: 450px;
      text-align: center;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      color: white;
    `;

    // Stop click inside modal from closing
    modal.addEventListener("click", (e) => e.stopPropagation());

    const msg = document.createElement("p");
    msg.textContent = message;
    msg.style = "margin-bottom: 20px; font-size: 16px;";

    modal.appendChild(msg);

    if (showOptions) {
      // Add status indicator
      const statusDiv = document.createElement("div");
      statusDiv.style = `
        margin: 15px 0;
        padding: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.2);
      `;

      const statusTitle = document.createElement("p");
      statusTitle.textContent = "Current Status:";
      statusTitle.style =
        "font-weight: bold; margin-bottom: 10px; font-size: 14px;";

      const homeStatus = document.createElement("p");
      homeStatus.innerHTML = `🏠 Home: <span style="color: ${
        postStatus.existsInHome ? "#4CAF50" : "#f44336"
      }">${postStatus.existsInHome ? "EXISTS" : "DELETED"}</span>`;
      homeStatus.style = "margin: 5px 0; font-size: 13px;";

      const libraryStatus = document.createElement("p");
      libraryStatus.innerHTML = `📚 Library: <span style="color: ${
        postStatus.existsInLibrary ? "#4CAF50" : "#f44336"
      }">${postStatus.existsInLibrary ? "EXISTS" : "DELETED"}</span>`;
      libraryStatus.style = "margin: 5px 0; font-size: 13px;";

      statusDiv.appendChild(statusTitle);
      statusDiv.appendChild(homeStatus);
      statusDiv.appendChild(libraryStatus);
      modal.appendChild(statusDiv);

      // Add option buttons for selective deletion
      const optionsDiv = document.createElement("div");
      optionsDiv.style =
        "margin: 20px 0; display: flex; flex-direction: column; gap: 10px;";

      // Delete from Home button
      const deleteFromHomeBtn = document.createElement("button");
      deleteFromHomeBtn.textContent = postStatus.existsInHome
        ? "Delete from Home only"
        : "Already deleted from Home";
      deleteFromHomeBtn.disabled = !postStatus.existsInHome;
      deleteFromHomeBtn.style = `
        padding: 10px 20px;
        background: ${postStatus.existsInHome ? "#ff9800" : "#555"};
        color: ${postStatus.existsInHome ? "white" : "#aaa"};
        border: none;
        border-radius: 6px;
        cursor: ${postStatus.existsInHome ? "pointer" : "not-allowed"};
        font-weight: bold;
        transition: background-color 0.3s ease;
        opacity: ${postStatus.existsInHome ? "1" : "0.6"};
      `;

      if (postStatus.existsInHome) {
        deleteFromHomeBtn.onmouseover = () =>
          (deleteFromHomeBtn.style.background = "#e68900");
        deleteFromHomeBtn.onmouseout = () =>
          (deleteFromHomeBtn.style.background = "#ff9800");
        deleteFromHomeBtn.onclick = () => {
          cleanup();
          resolve("home-only");
        };
      }

      // Delete from Library button
      const deleteFromLibraryBtn = document.createElement("button");
      deleteFromLibraryBtn.textContent = postStatus.existsInLibrary
        ? "Delete from Library only"
        : "Already deleted from Library";
      deleteFromLibraryBtn.disabled = !postStatus.existsInLibrary;
      deleteFromLibraryBtn.style = `
        padding: 10px 20px;
        background: ${postStatus.existsInLibrary ? "#2196f3" : "#555"};
        color: ${postStatus.existsInLibrary ? "white" : "#aaa"};
        border: none;
        border-radius: 6px;
        cursor: ${postStatus.existsInLibrary ? "pointer" : "not-allowed"};
        font-weight: bold;
        transition: background-color 0.3s ease;
        opacity: ${postStatus.existsInLibrary ? "1" : "0.6"};
      `;

      if (postStatus.existsInLibrary) {
        deleteFromLibraryBtn.onmouseover = () =>
          (deleteFromLibraryBtn.style.background = "#1976d2");
        deleteFromLibraryBtn.onmouseout = () =>
          (deleteFromLibraryBtn.style.background = "#2196f3");
        deleteFromLibraryBtn.onclick = () => {
          cleanup();
          resolve("library-only");
        };
      }

      // Delete from Both button
      const deleteBothBtn = document.createElement("button");
      const bothAvailable =
        postStatus.existsInHome && postStatus.existsInLibrary;
      const bothText = bothAvailable
        ? "Delete from Both"
        : postStatus.existsInHome
        ? "Delete remaining (Home only)"
        : postStatus.existsInLibrary
        ? "Delete remaining (Library only)"
        : "Already deleted from both";

      deleteBothBtn.textContent = bothText;
      deleteBothBtn.disabled =
        !postStatus.existsInHome && !postStatus.existsInLibrary;
      deleteBothBtn.style = `
        padding: 10px 20px;
        background: ${
          postStatus.existsInHome || postStatus.existsInLibrary
            ? "#d33"
            : "#555"
        };
        color: ${
          postStatus.existsInHome || postStatus.existsInLibrary
            ? "white"
            : "#aaa"
        };
        border: none;
        border-radius: 6px;
        cursor: ${
          postStatus.existsInHome || postStatus.existsInLibrary
            ? "pointer"
            : "not-allowed"
        };
        font-weight: bold;
        transition: background-color 0.3s ease;
        opacity: ${
          postStatus.existsInHome || postStatus.existsInLibrary ? "1" : "0.6"
        };
      `;

      if (postStatus.existsInHome || postStatus.existsInLibrary) {
        deleteBothBtn.onmouseover = () =>
          (deleteBothBtn.style.background = "#b71c1c");
        deleteBothBtn.onmouseout = () =>
          (deleteBothBtn.style.background = "#d33");
        deleteBothBtn.onclick = () => {
          cleanup();
          resolve("both");
        };
      }

      optionsDiv.appendChild(deleteFromHomeBtn);
      optionsDiv.appendChild(deleteFromLibraryBtn);
      optionsDiv.appendChild(deleteBothBtn);
      modal.appendChild(optionsDiv);

      // Separator
      const separator = document.createElement("hr");
      separator.style =
        "border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 20px 0 15px 0;";
      modal.appendChild(separator);
    }

    // Cancel button (always present)
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style = "display: flex; justify-content: center; gap: 15px;";

    if (!showOptions) {
      // Simple confirm/cancel for regular delete
      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Confirm Delete";
      confirmBtn.style = `
        padding: 10px 20px;
        background: #d33;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      `;
      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      buttonsDiv.appendChild(confirmBtn);
    }

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style = `
      padding: 10px 20px;
      background: #666;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    `;
    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    buttonsDiv.appendChild(cancelBtn);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup() {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    }
  });
}

// Enhanced fetchAndRenderPosts function that shows all posts with visual indicators
async function fetchAndRenderPosts() {
  const postsListDiv = document.getElementById("posts-list");
  if (!postsListDiv) return;

  postsListDiv.innerHTML = "Loading posts...";

  try {
    // Get all posts (including those only in library)
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(postsQuery);

    // Get all library entries to cross-reference
    const libraryQuery = query(collection(db, "library"));
    const librarySnapshot = await getDocs(libraryQuery);
    const libraryPostIds = new Set();
    const libraryPosts = new Map();
    const libraryDocs = new Map();

    librarySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.postId) {
        libraryPostIds.add(data.postId);
        libraryPosts.set(data.postId, data);
        libraryDocs.set(data.postId, doc.id);
      }
    });

    // Collect all unique post IDs and their data
    const allPosts = new Map();

    // Add posts from posts collection
    querySnapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;
      allPosts.set(postId, {
        ...post,
        postId,
        existsInHome: true,
        existsInLibrary: libraryPostIds.has(postId),
        libraryData: libraryPosts.get(postId),
        libraryDocId: libraryDocs.get(postId),
      });
    });

    // Add library-only posts (posts that exist in library but not in posts collection)
    for (const [postId, libraryData] of libraryPosts) {
      if (!allPosts.has(postId)) {
        // This is a library-only post, try to show some info
        allPosts.set(postId, {
          title: libraryData.name || "Library Entry",
          content: "This post exists only in the library",
          fileLink: libraryData.url || "",
          timestamp: libraryData.timestamp,
          postId,
          existsInHome: false,
          existsInLibrary: true,
          libraryData: libraryData,
          libraryDocId: libraryDocs.get(postId),
        });
      }
    }

    if (allPosts.size === 0) {
      postsListDiv.innerHTML =
        '<p style="text-align:center; margin-top:30px">No posts found.</p>';
      return;
    }

    postsListDiv.innerHTML = "";

    // Render all posts with status indicators
    for (const [postId, post] of allPosts) {
      const postDiv = document.createElement("div");
      postDiv.classList.add("post-item");

      // Different styling based on status
      let borderColor = "var(--all-text)";
      let opacity = "1";

      if (!post.existsInHome && !post.existsInLibrary) {
        borderColor = "#666";
        opacity = "0.5";
      } else if (!post.existsInHome) {
        borderColor = "#2196f3"; // Blue for library-only
      } else if (!post.existsInLibrary) {
        borderColor = "#ff9800"; // Orange for home-only
      }

      postDiv.style = `
        border: 2px solid ${borderColor};
        border-radius: 20px;
        padding: 18px;
        margin-bottom: 10px;
        position: relative;
        margin-top: 30px;
        opacity: ${opacity};
        transition: all 0.3s ease;
      `;

      // Status indicator
      const statusIndicator = document.createElement("div");
      statusIndicator.style = `
        position: absolute;
        top: 10px;
        left: 10px;
        display: flex;
        gap: 5px;
        font-size: 12px;
      `;

      if (post.existsInHome) {
        const homeTag = document.createElement("span");
        homeTag.textContent = "🏠";
        homeTag.title = "Exists in Home";
        homeTag.style =
          "background: rgba(76, 175, 80, 0.2); padding: 2px 6px; border-radius: 10px; border: 1px solid #4CAF50;";
        statusIndicator.appendChild(homeTag);
      }

      if (post.existsInLibrary) {
        const libraryTag = document.createElement("span");
        libraryTag.textContent = "📚";
        libraryTag.title = "Exists in Library";
        libraryTag.style =
          "background: rgba(33, 150, 243, 0.2); padding: 2px 6px; border-radius: 10px; border: 1px solid #2196F3;";
        statusIndicator.appendChild(libraryTag);
      }

      postDiv.appendChild(statusIndicator);

      // Post content with top margin to avoid overlap with status
      const contentDiv = document.createElement("div");
      contentDiv.style = "margin-top: 25px;";
      contentDiv.innerHTML = `
      <h3 style="margin:0 0 5px 0;">${post.title}</h3>
      <p style="margin:0 0 5px 0;">${post.content}</p>
    `;
      postDiv.appendChild(contentDiv);

      // Button positioning tracker
      let rightOffset = 17;

      // Delete button (only show if post exists somewhere)
      if (post.existsInHome || post.existsInLibrary) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "×";
        deleteBtn.title = "Delete post";
        deleteBtn.style = `
          position: absolute;
          top: 50%;
          right: ${rightOffset}px;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 35px;
          color: var(--all-text);
        `;
        deleteBtn.onclick = async () => {
          const deleteOption = await showDeleteConfirmModalWithOptions(
            "Choose how you want to delete this post:",
            true, // Show options
            postId // Pass postId for status checking
          );

          if (deleteOption) {
            try {
              await deletePostWithOptions(postId, deleteOption);
              // Always refresh to show updated status
              fetchAndRenderPosts();
            } catch (error) {
              console.error("Failed to delete post:", error);
              alert("Failed to delete post: " + error.message);
            }
          }
        };
        postDiv.appendChild(deleteBtn);
        rightOffset += 35; // Move next button left
      }

      // NEW: Repost to Home button (only show for library-only posts)
      if (!post.existsInHome && post.existsInLibrary && post.libraryData) {
        const repostBtn = document.createElement("button");
        repostBtn.textContent = "⟳";
        repostBtn.title = "Repost to Home";
        repostBtn.style = `
          position: absolute;
          top: 52%;
          right: ${rightOffset}px;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 25px;
          color: var(--all-text);
          font-weight: bold;
        `;

        repostBtn.onclick = async () => {
          const confirmed = await showRepostConfirmModal(post);
          if (confirmed) {
            try {
              await repostToHome(postId, post);
              fetchAndRenderPosts(); // Refresh to show updated status
            } catch (error) {
              console.error("Failed to repost:", error);
              alert("Failed to repost: " + error.message);
            }
          }
        };
        postDiv.appendChild(repostBtn);
        rightOffset += 40; // Move next button left
      }

      // Edit button - handle both home posts and library-only posts
      if (post.existsInHome) {
        // Regular edit button for home posts
        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.title = "Edit post";
        editBtn.style = `
          position: absolute;
          top: 50%;
          right: ${rightOffset}px;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 25px;
          color: var(--all-text);
        `;
        editBtn.onclick = async () => {
          const updated = await showEditPostModal(post, postId);
          if (updated) {
            try {
              await updateDoc(doc(db, "posts", postId), updated);
              fetchAndRenderPosts();
            } catch (error) {
              alert("Failed to update post: " + error.message);
            }
          }
        };
        postDiv.appendChild(editBtn);
      } else if (
        post.existsInLibrary &&
        post.libraryData &&
        post.libraryDocId
      ) {
        // Edit button for library-only posts
        const editLibraryBtn = document.createElement("button");
        editLibraryBtn.textContent = "✎";
        editLibraryBtn.title = "Edit library entry";
        editLibraryBtn.style = `
          position: absolute;
          top: 50%;
          right: ${rightOffset}px;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 25px;
          color: var(--all-text);
        `;
        editLibraryBtn.onclick = async () => {
          const updated = await showLibraryOnlyEditModal(
            postId,
            post.libraryData
          );
          if (updated) {
            try {
              // Update the library entry
              await updateDoc(doc(db, "library", post.libraryDocId), updated);

              // Refresh library if function exists
              if (typeof window.refreshLibrary === "function") {
                await window.refreshLibrary();
              }

              fetchAndRenderPosts(); // Refresh posts display
            } catch (error) {
              console.error("Failed to update library entry:", error);
              alert("Failed to update library entry: " + error.message);
            }
          }
        };
        postDiv.appendChild(editLibraryBtn);
      }

      postsListDiv.appendChild(postDiv);
    }
  } catch (error) {
    postsListDiv.innerHTML = `<p style="text-align:center; margin-top:25px">Error loading posts: ${error.message}</p>`;
  }
}

// NEW: Function to show repost confirmation modal
function showRepostConfirmModal(post) {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.89);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    document.body.style.overflow = "hidden";

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });

    // Create modal box
    const modal = document.createElement("div");
    modal.style = `
      background: rgba(150, 150, 150, 0.205);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      padding: 25px;
      max-width: 400px;
      text-align: center;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      color: white;
    `;

    modal.addEventListener("click", (e) => e.stopPropagation());

    const title = document.createElement("h3");
    title.textContent = "Repost to Home";
    title.style = "margin-bottom: 15px; color: #4CAF50;";

    const message = document.createElement("p");
    message.innerHTML = `
      Do you want to repost <strong>"${post.title}"</strong> back to the home page?<br/><br/>
      This will recreate the post in the home collection while keeping it in the library.
    `;
    message.style = "margin-bottom: 20px; font-size: 16px;";

    const buttonsDiv = document.createElement("div");
    buttonsDiv.style = "display: flex; justify-content: space-around;";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Repost";
    confirmBtn.style = `
      padding: 12px 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    `;

    confirmBtn.onmouseover = () => (confirmBtn.style.background = "#45a049");
    confirmBtn.onmouseout = () => (confirmBtn.style.background = "#4CAF50");

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style = `
      padding: 12px 24px;
      background: #666;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    `;
    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    buttonsDiv.appendChild(confirmBtn);
    buttonsDiv.appendChild(cancelBtn);

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup() {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    }
  });
}

// NEW: Function to repost a library-only post back to home
async function repostToHome(postId, post) {
  try {
    const postData = {
      title:
        post.libraryData?.originalTitle || post.libraryData?.name || post.title,
      content:
        post.libraryData?.originalContent ||
        post.content ||
        `Content for "${post.libraryData?.name || post.title}"`,
      fileLink:
        post.libraryData?.originalFileLink ||
        post.libraryData?.url ||
        post.fileLink ||
        "",
      timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, "posts", postId), postData);
    console.log(
      `Post ${postId} successfully reposted to home with original content`
    );
    return true;
  } catch (error) {
    console.error("Failed to repost to home:", error);
    throw error;
  }
}

window.initDashboard = initDashboard;

// Enhanced delete function that handles different delete options
async function deletePostWithOptions(postId, deleteOption = "both") {
  try {
    switch (deleteOption) {
      case "home-only":
        // Delete only from posts collection
        await deleteDoc(doc(db, "posts", postId));
        console.log(`Post ${postId} deleted from home only`);
        break;

      case "library-only":
        // Delete only from library collection
        const libraryQuery = query(
          collection(db, "library"),
          where("postId", "==", postId)
        );
        const librarySnapshot = await getDocs(libraryQuery);

        const deletePromises = librarySnapshot.docs.map((libraryDoc) =>
          deleteDoc(doc(db, "library", libraryDoc.id))
        );
        await Promise.all(deletePromises);
        console.log(`Post ${postId} deleted from library only`);
        break;

      case "both":
      default:
        // Delete from both collections (original behavior)
        const libraryQuery2 = query(
          collection(db, "library"),
          where("postId", "==", postId)
        );
        const librarySnapshot2 = await getDocs(libraryQuery2);

        const deleteLibraryPromises = librarySnapshot2.docs.map((libraryDoc) =>
          deleteDoc(doc(db, "library", libraryDoc.id))
        );

        await Promise.all(deleteLibraryPromises);
        await deleteDoc(doc(db, "posts", postId));
        console.log(`Post ${postId} deleted from both home and library`);
        break;
    }

    // Refresh library if the function exists
    if (typeof window.refreshLibrary === "function") {
      await window.refreshLibrary();
    }

    return true;
  } catch (error) {
    console.error("Failed to delete post:", error);
    throw error;
  }
}
