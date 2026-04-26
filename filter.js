(function () {
  if (window.__FILTER__) return;
  window.__FILTER__ = true;

  let running = false;

  // ===== UI =====
  const box = document.createElement("div");
  box.style = `
    position:fixed;
    bottom:20px;
    right:20px;
    width:220px;
    background:#111;
    color:#fff;
    padding:12px;
    border-radius:12px;
    z-index:999999;
    font-family:sans-serif;
    box-shadow:0 0 10px rgba(0,0,0,0.5);
  `;

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="font-weight:bold;">Auto Buy</span>
      <span id="light" style="width:10px;height:10px;border-radius:50%;background:red;"></span>
    </div>

    <div style="font-size:13px;margin-bottom:8px;">Target: ₹1000</div>

    <button id="start" style="width:100%;padding:6px;background:green;color:#fff;border:none;border-radius:6px;margin-bottom:6px;cursor:pointer;">Start</button>

    <button id="stop" style="width:100%;padding:6px;background:red;color:#fff;border:none;border-radius:6px;cursor:pointer;">Stop</button>

    <div id="status" style="margin-top:6px;font-size:12px;">Idle</div>
  `;

  document.body.appendChild(box);

  const status = document.getElementById("status");
  const light = document.getElementById("light");

  document.getElementById("start").onclick = () => {
    running = true;
    status.innerText = "Running";
    light.style.background = "lime";
    loop();
  };

  document.getElementById("stop").onclick = () => {
    running = false;
    status.innerText = "Stopped";
    light.style.background = "red";
  };

  function beep() {
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
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

  // ===== STRICT ₹1000 MATCH =====
  function findTargets() {
    return Array.from(document.querySelectorAll(".ml10"))
      .filter(el => {
        const text = el.innerText.replace(/\s+/g, '');
        return /₹1000(?!\d)/.test(text);
      });
  }

  function highlight(el) {
    el.style.outline = "3px solid red";
    el.style.background = "rgba(255,0,0,0.2)";
  }

  function findBuyText(startEl) {
    let current = startEl;

    while (current && current !== document.body) {
      let btn = current.querySelector(".van-button__text");
      if (btn && btn.innerText.trim() === "Buy") {
        return btn;
      }
      current = current.parentElement;
    }

    return null;
  }

  async function clickTargets(targets) {
    if (targets.length === 0) return false;

    for (let t of targets) {
      highlight(t);

      let buyText = findBuyText(t);

      if (buyText) {
        buyText.click();

        if (document.body.innerText.includes("Select Payment Method")) {
          beep();
          running = false;
          status.innerText = "Stopped (Payment Page)";
          light.style.background = "red";
          return true;
        }
      }
    }

    return false;
  }

  async function loop() {
    while (running) {

      if (document.body.innerText.includes("Select Payment Method")) {
        beep();
        running = false;
        status.innerText = "Stopped (Payment Page)";
        light.style.background = "red";
        return;
      }

      clickOtpUpi();
      clickLarge();

      await sleep(200);

      let targets = findTargets();

      if (targets.length > 0) {
        let success = await clickTargets(targets);
        if (success) return;
      }

      await sleep(200);
    }
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

})();
