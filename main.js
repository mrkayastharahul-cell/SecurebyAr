(async function () {
  if (window.__BOT__) return;
  window.__BOT__ = true;

  let running = false;

  const fahhh = new Audio(
    "https://www.myinstants.com/media/sounds/fahh.mp3"
  );

  const aayeinn = new Audio(
    "https://www.myinstants.com/media/sounds/aayein.mp3"
  );

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function onPaymentPage() {
    return document.body.innerText
      .toLowerCase()
      .includes("select method payment");
  }

  function clickOTPUPI() {
    document.querySelectorAll("button, div, span").forEach(el => {
      if (el.innerText?.toLowerCase().trim() === "otp-upi") {
        el.click();
      }
    });
  }

  function findBuyButton(startEl) {
    let current = startEl;

    while (current && current !== document.body) {
      const btn = current.querySelector(
        "button, .van-button__text"
      );

      if (
        btn &&
        btn.innerText?.toLowerCase().includes("buy")
      ) {
        return btn;
      }

      current = current.parentElement;
    }

    return null;
  }

  // STRICT AMOUNT MATCHING
  function findMatches(value) {
    const target = Number(
      String(value).replace(/,/g, "").trim()
    );

    if (!Number.isFinite(target)) return [];

    return [...document.querySelectorAll("[class*=row],[class*=item]")]
      .filter(row => {
        const text = row.innerText || "";

        const amounts = [...text.matchAll(
          /₹\s*([\d,]+(?:\.\d+)?)/g
        )].map(m =>
          Number(m[1].replace(/,/g, ""))
        );

        return amounts.some(amount => amount === target);
      });
  }

  function highlight(matches) {
    document
      .querySelectorAll("[class*=row],[class*=item]")
      .forEach(r => {
        r.style.outline = "";
        r.style.background = "";
      });

    matches.slice(0, 3).forEach(r => {
      r.style.outline = "2px solid green";
      r.style.background = "rgba(0,255,0,0.1)";
    });
  }

  function clickFreeChargeFast() {
    let tries = 0;

    const interval = setInterval(() => {
      const el = [...document.querySelectorAll(
        "button, div, span"
      )].find(e =>
        e.innerText?.toLowerCase().trim() === "freecharge"
      );

      if (el) {
        el.click();
        aayeinn.play();
        clearInterval(interval);
      }

      if (++tries > 10) {
        clearInterval(interval);
      }
    }, 120);
  }

  async function mainLoop(value, indicator) {
    while (running) {

      // ==========================================
      // NEW CYCLE
      // ==========================================

      // OTP-UPI
      clickOTPUPI();

      await sleep(100 + Math.random() * 80);

      // ==========================================
      // FIND EXACT AMOUNT
      // ==========================================

      const matches = findMatches(value);

      highlight(matches);

      if (matches.length > 0) {

        // Try up to 3 exact matches
        for (const row of matches.slice(0, 3)) {

          if (!running) return;

          const buyBtn = findBuyButton(row);

          if (!buyBtn) continue;

          await sleep(60 + Math.random() * 80);

          buyBtn.click();

          await sleep(120 + Math.random() * 100);

          // ======================================
          // PAYMENT PAGE CHECK
          // ======================================

          if (onPaymentPage()) {

            fahhh.play();

            await sleep(200);

            clickFreeChargeFast();

            running = false;
            indicator.style.background = "red";

            return;
          }
        }
      }

      // ==========================================
      // PAYMENT PAGE NOT FOUND
      // RESTART ENTIRE PROCESS
      // ==========================================

      if (running && !onPaymentPage()) {
        await sleep(150);
        continue;
      }
    }
  }

  function createUI() {
    const ui = document.createElement("div");

    ui.style = `
      position:fixed;
      bottom:20px;
      right:20px;
      width:240px;
      background:rgba(255,255,255,0.6);
      backdrop-filter:blur(10px);
      color:#000;
      padding:14px;
      border-radius:14px;
      z-index:999999999;
      font-family:sans-serif;
    `;

    ui.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <div>💰 Bot</div>

        <div id="dot"
          style="
            width:10px;
            height:10px;
            border-radius:50%;
            background:red;
          ">
        </div>
      </div>

      <input
        id="amt"
        placeholder="Amount"
        style="
          width:100%;
          margin-top:10px;
          padding:8px;
          border-radius:8px;
          border:1px solid #ccc;
          box-sizing:border-box;
        "
      />

      <button
        id="start"
        style="
          margin-top:10px;
          width:100%;
          padding:8px;
          background:#22c55e;
          color:#fff;
          border:none;
          border-radius:8px;
        ">
        Start
      </button>

      <button
        id="stop"
        style="
          margin-top:6px;
          width:100%;
          padding:8px;
          background:#ef4444;
          color:#fff;
          border:none;
          border-radius:8px;
        ">
        Stop
      </button>
    `;

    document.body.appendChild(ui);

    const input = ui.querySelector("#amt");
    const dot = ui.querySelector("#dot");

    function start() {
      if (running) return;

      if (!input.value.trim()) {
        alert("Enter amount");
        return;
      }

      running = true;
      dot.style.background = "green";

      mainLoop(input.value.trim(), dot);
    }

    function stop() {
      running = false;
      dot.style.background = "red";
    }

    ui.querySelector("#start").onclick = start;
    ui.querySelector("#stop").onclick = stop;
  }

  createUI();
})();
