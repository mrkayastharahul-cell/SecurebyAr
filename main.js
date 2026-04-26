(function () {
  "use strict";

  if (window.__AR_FINAL__) return;
  window.__AR_FINAL__ = true;

  let running = false;

  const STATE = {
    speed: 250,
    matches: 0,
    clicks: 0
  };

  // ===== UI =====
  const box = document.createElement("div");
  box.style = `
    position:fixed;bottom:20px;right:20px;width:260px;
    background:#f3f4f6;padding:14px;border-radius:14px;
    z-index:999999;font-family:sans-serif;
    box-shadow:0 8px 20px rgba(0,0,0,0.25);
  `;

  box.innerHTML = `
    <div id="dragHandle" style="display:flex;justify-content:space-between;cursor:move;">
      <b>AR Wallet FINAL</b>
      <span id="light" style="width:10px;height:10px;border-radius:50%;background:red;"></span>
    </div>

    <input id="amount" value="1000" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;" />

    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;">
      <span>M: <b id="m">0</b></span>
      <span>C: <b id="c">0</b></span>
    </div>

    <div style="display:flex;gap:6px;margin-top:8px;">
      <button id="start" style="flex:1;background:#22c55e;color:#fff;border:none;padding:6px;border-radius:6px;">Start</button>
      <button id="stop" style="flex:1;background:#ef4444;color:#fff;border:none;padding:6px;border-radius:6px;">Stop</button>
    </div>

    <div id="status" style="text-align:center;font-size:12px;margin-top:6px;">Idle</div>
  `;

  document.body.appendChild(box);

  const status = document.getElementById("status");
  const light = document.getElementById("light");
  const amountInput = document.getElementById("amount");
  const mEl = document.getElementById("m");
  const cEl = document.getElementById("c");

  function setStatus(type, txt) {
    status.innerText = txt;

    const colors = {
      idle: "gray",
      run: "lime",
      found: "blue",
      fail: "orange",
      success: "green"
    };

    light.style.background = colors[type] || "gray";
  }

  // ===== SOUND =====
  let ctx;

  function unlockAudio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playPop() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 1200;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    setTimeout(() => o.stop(), 300);
  }

  function playChime() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 800;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => o.stop(), 600);
  }

  // ===== HELPERS =====
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function clean(el) {
    return el.innerText.replace(/[^0-9]/g, "").replace(/^0+/, "");
  }

  function clickLarge() {
    const el = [...document.querySelectorAll("*")]
      .find(e => e.innerText === "Large");
    if (el) el.click();
  }

  function isPaymentPage() {
    return document.body.innerText.includes("Select Method Payment");
  }

  function clickMobiKwik() {
    const el = document.querySelector(".bgmobikwik");
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function highlight(rows) {
    document.querySelectorAll(".x-row").forEach(r => r.style.background = "");
    rows.forEach(el => {
      const row = el.closest(".x-row");
      if (row) row.style.background = "yellow";
    });
  }

  // ===== CORE LOOP =====
  async function loop() {
    while (running) {

      // STEP 1: Always click Large
      clickLarge();

      const val = amountInput.value.trim();
      const all = [...document.querySelectorAll(".ml10")];

      const matches = all.filter(el => clean(el) === val);

      STATE.matches = matches.length;
      mEl.innerText = matches.length;

      // STEP 2: NO MATCH → just wait → restart loop
      if (!matches.length) {
        setStatus("fail", "No Match");
        await sleep(STATE.speed);
        continue;
      }

      // STEP 3: MATCH FOUND
      setStatus("found", "Match Found");
      highlight(matches);

      // STEP 4: CLICK TOP 5
      for (let el of matches.slice(0, 5)) {

        const btn = el.closest(".x-row")?.querySelector("button");
        if (!btn) continue;

        btn.click();

        STATE.clicks++;
        cEl.innerText = STATE.clicks;

        await sleep(200);

        // STEP 5: CHECK PAYMENT
        if (isPaymentPage()) {

          playPop();

          setTimeout(() => {
            if (clickMobiKwik()) {
              playChime();
            }
          }, 500);

          setStatus("success", "Completed");
          running = false;
          return;
        }
      }

      await sleep(STATE.speed);
    }
  }

  // ===== CONTROLS =====
  document.getElementById("start").onclick = () => {
    unlockAudio();

    running = true;
    STATE.matches = 0;
    STATE.clicks = 0;

    mEl.innerText = 0;
    cEl.innerText = 0;

    setStatus("run", "Running");
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
