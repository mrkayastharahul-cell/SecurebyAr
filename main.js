(function () {
  if (window.__FILTER__) return;
  window.__FILTER__ = true;

  let running = false;

  // ===== UI =====
  const box = document.createElement("div");
  box.style = `
    position:fixed; bottom:20px; right:20px; width:220px;
    background:#111; color:#fff; padding:12px;
    border-radius:12px; z-index:999999;
    font-family:sans-serif; box-shadow:0 0 10px rgba(0,0,0,0.5);
  `;

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <b>Auto Buy</b>
      <span id="light" style="width:10px;height:10px;border-radius:50%;background:red;"></span>
    </div>

    <div style="font-size:13px;margin-bottom:8px;">Target: ₹1000</div>

    <button id="start" style="width:100%;padding:6px;background:green;color:#fff;border:none;border-radius:6px;margin-bottom:6px;">Start</button>
    <button id="stop" style="width:100%;padding:6px;background:red;color:#fff;border:none;border-radius:6px;">Stop</button>

    <div id="status" style="margin-top:6px;font-size:12px;">Idle</div>
  `;

  document.body.appendChild(box);

  const status = document.getElementById("status");
  const light = document.getElementById("light");

  document.getElementById("start").onclick = () => {
    running = true;
    unlockAudio();
    status.innerText = "Running";
    light.style.background = "lime";
    loop();
  };

  document.getElementById("stop").onclick = () => {
    running = false;
    status.innerText = "Stopped";
    light.style.background = "red";
  };

  // ===== SOUND =====
  let ctx;
  function unlockAudio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function pop() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 1200;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    setTimeout(() => o.stop(), 300);
  }

  function chime() {
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

  function isPaymentPage() {
    return document.body.innerText.includes("Select Method Payment") ||
           document.body.innerText.includes("Select Payment Method");
  }

  function clickOtpUpi() {
    document.querySelectorAll(".tab-title").forEach(t => {
      if (t.innerText.includes("OTP-UPI")) t.click();
    });
  }

  function clickLarge() {
    document.querySelectorAll(".txt").forEach(el => {
      if (el.innerText.trim() === "Large") el.click();
    });
  }

  function findTargets() {
    return Array.from(document.querySelectorAll(".ml10"))
      .filter(el => /₹1000(?!\d)/.test(el.innerText.replace(/\s+/g,'')));
  }

  function highlight(el) {
    el.style.outline = "3px solid red";
    el.style.background = "rgba(255,0,0,0.2)";
  }

  function findBuyText(startEl) {
    let current = startEl;
    while (current && current !== document.body) {
      let btn = current.querySelector(".van-button__text");
      if (btn && btn.innerText.trim() === "Buy") return btn;
      current = current.parentElement;
    }
    return null;
  }

  function clickMobiKwikWithRetry() {
    let tries = 0;

    const interval = setInterval(() => {
      const el = document.querySelector(".bgmobikwik");

      if (el) {
        el.click();
        chime();
        clearInterval(interval);
      }

      if (++tries > 10) {
        status.innerText = "MobiKwik Failed";
        clearInterval(interval);
      }
    }, 300);
  }

  async function handleSuccess() {
    pop();

    setTimeout(() => {
      clickMobiKwikWithRetry();
    }, 500);

    running = false;
    status.innerText = "Done (Payment)";
    light.style.background = "red";
  }

  async function clickTargets(targets) {
    for (let t of targets.slice(0, 5)) {

      highlight(t);

      let buyText = findBuyText(t);
      if (!buyText) continue;

      buyText.click();

      // ⚡ instant check
      if (isPaymentPage()) {
        await handleSuccess();
        return true;
      }

      // fallback check
      await sleep(200);

      if (isPaymentPage()) {
        await handleSuccess();
        return true;
      }
    }
    return false;
  }

  // ===== MAIN LOOP =====
  async function loop() {
    while (running) {

      clickOtpUpi();
      clickLarge();

      await sleep(200);

      let targets = findTargets();

      if (targets.length > 0) {
        let success = await clickTargets(targets);
        if (success) return;

        // ✅ FAST LOOP
        await sleep(200);

      } else {
        // ❌ SLOW LOOP
        await sleep(500);
        continue;
      }
    }
  }

})();
