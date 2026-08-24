/* SuperMini Challenge — 2026 schedule + live countdown.
   Single source of truth for race dates. Edit SCHEDULE / TRACKS to update. */
(function () {
  const SCHEDULE = [
    { series: "Rubber Craft Australian Championship",       round: "R1", circuit: "Morgan Park",            loc: "QLD", start: "2026-03-27", end: "2026-03-29" },
    { series: "Rubber Craft Australian Championship",       round: "R2", circuit: "Sydney Motorsport Park", loc: "NSW", start: "2026-06-12", end: "2026-06-13" },
    { series: "Rubber Craft Australian Championship",       round: "R3", circuit: "The Bend Motorsport Park", loc: "SA", start: "2026-08-21", end: "2026-08-23" },
    { series: "Rubber Craft Queensland State Championship", round: "R1", circuit: "Queensland Raceway",     loc: "QLD", start: "2026-02-28", end: "2026-03-01" },
    { series: "Rubber Craft Queensland State Championship", round: "R2", circuit: "Morgan Park",            loc: "QLD", start: "2026-03-27", end: "2026-03-29" },
    { series: "Rubber Craft Queensland State Championship", round: "R3", circuit: "Morgan Park",            loc: "QLD", start: "2026-05-22", end: "2026-05-24" },
    { series: "Rubber Craft Queensland State Championship", round: "R4", circuit: "Queensland Raceway",     loc: "QLD", start: "2026-09-19", end: "2026-09-20" },
    { series: "Rubber Craft Queensland State Championship", round: "R5", circuit: "Morgan Park",            loc: "QLD", start: "2026-11-06", end: "2026-11-08" },
  ];
  window.SMC_SCHEDULE = SCHEDULE;

  /* Per-circuit presentation data — single source of truth for the home hero
     image, the event page and the calendar track maps. Add a circuit here and
     every data-driven page picks it up automatically.
     NOTE: real `hero` photos exist for Queensland Raceway and The Bend only;
     the other two fall back to hero-grid.jpg until photos are supplied.
     `blurb` is the intro sentence on the event page — review the wording. */
  const CIRCUITS = {
    "The Bend Motorsport Park": {
      short: "The Bend",
      city:  "Tailem Bend, South Australia",
      map:   "assets/img/tracks/the-bend.png?v=5",
      hero:  "assets/img/hero-bend.png",
      blurb: "one of the longest and most modern circuits in the world",
    },
    "Sydney Motorsport Park": {
      short: "Sydney Motorsport Park",
      city:  "Eastern Creek, New South Wales",
      map:   "assets/img/tracks/sydney.png?v=5",
      hero:  "assets/img/hero-grid.jpg",
      blurb: "Sydney's home of circuit racing",
    },
    "Queensland Raceway": {
      short: "Queensland Raceway",
      city:  "Ipswich, Queensland",
      map:   "assets/img/tracks/queensland.png?v=5",
      hero:  "assets/img/hero-qr.webp?v=2",
      blurb: "a fast, flat circuit just west of Brisbane",
    },
    "Morgan Park": {
      short: "Morgan Park",
      city:  "Warwick, Queensland",
      map:   "assets/img/tracks/morgan-park.png?v=5",
      hero:  "assets/img/hero-grid.jpg",
      blurb: "a tight, technical circuit on the Darling Downs",
    },
  };
  window.SMC_CIRCUITS = CIRCUITS;

  const FALLBACK_HERO = "assets/img/hero-grid.jpg";
  function circuitOf(name) { return CIRCUITS[name] || {}; }

  /* Derived from CIRCUITS so there is only one place to edit. */
  const TRACKS = {};
  Object.keys(CIRCUITS).forEach(function (k) { TRACKS[k] = CIRCUITS[k].map; });

  /* Default session pattern by event length (number of days). A round can
     override it by adding a `sessions` array to its SCHEDULE entry, e.g.
       sessions: [[0,"Practice"],[1,"Qualifying"],[1,"Race 1"]]
     where the first value is the day offset from `start`.
     These are assumed patterns — actual times come from the supp regs. */
  const SESSION_PATTERNS = {
    1: [[0, "Qualifying"], [0, "Race 1"], [0, "Race 2"]],
    2: [[0, "Practice"], [0, "Qualifying"], [0, "Race 1"], [1, "Race 2"], [1, "Race 3"]],
    3: [[0, "Practice"], [1, "Qualifying"], [1, "Race 1"], [2, "Race 2"], [2, "Race 3"]],
  };

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function startDT(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 8, 0, 0); }
  function endDT(s)   { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 23, 59, 59); }

  function status(r, now) {
    if (now > endDT(r.end)) return "complete";
    if (now >= startDT(r.start)) return "live";
    return "upcoming";
  }

  function prettyRange(start, end) {
    const a = start.split("-").map(Number), b = end.split("-").map(Number);
    const sd = a[2], sm = a[1], ed = b[2], em = b[1], ey = b[0];
    if (sm === em) return sd + "–" + ed + " " + MONTHS[em - 1] + " " + ey;
    return sd + " " + MONTHS[sm - 1] + " – " + ed + " " + MONTHS[em - 1] + " " + ey;
  }

  function nextRace(now) {
    return SCHEDULE
      .filter(function (r) { return status(r, now) !== "complete"; })
      .sort(function (x, y) { return startDT(x.start) - startDT(y.start); })[0] || null;
  }

  function lastRace() {
    return SCHEDULE.slice()
      .sort(function (x, y) { return startDT(y.start) - startDT(x.start); })[0] || null;
  }

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* Inclusive day count for a round: 19–20 Sep = 2, 21–23 Aug = 3. */
  function dayCount(r) {
    return Math.round((startDT(r.end) - startDT(r.start)) / 86400000) + 1;
  }

  function dayLabel(startStr, offset) {
    const d = startDT(startStr);
    d.setDate(d.getDate() + offset);
    return DAY_NAMES[d.getDay()] + " " + d.getDate() + " " + MON_SHORT[d.getMonth()];
  }

  function sessionsFor(r) {
    return r.sessions || SESSION_PATTERNS[dayCount(r)] || SESSION_PATTERNS[3];
  }

  /* Compact range for the spec tiles: "19–20 Sep", "28 Feb – 1 Mar". */
  function shortRange(start, end) {
    const a = start.split("-").map(Number), b = end.split("-").map(Number);
    if (a[1] === b[1]) return a[2] + "–" + b[2] + " " + MON_SHORT[b[1] - 1];
    return a[2] + " " + MON_SHORT[a[1] - 1] + " – " + b[2] + " " + MON_SHORT[b[1] - 1];
  }

  function paintCalendar(now) {
    const rows = Array.prototype.slice.call(document.querySelectorAll(".round[data-start]"));
    if (!rows.length) return;
    let nextIdx = -1, nextTime = Infinity;
    rows.forEach(function (row, i) {
      const st = status({ start: row.dataset.start, end: row.dataset.end || row.dataset.start }, now);
      row.dataset.state = st;
      if (st !== "complete") {
        const t = startDT(row.dataset.start).getTime();
        if (t < nextTime) { nextTime = t; nextIdx = i; }
      }
    });
    rows.forEach(function (row, i) {
      const pill = row.querySelector(".status");
      if (!pill) return;
      const st = row.dataset.state;
      pill.classList.remove("next");
      if (st === "complete") pill.textContent = "Complete";
      else if (st === "live") { pill.textContent = "Racing now"; pill.classList.add("next"); }
      else pill.textContent = "Upcoming";
      if (i === nextIdx && st !== "live") { pill.textContent = "Next"; pill.classList.add("next"); }
    });
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function box(val, label) { return "<div><b>" + val + "</b><span>" + label + "</span></div>"; }

  function paintNextRace() {
    const titleEl = document.getElementById("nr-title");
    const metaEl  = document.getElementById("nr-meta");
    const countEl = document.getElementById("nr-count");
    const trackEl = document.getElementById("nr-track");
    if (!titleEl && !countEl) return;

    function tick() {
      const now = new Date();
      const r = nextRace(now);
      if (!r) {
        if (titleEl) titleEl.textContent = "Season complete";
        if (metaEl)  metaEl.textContent = "See you in 2027";
        if (countEl) countEl.innerHTML = "";
        if (trackEl) trackEl.hidden = true;
        return;
      }
      if (titleEl) titleEl.textContent = r.circuit;
      if (metaEl)  metaEl.textContent = prettyRange(r.start, r.end) + " · " + r.loc;
      if (trackEl) {
        const tsrc = TRACKS[r.circuit] || "";
        if (tsrc) {
          if (trackEl.getAttribute("src") !== tsrc) trackEl.src = tsrc;
          trackEl.alt = r.circuit + " circuit map";
          trackEl.hidden = false;
        } else {
          trackEl.hidden = true;
        }
      }
      const target = startDT(r.start).getTime();
      let diff = Math.floor((target - now.getTime()) / 1000);
      if (diff <= 0) {
        if (countEl) countEl.innerHTML = '<div style="min-width:auto;background:rgba(255,255,255,.16);padding:12px 18px">Racing this weekend</div>';
        return;
      }
      const days = Math.floor(diff / 86400); diff -= days * 86400;
      const hrs  = Math.floor(diff / 3600);  diff -= hrs * 3600;
      const min  = Math.floor(diff / 60);
      const sec  = diff - min * 60;
      if (countEl) countEl.innerHTML = box(days, "Days") + box(pad(hrs), "Hrs") + box(pad(min), "Min") + box(pad(sec), "Sec");
    }
    tick();
    setInterval(tick, 1000);
  }

  function paintHeroCountdown() {
    const titleEl = document.getElementById("hc-title");
    const roundEl = document.getElementById("hc-round");
    const metaEl  = document.getElementById("hc-meta");
    const countEl = document.getElementById("hc-count");
    if (!countEl && !titleEl) return;

    function hbox(val, label) { return '<div class="u"><b>' + val + '</b><span>' + label + '</span></div>'; }

    function tick() {
      const now = new Date();
      const r = nextRace(now);
      if (!r) {
        if (titleEl) titleEl.textContent = "Season complete";
        if (roundEl) roundEl.textContent = "See you in 2027";
        if (metaEl)  metaEl.textContent = "";
        if (countEl) countEl.innerHTML = "";
        return;
      }
      if (titleEl) titleEl.textContent = r.circuit;
      if (roundEl) roundEl.textContent = r.series + " · Round " + r.round.replace(/^R/, "");
      if (metaEl)  metaEl.textContent = prettyRange(r.start, r.end) + " · " + r.loc;
      const target = startDT(r.start).getTime();
      let diff = Math.floor((target - now.getTime()) / 1000);
      if (diff <= 0) {
        if (countEl) countEl.innerHTML = '<div class="u live"><b>Racing now</b></div>';
        return;
      }
      const days = Math.floor(diff / 86400); diff -= days * 86400;
      const hrs  = Math.floor(diff / 3600);  diff -= hrs * 3600;
      const min  = Math.floor(diff / 60);
      const sec  = diff - min * 60;
      if (countEl) countEl.innerHTML = hbox(days, "Days") + hbox(pad(hrs), "Hrs") + hbox(pad(min), "Mins") + hbox(pad(sec), "Secs");
    }
    tick();
    setInterval(tick, 1000);
  }

  function paintEventDays() {
    const el = document.getElementById("ev-countdown");
    if (!el) return;
    function tick() {
      const now = new Date();
      let target;
      if (el.dataset.date) target = startDT(el.dataset.date).getTime();
      else { const r = nextRace(now); if (!r) { el.textContent = "—"; return; } target = startDT(r.start).getTime(); }
      const diff = Math.floor((target - now.getTime()) / 1000);
      el.textContent = diff <= 0 ? "0" : String(Math.floor(diff / 86400));
    }
    tick();
    setInterval(tick, 60000);
  }

  /* Home hero photo follows whichever circuit is next up. */
  function paintHeroImage() {
    const el = document.querySelector(".hero-bg");
    if (!el) return;
    const r = nextRace(new Date()) || lastRace();
    if (!r) return;
    const src = circuitOf(r.circuit).hero || FALLBACK_HERO;
    /* Resolve to an absolute URL first. A url() substituted through a custom
       property is resolved against the STYLESHEET (assets/), not the document,
       so a bare "assets/img/…" would become "assets/assets/img/…". */
    el.style.setProperty("--hero-img", "url('" + new URL(src, document.baseURI).href + "')");
  }

  /* Event page. Follows the next round automatically. To pin the page to a
     specific round instead, put data-start="YYYY-MM-DD" on #event-page. */
  function paintEventPage() {
    const root = document.getElementById("event-page");
    if (!root) return;

    let r = null;
    if (root.dataset.start) {
      r = SCHEDULE.filter(function (x) { return x.start === root.dataset.start; })[0] || null;
    }
    const upcoming = nextRace(new Date());
    const seasonOver = !r && !upcoming;
    if (!r) r = upcoming || lastRace();
    if (!r) return;

    const c = circuitOf(r.circuit);
    const name = r.circuit;
    const short = c.short || name;
    const roundNo = r.round.replace(/^R/, "");
    const range = prettyRange(r.start, r.end);
    const parts = (c.city || "").split(",");
    const town = (parts[0] || "").trim();
    const region = (parts[1] || "").trim() || r.loc;

    function set(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

    document.title = name + " — Round " + roundNo + " | SuperMini Challenge";
    const md = document.querySelector('meta[name="description"]');
    if (md) {
      md.setAttribute("content", "Event info for the SuperMini Challenge at " + name +
        " — Round " + roundNo + " of the " + r.series + ", " + range + ".");
    }

    const heroEl = document.getElementById("ev-hero");
    if (heroEl) {
      heroEl.style.backgroundImage =
        "linear-gradient(90deg,rgba(11,13,17,.86),rgba(11,13,17,.45) 70%,rgba(11,13,17,.35))," +
        "url(" + (c.hero || FALLBACK_HERO) + ")";
    }

    set("ev-crumb", short);
    set("ev-eyebrow", seasonOver ? "Season complete · last round" : r.series + " · Round " + roundNo);
    set("ev-title", name);
    set("ev-dates", range + " · " + (c.city || r.loc));
    set("ev-spec-round", "Round " + roundNo);
    set("ev-spec-series", r.series.replace(/^Rubber Craft /, ""));
    set("ev-spec-dates", shortRange(r.start, r.end));
    set("ev-spec-year", r.start.slice(0, 4));
    set("ev-spec-circuit", short);
    set("ev-spec-city", c.city || r.loc);
    set("ev-circuit-h2", name);
    set("ev-join-h2", "Race at " + short);
    set("ev-spectator-circuit", short);
    set("ev-blurb", "The SuperMini Challenge heads to " + region + " for Round " + roundNo +
      " of the " + r.series + " at " + name + (town ? ", " + town : "") +
      (c.blurb ? " — " + c.blurb : "") + ".");

    const cd = document.getElementById("ev-countdown");
    if (cd) cd.dataset.date = r.start;

    const mapEl = document.getElementById("ev-map");
    if (mapEl && c.map) { mapEl.src = c.map; mapEl.alt = name + " circuit map"; }

    const tb = document.getElementById("ev-timetable");
    if (tb) {
      tb.innerHTML = sessionsFor(r).map(function (s) {
        return "<tr><td>" + dayLabel(r.start, s[0]) + "</td><td>" + s[1] + "</td></tr>";
      }).join("");
    }

    root.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    paintCalendar(new Date());
    paintNextRace();
    paintHeroCountdown();
    paintHeroImage();
    paintEventPage();   // must run before paintEventDays — it sets the target date
    paintEventDays();
  });
})();
