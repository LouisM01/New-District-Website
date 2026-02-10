const modal = document.getElementById("district-modal");
const modalBody = modal?.querySelector(".modal-body");
const modalTitle = modal?.querySelector("#modal-title");

const LOCKED_MESSAGE =
  "New District Productions exists to return power to the artist. Coming soon.";

const openModal = (name, message) => {
  if (!modal || !modalBody || !modalTitle) return;
  modalTitle.textContent = `No Entry — ${name}`;
  modalBody.textContent = message;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

document.querySelectorAll(".district.locked").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name || "Restricted";
    openModal(name, LOCKED_MESSAGE);
  });
});

modal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.close) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});
// === Map “camera” parallax ===
(() => {
  const map = document.getElementById("map");
  if (!map) return;

  const setVars = (x, y) => {
    map.style.setProperty("--mx", `${x}%`);
    map.style.setProperty("--my", `${y}%`);
  };

  // default center
  setVars(50, 50);

  map.addEventListener("mousemove", (e) => {
    const r = map.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setVars(x.toFixed(2), y.toFixed(2));
  });

  map.addEventListener("mouseleave", () => setVars(50, 50));
})();
(() => {
  const viewport = document.getElementById("mapViewport");
  const svg = document.getElementById("districtSVG");
  const tooltip = document.getElementById("mapTooltip");

  const layerBase = document.getElementById("layerBase");
  const layerRoads = document.getElementById("layerRoads");
  const layerLights = document.getElementById("layerLights");
  const layerDistricts = document.getElementById("layerDistricts");
  const layerLabels = document.getElementById("layerLabels");

  const streetPanel = document.getElementById("streetPanel");
  const streetTitle = document.getElementById("streetTitle");
  const streetSub = document.getElementById("streetSub");
  const resetBtn = document.getElementById("resetView");
  const closeStreet = document.getElementById("closeStreet");

  const STATE_BTNS = Array.from(document.querySelectorAll(".hud-btn[data-state]"));

  // Palette (locked by you)
  const CHARCOAL = "#2E2E2E";
  const WARM_1 = "#FFC738";
  const WARM_2 = "#C98A2A";

  // Motion lock
  const MICRO_ZOOM = 1.05; // 5% locked
  const PUSH_RETURN_MS = 900;

  // --- Utility ---
  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };

  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setTooltip(on, html, x = 16, y = 16) {
    tooltip.innerHTML = html;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.toggle("is-on", on);
  }

  // --- Map generation (London-ish: meandering “Thames” + grid blocks) ---
  function clearLayers() {
    [layerBase, layerRoads, layerLights, layerDistricts, layerLabels].forEach(l => (l.innerHTML = ""));
  }

  function drawBackground() {
    // subtle vignette in SVG space
    el("rect", { x: 0, y: 0, width: 1200, height: 700, fill: "rgba(0,0,0,0.25)" }, layerBase);
  }

  function riverPath() {
    // Big meander through “central” with epicentre in middle of a curve
    // Controlled randomness, but consistent feel.
    const pts = [
      [60, 210],
      [180, 250],
      [300, 340],
      [420, 300],
      [520, 220],
      [620, 260],
      [720, 360],
      [850, 420],
      [980, 380],
      [1140, 460],
    ];
    // Smooth-ish cubic path
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      const cx1 = px + (x - px) * 0.35;
      const cy1 = py + (y - py) * 0.10;
      const cx2 = px + (x - px) * 0.65;
      const cy2 = py + (y - py) * 0.90;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
    }
    return d;
  }

  function drawRiver() {
    const d = riverPath();
    // dark river body
    el("path", { d, fill: "none", stroke: "#0a0a0a", "stroke-width": 46, opacity: 0.85 }, layerBase);
    // edge glow (warm but restrained)
    el("path", { d, fill: "none", stroke: "url(#riverGlow)", "stroke-width": 18, opacity: 0.55, filter: "url(#softGlow)" }, layerBase);
    // inner line
    el("path", { d, fill: "none", stroke: CHARCOAL, "stroke-width": 6, opacity: 0.6 }, layerBase);
  }

  function drawRoadGrid() {
    // Grid blocks that “respect” the river by leaving a buffer.
    const riverBandY = (x) => {
      // rough y along the meander for “avoid river” logic
      // piecewise interpolation across our points
      const pts = [
        [60, 210],[180, 250],[300, 340],[420, 300],[520, 220],
        [620, 260],[720, 360],[850, 420],[980, 380],[1140, 460],
      ];
      for (let i = 1; i < pts.length; i++) {
        if (x <= pts[i][0]) {
          const [x1,y1]=pts[i-1], [x2,y2]=pts[i];
          const t = (x - x1) / (x2 - x1);
          return y1 + (y2 - y1) * t;
        }
      }
      return pts[pts.length-1][1];
    };

    const roadStyle = {
      fill: "none",
      stroke: "rgba(255,255,255,0.42)",
      "stroke-width": 2,
      "stroke-linecap": "round",
      opacity: 0.55
    };

    // Major arterials (curvy-ish, not purely grid)
    for (let i = 0; i < 8; i++) {
      const x1 = rand(80, 1120);
      const y1 = rand(80, 620);
      const x2 = clamp(x1 + rand(-420, 420), 40, 1160);
      const y2 = clamp(y1 + rand(-260, 260), 40, 660);

      // Avoid crossing river too much: if near river, nudge
      const midx = (x1 + x2) / 2;
      const ry = riverBandY(midx);
      const midy = (y1 + y2) / 2;
      const delta = midy - ry;
      const bump = clamp(delta, -1, 1) * 70;

      const d = `M ${x1} ${y1} C ${x1 + rand(60,140)} ${y1 + rand(-80,80)}, ${x2 - rand(60,140)} ${y2 + rand(-80,80) + bump}, ${x2} ${y2}`;
      el("path", { d, ...roadStyle, opacity: 0.38, "stroke-width": 3 }, layerRoads);
    }

    // Minor grid (sharp city blocks)
    const step = 46;
    for (let x = 60; x <= 1140; x += step) {
      const ry = riverBandY(x);
      for (let y = 60; y <= 660; y += step) {
        // carve a “river corridor”
        if (Math.abs(y - ry) < 42) continue;
        // short segments = blocks
        if (Math.random() < 0.55) {
          el("path", { d: `M ${x} ${y} L ${x + step} ${y}`, ...roadStyle, opacity: 0.22 }, layerRoads);
        }
        if (Math.random() < 0.55) {
          el("path", { d: `M ${x} ${y} L ${x} ${y + step}`, ...roadStyle, opacity: 0.22 }, layerRoads);
        }
      }
    }

    // Make roads feel alive: animated dash drift (STATE 1+2)
    Array.from(layerRoads.querySelectorAll("path")).forEach((p, idx) => {
      p.style.strokeDasharray = "8 14";
      p.style.animation = `dashDrift ${8 + (idx % 6)}s linear infinite`;
    });

    // inject keyframes once
    if (!document.getElementById("dashKeyframes")) {
      const s = document.createElement("style");
      s.id = "dashKeyframes";
      s.textContent = `
        @keyframes dashDrift { to { stroke-dashoffset: -220; } }
        @keyframes lightFlicker {
          0%{ opacity:0; transform:scale(.92); }
          35%{ opacity:.65; transform:scale(1.02); }
          55%{ opacity:.25; transform:scale(.98); }
          75%{ opacity:.95; transform:scale(1); }
          100%{ opacity:.80; transform:scale(1); }
        }
        @keyframes breathe {
          0%,100%{ opacity:.55; }
          50%{ opacity:.9; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  function drawLights(state) {
    // Warm lights that “flick on” (STATE 2), subtle pulse (STATE 1/3)
    const count = 140;
    for (let i = 0; i < count; i++) {
      const x = rand(80, 1120);
      const y = rand(80, 620);

      const r = rand(1.4, 2.6);
      const c = Math.random() < 0.65 ? WARM_1 : WARM_2;

      const dot = el("circle", { cx: x, cy: y, r, fill: c, opacity: 0.0, filter: "url(#softGlow)" }, layerLights);

      if (state === 2) {
        dot.style.transformOrigin = "center";
        dot.style.animation = `lightFlicker ${rand(0.6, 1.4)}s ease ${rand(0, 0.9)}s forwards`;
      } else {
        dot.setAttribute("opacity", rand(0.22, 0.65).toFixed(2));
        dot.style.animation = `breathe ${rand(2.2, 4.8)}s ease ${rand(0, 1.2)}s infinite`;
      }
    }
  }

  // Districts: film epicentre + scattered nodes
  const districts = [
    { id: "film", name: "Film Division", desc: "Epicentre hub.", status: "open" },
    { id: "masterclasses", name: "Masterclasses", desc: "Deep dives led by working directors.", status: "locked" },
    { id: "community", name: "Community", desc: "Meet the district. Events & collabs.", status: "locked" },
    { id: "development", name: "Development", desc: "Scripts, labs, slate building.", status: "locked" },
    { id: "projects", name: "Projects", desc: "Current & upcoming work.", status: "open" },
    { id: "writers-room", name: "Writers’ Room", desc: "TV + features in progress.", status: "locked" },
    { id: "music", name: "Music", desc: "Soundtracks, stems, sessions.", status: "locked" },
  ];

  function drawDistrictNodes() {
    // Epicentre placed inside a big meander (approx middle)
    const epicentre = { x: 560, y: 290 };

    // Epicentre glow (small concentrated glow — as per your preference)
    el("circle", { cx: epicentre.x, cy: epicentre.y, r: 18, fill: WARM_1, opacity: 0.9, filter: "url(#hardGlow)" }, layerDistricts);
    el("circle", { cx: epicentre.x, cy: epicentre.y, r: 42, fill: WARM_2, opacity: 0.18, filter: "url(#softGlow)" }, layerDistricts);

    // radial “roads lead to hub” spokes (subtle)
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      const x2 = epicentre.x + Math.cos(a) * rand(120, 260);
      const y2 = epicentre.y + Math.sin(a) * rand(90, 220);
      el("path", {
        d: `M ${epicentre.x} ${epicentre.y} L ${x2} ${y2}`,
        stroke: "rgba(255,255,255,.25)",
        "stroke-width": 1.8,
        opacity: 0.35
      }, layerRoads);
    }

    // Node positions: “seemingly random but sprawling out”
    const positions = [
      { x: epicentre.x, y: epicentre.y, r: 22 },               // film
      { x: 760, y: 190, r: 18 },
      { x: 310, y: 190, r: 18 },
      { x: 220, y: 420, r: 18 },
      { x: 780, y: 520, r: 18 },
      { x: 980, y: 300, r: 18 },
      { x: 460, y: 560, r: 18 },
    ];

    districts.forEach((d, idx) => {
      const p = positions[idx];
      const g = el("g", { class: `district-node ${d.status}`, "data-id": d.id }, layerDistricts);

      // Node
      el("circle", {
        class: "node",
        cx: p.x, cy: p.y, r: p.r,
        fill: d.status === "open" ? WARM_1 : "#999",
        opacity: d.status === "open" ? 0.9 : 0.35,
        filter: d.status === "open" ? "url(#hardGlow)" : "none"
      }, g);

      // Outer ring
      el("circle", {
        cx: p.x, cy: p.y, r: p.r + 10,
        fill: "none",
        stroke: d.status === "open" ? WARM_2 : "rgba(255,255,255,.18)",
        "stroke-width": 2,
        opacity: d.status === "open" ? 0.55 : 0.22
      }, g);

      // “No Entry” barrier tape for locked
      if (d.status === "locked") {
        const tape = el("path", {
          class: "barrier",
          d: `M ${p.x - p.r - 8} ${p.y - 4} L ${p.x + p.r + 8} ${p.y + 4}`,
          stroke: WARM_2,
          "stroke-width": 6,
          opacity: 0.8
        }, g);
        tape.style.filter = "url(#softGlow)";
        // chevrons
        el("path", {
          d: `M ${p.x - p.r - 6} ${p.y - 4} L ${p.x - p.r + 6} ${p.y + 4}
              M ${p.x - p.r + 18} ${p.y - 4} L ${p.x - p.r + 30} ${p.y + 4}
              M ${p.x - p.r + 42} ${p.y - 4} L ${p.x - p.r + 54} ${p.y + 4}
              M ${p.x - p.r + 66} ${p.y - 4} L ${p.x - p.r + 78} ${p.y + 4}`,
          stroke: "#0a0a0a",
          "stroke-width": 3,
          opacity: 0.9
        }, g);
      }

      // Label
      const label = el("text", {
        x: p.x,
        y: p.y + p.r + 28,
        "text-anchor": "middle",
        fill: "rgba(255,255,255,.78)",
        "font-size": 12,
        style: "letter-spacing:.12em;"
      }, layerLabels);
      label.textContent = d.name.toUpperCase();
    });
  }

  // --- State machine ---
  let currentState = 1;
  function setState(n) {
    currentState = n;
    viewport.dataset.state = String(n);

    clearLayers();
    drawBackground();
    drawRiver();
    drawRoadGrid();
    drawLights(n);
    drawDistrictNodes();

    // STATE 2: make lights “flick on” stronger overall
    if (n === 2) {
      layerRoads.style.opacity = "0.75";
      layerLights.style.opacity = "1";
    } else {
      layerRoads.style.opacity = "1";
      layerLights.style.opacity = "1";
    }

    // STATE 3: enable micro push interactions
    if (n === 3) enableMicroPush();
    else disableMicroPush();

    // Clean tooltip/panel
    setTooltip(false, "");
    streetPanel.classList.remove("is-open");
    streetPanel.setAttribute("aria-hidden", "true");
  }

  // --- Interactions ---
  let pushEnabled = false;
  let pushed = false;
  let returnTimer = null;

  function enableMicroPush() {
    pushEnabled = true;
    viewport.classList.add("is-push");
  }

  function disableMicroPush() {
    pushEnabled = false;
    viewport.classList.remove("is-push");
    viewport.style.transform = "";
    pushed = false;
    if (returnTimer) clearTimeout(returnTimer);
  }

  function pushIn(xPct, yPct) {
    // 5% zoom, with gentle translate towards cursor, then “resistance” returns to 0%
    const tx = (xPct - 0.5) * -22; // tiny parallax
    const ty = (yPct - 0.5) * -16;

    viewport.style.transform = `scale(${MICRO_ZOOM}) translate(${tx}px, ${ty}px)`;
    pushed = true;

    if (returnTimer) clearTimeout(returnTimer);
    returnTimer = setTimeout(() => {
      viewport.style.transition = `transform ${PUSH_RETURN_MS}ms ease`;
      viewport.style.transform = `scale(1) translate(0px,0px)`;
      setTimeout(() => { viewport.style.transition = ""; }, PUSH_RETURN_MS + 30);
      pushed = false;
    }, 260);
  }

  // Hover/click tooltips + locked “No entry”
  function bindDistrictEvents() {
    svg.addEventListener("mousemove", (e) => {
      const g = e.target.closest?.(".district-node");
      if (!g) return;

      const id = g.getAttribute("data-id");
      const d = districts.find(x => x.id === id);
      if (!d) return;

      const rect = viewport.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left + 14, 14, rect.width - 320);
      const y = clamp(e.clientY - rect.top + 14, 14, rect.height - 90);

      if (d.status === "locked") {
        setTooltip(true, `<strong>${d.name}</strong><br><span style="opacity:.85">NO ENTRY / COMING SOON</span><br><span style="opacity:.7">${d.desc}</span>`, x, y);
      } else {
        setTooltip(true, `<strong>${d.name}</strong><br><span style="opacity:.7">${d.desc}</span><br><span style="opacity:.85;color:${WARM_1}">CLICK TO ENTER</span>`, x, y);
      }
    });

    svg.addEventListener("mouseleave", () => setTooltip(false, ""));

    svg.addEventListener("click", (e) => {
      const g = e.target.closest?.(".district-node");
      if (!g) return;

      const id = g.getAttribute("data-id");
      const d = districts.find(x => x.id === id);
      if (!d) return;

      const rect = viewport.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;

      if (pushEnabled) pushIn(xPct, yPct);

      // Locked = visible but unreachable
      if (d.status === "locked") {
        // small shake to sell “blocked”
        viewport.animate(
          [{ transform: `translateX(0px)` }, { transform: `translateX(-6px)` }, { transform: `translateX(6px)` }, { transform: `translateX(0px)` }],
          { duration: 240, easing: "ease-in-out" }
        );
        return;
      }

      // Open = show “street level” panel (this is your push-in “entry” hook)
      streetTitle.textContent = d.name.toUpperCase();
      streetSub.textContent = d.id === "film" ? "Epicentre" : "Open District";

      document.getElementById("streetBody").innerHTML = `
        <p class="street-copy">${d.desc}</p>
        <div class="street-tags">
          <span class="tag">Open</span>
          <span class="tag">Explore</span>
          <span class="tag">Enter</span>
        </div>
        <p class="street-copy" style="margin-top:12px;opacity:.75">
          (Next: this panel becomes the “street-level” scene with gritty photo overlays + signage.)
        </p>
      `;

      streetPanel.classList.add("is-open");
      streetPanel.setAttribute("aria-hidden", "false");
    });
  }

  // --- HUD controls ---
  STATE_BTNS.forEach(btn => {
    btn.addEventListener("click", () => setState(Number(btn.dataset.state)));
  });

  resetBtn?.addEventListener("click", () => {
    viewport.style.transition = `transform 250ms ease`;
    viewport.style.transform = `scale(1) translate(0px,0px)`;
    setTimeout(() => (viewport.style.transition = ""), 260);
    setTooltip(false, "");
    streetPanel.classList.remove("is-open");
    streetPanel.setAttribute("aria-hidden", "true");
  });

  closeStreet?.addEventListener("click", () => {
    streetPanel.classList.remove("is-open");
    streetPanel.setAttribute("aria-hidden", "true");
  });

  // Init
  setState(1);
  bindDistrictEvents();
})();
