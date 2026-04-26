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
    position:fixed;bottom:20px;right:20px;width:250px;
    background:#f3f4f6;padding:14px;border-radius:14px;
    z-index:999999;font-family:sans-serif;
    box-shadow:0 8px 20px rgba(0,0,0,0.25);
  `;

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <b>AR Wallet</b>
      <span id="light" style="width:10px;height:10px;border-radius:50%;background:red;"></span>
    </div>

    <input id="amount" value="1000" style="width:100%;margin-top:8px;padding:6px;" />

    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;">
      <span>M: <b id="m">0</b></span>
      <span>C: <b id="c">0</b></span>
    </div>

    <div style="display:flex;gap:6px;margin-top:8px;">
      <button id="start" style="flex:1;background:green;color:#fff;">Start</button>
      <button id="stop" style="flex:1;background:red;color:#fff;">Stop</button>
    </div>

    <div id="status" style="text-align:center;font-size:12px;margin-top:6px;">Idle</div>
  `;

  document.body.appendChild(box);

  const status = document.getElementById("status");
  const light = document.getElementById("light");
  const amountInput = document.getElementById("amount");
  const mEl = document.getElementById("m");
  const cEl = document.getElementById("c");

  function setStatus(t, txt) {
    status.innerText = txt;
    light.style.background = {
      idle: "gray",
      run: "lime",
      found: "blue",
      fail: "red",
      success: "green"
    }[t] || "gray";
  }

  // ===== SOUND =====
  let ctx;
  function unlock() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function pop() {
    if (!ctx) return;
    let o = ctx.createOscillator();
    let g = ctx.createGain();
    o.frequency.value = 1200;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    setTimeout(() => o.stop(), 300);
  }

  function chime() {
    if (!ctx) return;
    let o = ctx.createOscillator();
    let g = ctx.createGain();
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

  function clickDefault() {
    const el = [...document.querySelectorAll("*")]
      .find(e => e.innerText === "Default");
    if (el) el.click();
  }

  function isPayment() {
    return document.body.innerText.includes("Select Method Payment");
  }

  function clickMobi() {
    const el = document.querySelector(".bgmobikwik");
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function clearHighlight() {
    document.querySelectorAll(".x-row").forEach(r => {
      r.style.background = "";
    });
  }

  function highlight(arr) {
    clearHighlight();
    arr.forEach(el => {
      el.closest(".x-row")?.style.background = "yellow";
    });
  }

  // ===== LOOP =====
  async function loop() {
    while (running) {

      // STEP 1: click Default
      clickDefault();

      await sleep(150);

      const val = amountInput.value.trim();
      const all = [...document.querySelectorAll(".ml10")];

      const matches = all.filter(el => clean(el) === val);

      STATE.matches = matches.length;
      mEl.innerText = matches.length;

      if (!matches.length) {
        setStatus("fail", "No Match");

        await sleep(STATE.speed);
        continue;
      }

      setStatus("found", "Match Found");

      highlight(matches);

      for (let el of matches.slice(0, 5)) {

        const btn = el.closest(".x-row")?.querySelector("button");
        if (!btn) continue;

        btn.click();
        STATE.clicks++;
        cEl.innerText = STATE.clicks;

        await sleep(200);

        if (isPayment()) {

          pop();

          setTimeout(() => {
            if (clickMobi()) {
              chime();
            }
          }, 500);

          setStatus("success", "Done");
          running = false;
          return;
        }
      }

      await sleep(STATE.speed);
    }
  }

  // ===== CONTROLS =====
  document.getElementById("start").onclick = () => {
    unlock();
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

})();
