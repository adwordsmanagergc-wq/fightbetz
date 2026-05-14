/* ============================================================
   FIGHT BETZ — peer-to-peer fight gambling (demo build)
   State persists in localStorage. No real money is processed.
   ============================================================ */

const FEE_RATE = 0.05; // 5% house hold
const STORE_KEY = "fightbetz.v1";

/* ---------- seed data ---------- */
const EVENTS = [
  {
    id: "ifl-rise-up",
    org: "Island Fighters League",
    name: "IFL: RISE UP!",
    venue: "Mandalika Race Course, Lombok — Bali",
    date: "Sat 31 May 2026 · 7:00 PM WITA",
    featured: true,
    poster: "rise-up-event.png",
    fights: [
      { id: "f1", a: "Komang \"Bull\" Surya", b: "Rizky Pratama", weight: "Lightweight Title", oddsA: 1.8, oddsB: 2.1 },
      { id: "f2", a: "Wayan Adi", b: "Joao \"Tsunami\" Silva", weight: "Welterweight", oddsA: 2.4, oddsB: 1.6 },
      { id: "f3", a: "Ketut Mahendra", b: "Bagus Nugraha", weight: "Featherweight", oddsA: 1.95, oddsB: 1.95 },
      { id: "f4", a: "Putri \"Storm\" Lestari", b: "Dewi Anjani", weight: "Women's Strawweight", oddsA: 1.7, oddsB: 2.25 },
    ],
  },
  {
    id: "pfl-world-9",
    org: "Professional Fighters League",
    name: "PFL World Tournament 9",
    venue: "Etihad Arena, Abu Dhabi",
    date: "Fri 13 Jun 2026 · 9:00 PM GST",
    fights: [
      { id: "f1", a: "Marcus Cole", b: "Dimitri Volkov", weight: "Heavyweight SF", oddsA: 1.65, oddsB: 2.3 },
      { id: "f2", a: "Aisha Bello", b: "Lena Kruger", weight: "Lightweight SF", oddsA: 2.0, oddsB: 1.85 },
    ],
  },
  {
    id: "ufc-312",
    org: "Ultimate Fighting Championship",
    name: "UFC 312",
    venue: "T-Mobile Arena, Las Vegas",
    date: "Sat 28 Jun 2026 · 10:00 PM ET",
    fights: [
      { id: "f1", a: "Tyrone Banks", b: "Carlos Mendez", weight: "Middleweight Title", oddsA: 1.55, oddsB: 2.6 },
      { id: "f2", a: "Sasha Ivanova", b: "Mei Tanaka", weight: "Flyweight", oddsA: 2.1, oddsB: 1.78 },
      { id: "f3", a: "Diego \"Hammer\" Ruiz", b: "Aaron Wells", weight: "Bantamweight", oddsA: 1.9, oddsB: 1.95 },
    ],
  },
  {
    id: "one-178",
    org: "ONE Championship",
    name: "ONE 178: Bangkok",
    venue: "Impact Arena, Bangkok",
    date: "Sat 5 Jul 2026 · 8:00 PM ICT",
    fights: [
      { id: "f1", a: "Somchai Petch", b: "Nong Ek", weight: "Muay Thai Title", oddsA: 1.72, oddsB: 2.18 },
      { id: "f2", a: "Rafael Costa", b: "Kim Min-Jae", weight: "Lightweight", oddsA: 2.05, oddsB: 1.82 },
    ],
  },
];

/* ---------- persisted state ---------- */
const defaultState = {
  wallet: 0,
  wagers: [
    {
      id: "w-seed-1",
      eventId: "ifl-rise-up", eventName: "IFL: RISE UP!",
      fight: "Komang \"Bull\" Surya vs Rizky Pratama",
      side: "Komang \"Bull\" Surya",
      stake: 50, creator: "Gede", status: "open",
    },
    {
      id: "w-seed-2",
      eventId: "ifl-rise-up", eventName: "IFL: RISE UP!",
      fight: "Putri \"Storm\" Lestari vs Dewi Anjani",
      side: "Dewi Anjani",
      stake: 120, creator: "Sarah", status: "open",
    },
    {
      id: "w-seed-3",
      eventId: "ufc-312", eventName: "UFC 312",
      fight: "Tyrone Banks vs Carlos Mendez",
      side: "Carlos Mendez",
      stake: 80, creator: "Mike", status: "matched", matchedBy: "You",
    },
  ],
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(defaultState));
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => "w-" + Math.random().toString(36).slice(2, 9);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 2600);
}

/* ---------- render ---------- */
function render() {
  renderWallet();
  renderEvents();
  renderWagers();
  renderHeroStats();
  save();
}

function renderWallet() {
  $("#walletBal").textContent = money(state.wallet);
}

function renderHeroStats() {
  const open = state.wagers.filter((w) => w.status === "open").length;
  const pool = state.wagers
    .filter((w) => w.status === "matched")
    .reduce((s, w) => s + w.stake * 2, 0);
  $("#statPool").textContent = money(pool).replace(".00", "");
  $("#statBets").textContent = open;
}

function renderEvents() {
  const grid = $("#eventGrid");
  grid.innerHTML = "";
  EVENTS.forEach((ev) => {
    const card = document.createElement("div");
    card.className = "event-card" + (ev.featured ? " featured" : "");
    card.dataset.openEvent = ev.id;
    const openCount = state.wagers.filter((w) => w.eventId === ev.id && w.status === "open").length;
    card.innerHTML = `
      ${ev.featured ? '<div class="ec-tag">MAIN</div>' : ""}
      <div class="ec-org">${ev.org}</div>
      <div class="ec-name">${ev.name}</div>
      <div class="ec-meta">📍 ${ev.venue}<br />📅 ${ev.date}</div>
      <div class="ec-foot">
        <span class="pill">${ev.fights.length} fights</span>
        <span class="pill">${openCount} open wager${openCount === 1 ? "" : "s"}</span>
      </div>`;
    grid.appendChild(card);
  });
}

function renderWagers() {
  const list = $("#wagerList");
  list.innerHTML = "";
  if (!state.wagers.length) {
    list.innerHTML = '<div class="empty-note">No wagers yet — open an event and start one with your crew.</div>';
    return;
  }
  // open first, then matched, then settled
  const order = { open: 0, matched: 1, settled: 2 };
  [...state.wagers]
    .sort((a, b) => order[a.status] - order[b.status])
    .forEach((w) => {
      const card = document.createElement("div");
      card.className = "wager-card " + w.status;
      const statusLabel =
        w.status === "open" ? "Open" : w.status === "matched" ? "In Escrow" : "Settled";
      let right = "";
      if (w.status === "open") {
        right = `<button class="btn-mini" data-match="${w.id}">Match Bet</button>`;
      } else if (w.status === "matched") {
        right = `<button class="btn-mini alt" data-settle="${w.id}">Settle</button>`;
      } else {
        right = `<span class="wc-detail">🏆 ${w.winner} won</span>`;
      }
      card.innerHTML = `
        <div>
          <div class="wc-event">${w.eventName}</div>
          <div class="wc-fight">${w.fight}</div>
          <div class="wc-detail">
            <b>${w.creator}</b> backs <span class="side">${w.side}</span>
            ${w.matchedBy ? ` · matched by <b>${w.matchedBy}</b>` : ""}
          </div>
        </div>
        <div class="wc-right">
          <span class="wc-status status-${w.status}">${statusLabel}</span>
          <span class="wc-stake">${money(w.stake)}</span>
          ${right}
        </div>`;
      list.appendChild(card);
    });
}

/* ---------- modals ---------- */
function openModal(id) { $("#" + id).hidden = false; }
function closeModal(el) { el.hidden = true; }

$$(".modal-backdrop").forEach((bd) => {
  bd.addEventListener("click", (e) => {
    if (e.target === bd || e.target.hasAttribute("data-close")) closeModal(bd);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $$(".modal-backdrop").forEach((m) => (m.hidden = true));
});

/* ---------- event modal + bet builder ---------- */
let builder = { eventId: null, fightId: null, side: null, odds: null };

function openEventModal(eventId) {
  const ev = EVENTS.find((e) => e.id === eventId);
  if (!ev) return;
  builder = { eventId, fightId: null, side: null, odds: null };
  const body = $("#eventModalBody");
  body.innerHTML = `
    ${ev.poster ? `<div class="em-poster"><img src="${ev.poster}" alt="${escapeAttr(ev.name)} poster" /></div>` : ""}
    <div class="em-org">${ev.org}</div>
    <div class="em-name">${ev.name}</div>
    <div class="em-meta">📍 ${ev.venue} &nbsp; · &nbsp; 📅 ${ev.date}</div>
    <div id="fightList">
      ${ev.fights
        .map(
          (f) => `
        <div class="fight-row" data-fight="${f.id}">
          <div class="fight-bout">${f.a} <span style="color:var(--accent)">vs</span> ${f.b}</div>
          <div class="fight-class">${f.weight}</div>
          <div class="fight-actions">
            <button class="pick-btn" data-fid="${f.id}" data-side="${escapeAttr(f.a)}" data-odds="${f.oddsA}">
              ${f.a}<span class="pick-odds">odds ${f.oddsA.toFixed(2)}</span>
            </button>
            <button class="pick-btn" data-fid="${f.id}" data-side="${escapeAttr(f.b)}" data-odds="${f.oddsB}">
              ${f.b}<span class="pick-odds">odds ${f.oddsB.toFixed(2)}</span>
            </button>
          </div>
        </div>`
        )
        .join("")}
    </div>
    <div class="bet-builder" id="betBuilder" hidden>
      <h3>Start a wager</h3>
      <div class="bet-summary" id="betSummary"></div>
      <label class="field-label">Your stake (USD)</label>
      <input type="number" id="stakeInput" min="1" placeholder="50.00" />
      <div class="fee-line"><span>Your stake</span><span id="feeStake">$0.00</span></div>
      <div class="fee-line"><span>Fight Betz hold (5%)</span><span id="feeHold">$0.00</span></div>
      <div class="fee-line total"><span>Debited from wallet</span><span id="feeTotal">$0.00</span></div>
      <button class="btn-primary full" id="createWager">Lock In &amp; Post Wager</button>
      <p class="form-note" id="builderNote"></p>
    </div>`;

  // pick buttons
  $$(".pick-btn", body).forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".pick-btn", body).forEach((b) => b.classList.remove("sel"));
      btn.classList.add("sel");
      builder.fightId = btn.dataset.fid;
      builder.side = btn.dataset.side;
      builder.odds = parseFloat(btn.dataset.odds);
      const f = ev.fights.find((x) => x.id === builder.fightId);
      $("#betBuilder").hidden = false;
      $("#betSummary").innerHTML = `Backing <b>${builder.side}</b> in ${f.a} vs ${f.b}`;
      updateFeePreview();
      $("#stakeInput").focus();
    });
  });

  $("#eventModalBody").addEventListener("input", (e) => {
    if (e.target.id === "stakeInput") updateFeePreview();
  });

  body.addEventListener("click", (e) => {
    if (e.target.id === "createWager") createWager(ev);
  });

  openModal("eventModal");
}

function updateFeePreview() {
  const stake = Math.max(0, parseFloat($("#stakeInput").value) || 0);
  const hold = stake * FEE_RATE;
  $("#feeStake").textContent = money(stake);
  $("#feeHold").textContent = money(hold);
  $("#feeTotal").textContent = money(stake + hold);
}

function createWager(ev) {
  const stake = Math.max(0, parseFloat($("#stakeInput").value) || 0);
  const note = $("#builderNote");
  if (!builder.side) { note.textContent = "Pick a fighter first."; return; }
  if (stake < 1) { note.textContent = "Enter a stake of at least $1."; return; }
  const total = stake * (1 + FEE_RATE);
  if (total > state.wallet) {
    note.textContent = `Need ${money(total)} (stake + 5% hold). Add funds to your wallet.`;
    return;
  }
  const f = ev.fights.find((x) => x.id === builder.fightId);
  state.wallet -= total;
  state.wagers.unshift({
    id: uid(),
    eventId: ev.id,
    eventName: ev.name,
    fight: `${f.a} vs ${f.b}`,
    side: builder.side,
    stake,
    creator: "You",
    status: "open",
  });
  save();
  render();
  closeModal($("#eventModal"));
  toast(`Wager posted — ${money(stake)} on ${builder.side}`);
}

/* ---------- match a wager ---------- */
function matchWager(id) {
  const w = state.wagers.find((x) => x.id === id);
  if (!w || w.status !== "open") return;
  const total = w.stake * (1 + FEE_RATE);
  if (w.creator === "You") { toast("That's your own wager — wait for a friend to match it."); return; }
  if (total > state.wallet) {
    openDepositModal();
    toast(`Need ${money(total)} to match this wager.`);
    return;
  }
  state.wallet -= total;
  w.status = "matched";
  w.matchedBy = "You";
  save();
  render();
  toast(`Matched! ${money(w.stake * 2)} locked in escrow.`);
}

/* ---------- settle a wager ---------- */
function settleWager(id) {
  const w = state.wagers.find((x) => x.id === id);
  if (!w || w.status !== "matched") return;
  // demo: winner is whichever side a coin lands on; payout = both stakes minus already-taken fee
  const creatorWins = Math.random() < 0.5;
  w.status = "settled";
  w.winner = creatorWins ? w.creator : w.matchedBy;
  const youInvolved = w.creator === "You" || w.matchedBy === "You";
  const youWon = (creatorWins && w.creator === "You") || (!creatorWins && w.matchedBy === "You");
  const payout = w.stake * 2; // 5% was already held on each side at entry
  if (youInvolved && youWon) {
    state.wallet += payout;
    toast(`🏆 You won ${money(payout)} — paid out from escrow.`);
  } else if (youInvolved) {
    toast(`${w.winner} won this one. Escrow disbursed.`);
  } else {
    toast(`Settled — ${w.winner} takes ${money(payout)}.`);
  }
  save();
  render();
}

/* ---------- deposit ---------- */
function openDepositModal() {
  $("#depositAmount").value = "";
  $("#depositNote").textContent = "";
  openModal("depositModal");
}

$("#openDeposit").addEventListener("click", openDepositModal);
$("#walletChip").addEventListener("click", (e) => {
  if (e.target.id !== "openDeposit") return;
});

$$(".method-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".method-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const m = tab.dataset.method;
    $("#cryptoPane").hidden = m !== "crypto";
    $("#bankPane").hidden = m !== "bank";
  });
});

$("#cryptoAsset").addEventListener("change", (e) => {
  const addrs = {
    USDC: "0xF1GHT7e2a9c4Bd31aE0fC9b372",
    BTC: "bc1qf1ghtbetz9k2m7p0xqz3v8n",
    ETH: "0xBE7Zaa14c0Df89e3217bC0b91",
  };
  $("#cryptoAddr").textContent = addrs[e.target.value];
});

$("#confirmDeposit").addEventListener("click", () => {
  const amt = parseFloat($("#depositAmount").value) || 0;
  if (amt < 1) { $("#depositNote").textContent = "Enter an amount of at least $1."; return; }
  state.wallet += amt;
  save();
  render();
  closeModal($("#depositModal"));
  toast(`${money(amt)} added to your wallet.`);
});

/* ---------- list event form ---------- */
$("#listForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  $("#listNote").textContent =
    `✅ Thanks! "${data.get("name")}" by ${data.get("league")} was submitted for review. We'll email ${data.get("email")}.`;
  e.target.reset();
});

/* ---------- global click delegation ---------- */
document.addEventListener("click", (e) => {
  const openEv = e.target.closest("[data-open-event]");
  if (openEv) { openEventModal(openEv.dataset.openEvent); return; }
  const matchBtn = e.target.closest("[data-match]");
  if (matchBtn) { matchWager(matchBtn.dataset.match); return; }
  const settleBtn = e.target.closest("[data-settle]");
  if (settleBtn) { settleWager(settleBtn.dataset.settle); return; }
});

/* ---------- util ---------- */
function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

/* ---------- boot ---------- */
render();
