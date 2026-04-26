(function () {
  "use strict";

  if (window.__AR_FINAL__) return;
  window.__AR_FINAL__ = true;

  // ===== STATE =====
  let running = false;

  const STATE = {
    matches: 0,
    clicks: 0,
    speed: 500
  };

  // ===== UI =====
  const box = document.createElement("div");
  box.style = `
    position:fixed;
    bottom:20px;
    right:20px;
    width:250px;
    background:#f3f4f6;
    color:#111;
    padding:14px;
    border-radius:14px;
    z-index:999999;
    font-family:sans-serif;
    box-shadow:0 8px 20px rgba(0,0,0,0.25);
    cursor:move;
  `;

  box.innerHTML = `
    <div id="dragHandle" style="display:flex;justify-content:space-between;margin-bottom:8px;">
      <span style="font-weight:600;">AR Wallet PRO</span>
      <span id="light" style="width:10px;height:10px;border-radius:50%;background:red;"></span>
    </div>

    <input id="amount" value="1000" style="width:100%;padding:8px;border-radius:8px;margin-bottom:8px;" />

    <select id="speed" style="width:100%;margin-bottom:8px;">
      <option value="200">⚡ Fast</option>
      <option value="500" selected>⚖️ Normal</option>
      <option value="1000">🐢 Slow</option>
    </select>

    <div style="display:flex;justify-content:space-between;font-size:12px;">
      <span>Matches: <b id="m">0</b></span>
      <span>Clicks: <b id="c">0</b></span>
    </div>

    <div style="display:flex;gap:8px;margin-top:8px;">
      <button id="start" style="flex:1;background:#22c55e;color:#fff;">Start</button>
      <button id="stop" style="flex:1;background:#ef4444;color:#fff;">Stop</button>
    </div>

    <div id="status" style="text-align:center;margin-top:6px;font-size:12px;">Idle</div>
  `;

  document.body.appendChild(box);

  const status = document.getElementById("status");
  const light = document.getElementById("light");
  const amountInput = document.getElementById("amount");
  const speedSelect = document.getElementById("speed");

  const mEl = document.getElementById("m");
  const cEl = document.getElementById("c");

  // ===== STATUS =====
  function setStatus(type, text) {
    status.innerText = text;

    const colors = {
      idle: "gray",
      running: "lime",
      searching: "orange",
      found: "blue",
      success: "green",
      failed: "red"
    };

    light.style.background = colors[type] || "gray";
  }

  function updateMatches(n) {
    STATE.matches = n;
    mEl.innerText = n;
  }

  function addClick() {
    STATE.clicks++;
    cEl.innerText = STATE.clicks;
  }

  speedSelect.onchange = () => {
    STATE.speed = parseInt(speedSelect.value);
  };

  // ===== HELPERS =====
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getClean(el) {
    return el.innerText.replace(/[^0-9]/g, "").replace(/^0+/, "");
  }

  function isPaymentPage() {
    return document.body.innerText.includes("Select Payment Method");
  }

  function clickMobiKwik() {
    let tries = 0;

    const interval = setInterval(() => {
      const el = document.querySelector(".bgmobikwik");

      if (el) {
        el.click();
        setStatus("success", "Payment Selected");
        clearInterval(interval);
      }

      if (++tries > 10) {
        setStatus("failed", "Payment Failed");
        clearInterval(interval);
      }
    }, 300);
  }

  function clickLarge() {
    const el = [...document.querySelectorAll("*")]
      .find(e => e.innerText?.toLowerCase().includes("large"));

    if (el) el.click();
  }

  function clickDefault() {
    const el = [...document.querySelectorAll("*")]
      .find(e => e.innerText?.toLowerCase().trim() === "default");

    if (el) el.click();
  }

  // ===== CORE LOOP =====
  async function loop() {
    while (running) {

      // STEP 1: ensure LARGE selected
      clickLarge();

      const val = amountInput.value.trim();

      // STEP 2: scan rows
      let all = [...document.querySelectorAll(".ml10")];
      let matches = all.filter(el => getClean(el) === val);

      updateMatches(matches.length);

      if (!matches.length) {
        setStatus("searching", "No Match");
        clickDefault();
        await sleep(STATE.speed);
        continue;
      }

      setStatus("found", "Match Found");

      // STEP 3: click buy
      for (let el of matches.slice(0, 3)) {

        const row = el.closest(".x-row");
        const btn = row?.querySelector("button");

        if (!btn) continue;

        btn.click();
        addClick();

        await sleep(500);

        // STEP 4: wait for payment
        let success = false;

        for (let i = 0; i < 10; i++) {
          if (isPaymentPage()) {
            success = true;
            break;
          }
          await sleep(200);
        }

        if (!success) {
          setStatus("failed", "Retrying...");
          continue;
        }

        // STEP 5: SUCCESS FLOW
        setStatus("success", "Payment Page");

        setTimeout(() => {
          clickMobiKwik();
        }, 800);

        running = false;
        return;
      }

      await sleep(STATE.speed);
    }
  }

  // ===== BUTTONS =====
  document.getElementById("start").onclick = () => {
    running = true;

    STATE.matches = 0;
    STATE.clicks = 0;
    updateMatches(0);
    cEl.innerText = 0;

    setStatus("running", "Running");
    loop();
  };

  document.getElementById("stop").onclick = () => {
    running = false;
    setStatus("idle", "Stopped");
  };

  // ===== DRAG =====
  let isDragging = false, offsetX, offsetY;

  document.getElementById("dragHandle").onmousedown = (e) => {
    isDragging = true;
    const rect = box.getBoundingClientRect();

    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.right = "auto";
    box.style.bottom = "auto";

    offsetX = e.clientX - box.offsetLeft;
    offsetY = e.clientY - box.offsetTop;
  };

  document.onmousemove = (e) => {
    if (isDragging) {
      box.style.left = (e.clientX - offsetX) + "px";
      box.style.top = (e.clientY - offsetY) + "px";
    }
  };

  document.onmouseup = () => isDragging = false;

})();
