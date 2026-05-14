/* ============================================================
   FIGHT BETZ — peer-to-peer fighter card battles (demo build)
   No cash gambling: you BUY a fighter's NFT card. If your fighter
   wins their bout, you also WIN the opponent's card. Cards can be
   sold back to Fight Betz for the price they were bought at.
   The platform takes a 5% hold to escrow cards and settle results.
   State persists in localStorage. No real money is processed.
   ============================================================ */

const FEE_RATE = 0.05; // 5% platform hold
const STORE_KEY = "fightbetz.v4";

/* ---------- seed data: events, fights, card prices ---------- */
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
      { id: "f1", a: "Komang \"Bull\" Surya", b: "Rizky Pratama", weight: "Lightweight Title", oddsA: 1.6, oddsB: 2.4, cardA: 100, cardB: 67 },
      { id: "f2", a: "Wayan Adi", b: "Joao \"Tsunami\" Silva", weight: "Welterweight", oddsA: 2.6, oddsB: 1.5, cardA: 58, cardB: 100 },
      { id: "f3", a: "Ketut Mahendra", b: "Bagus Nugraha", weight: "Featherweight", oddsA: 1.95, oddsB: 1.95, cardA: 100, cardB: 100 },
      { id: "f4", a: "Putri \"Storm\" Lestari", b: "Dewi Anjani", weight: "Women's Strawweight", oddsA: 1.55, oddsB: 2.6, cardA: 100, cardB: 60 },
      { id: "f5", a: "Jason Ponet", b: "Bagas Wirawan", weight: "Catchweight 77kg", oddsA: 1.9, oddsB: 1.95, cardA: 100, cardB: 97 },
    ],
  },
  {
    id: "patong-stadium-fri",
    org: "Patong Boxing Stadium",
    name: "Patong Fight Night",
    venue: "Patong Boxing Stadium, Phuket — Thailand",
    date: "Fri 6 Jun 2026 · 9:00 PM ICT",
    fights: [
      { id: "f1", a: "Sangtiennoi Sor Rungroj", b: "Petch Bangla", weight: "Muay Thai 70kg", oddsA: 1.7, oddsB: 2.2, cardA: 100, cardB: 77 },
      { id: "f2", a: "Yodwicha Kawila", b: "Liam \"Pommie\" Carter", weight: "Muay Thai 65kg", oddsA: 1.3, oddsB: 3.6, cardA: 100, cardB: 36 },
      { id: "f3", a: "Nong Beer", b: "Kaito Yamada", weight: "Muay Thai 60kg", oddsA: 2.1, oddsB: 1.75, cardA: 83, cardB: 100 },
    ],
  },
  {
    id: "bangla-throwdown",
    org: "Bangla Road Promotions",
    name: "Bangla Road Throwdown",
    venue: "Suwit Stadium, Patong — Phuket",
    date: "Sat 21 Jun 2026 · 8:30 PM ICT",
    fights: [
      { id: "f1", a: "Phet Patong", b: "Diego \"Hammer\" Ruiz", weight: "Muay Thai Title 67kg", oddsA: 1.9, oddsB: 1.95, cardA: 100, cardB: 97 },
      { id: "f2", a: "Mai \"Lightning\" Chai", b: "Anya Volkova", weight: "Women's Muay Thai 55kg", oddsA: 1.6, oddsB: 2.4, cardA: 100, cardB: 67 },
    ],
  },
  {
    id: "urcc-manila",
    org: "Universal Reality Combat Championship",
    name: "URCC: Manila Mayhem",
    venue: "Mall of Asia Arena, Manila — Philippines",
    date: "Sat 28 Jun 2026 · 7:00 PM PHT",
    fights: [
      { id: "f1", a: "Rolando \"Bakal\" Dy", b: "Marco Santos", weight: "Lightweight Title", oddsA: 1.45, oddsB: 2.9, cardA: 100, cardB: 50 },
      { id: "f2", a: "Jenelyn Olsim", b: "Trish Mendoza", weight: "Women's Atomweight", oddsA: 1.8, oddsB: 2.05, cardA: 100, cardB: 88 },
      { id: "f3", a: "Carlo \"Bigboy\" Pedregosa", b: "Kevin Lim", weight: "Featherweight", oddsA: 2.3, oddsB: 1.6, cardA: 70, cardB: 100 },
    ],
  },
  {
    id: "pinoy-pride-cebu",
    org: "Pinoy Pride Boxing",
    name: "Pinoy Pride: Cebu Slugfest",
    venue: "Hoops Dome, Lapu-Lapu City — Cebu",
    date: "Sun 12 Jul 2026 · 4:00 PM PHT",
    fights: [
      { id: "f1", a: "Mark \"Magnifico\" Reyes", b: "Joey Canada", weight: "Super Flyweight Title", oddsA: 1.2, oddsB: 4.6, cardA: 500, cardB: 100 },
      { id: "f2", a: "Aljun Bacalso", b: "Tatsuya Mori", weight: "Bantamweight", oddsA: 2.0, oddsB: 1.85, cardA: 93, cardB: 100 },
    ],
  },
];

/* ---------- persisted state ----------
   battles: a fight matchup. One fighter card is held by `creator`,
            the `opponent` card is open to claim. Winner takes both.
   collection: fighter cards currently held by "You".
*/
const defaultState = {
  wallet: 0,
  battles: [
    {
      id: "b-seed-1",
      eventId: "ifl-rise-up", eventName: "IFL: RISE UP!",
      fight: "Komang \"Bull\" Surya vs Rizky Pratama",
      cardFighter: "Komang \"Bull\" Surya", cardPrice: 100, oddsCard: 1.6,
      oppFighter: "Rizky Pratama", oppPrice: 67, oddsOpp: 2.4,
      creator: "Gede", status: "open",
    },
    {
      id: "b-seed-2",
      eventId: "ifl-rise-up", eventName: "IFL: RISE UP!",
      fight: "Putri \"Storm\" Lestari vs Dewi Anjani",
      cardFighter: "Dewi Anjani", cardPrice: 60, oddsCard: 2.6,
      oppFighter: "Putri \"Storm\" Lestari", oppPrice: 100, oddsOpp: 1.55,
      creator: "Sarah", status: "open",
    },
    {
      id: "b-seed-3",
      eventId: "urcc-manila", eventName: "URCC: Manila Mayhem",
      fight: "Rolando \"Bakal\" Dy vs Marco Santos",
      cardFighter: "Marco Santos", cardPrice: 50, oddsCard: 2.9,
      oppFighter: "Rolando \"Bakal\" Dy", oppPrice: 100, oddsOpp: 1.45,
      creator: "Mike", status: "live", claimedBy: "You",
    },
  ],
  collection: [
    {
      id: "c-seed-1", battleId: "b-seed-3",
      eventName: "URCC: Manila Mayhem",
      fighter: "Rolando \"Bakal\" Dy", price: 100, status: "inplay",
    },
    {
      id: "c-seed-2", battleId: "b-past-1",
      eventName: "Patong Fight Night",
      fighter: "Nong Beer", price: 45, status: "tradeable",
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
const uid = (p = "x") => p + "-" + Math.random().toString(36).slice(2, 9);
function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }
function initials(name) {
  return name.replace(/"/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 2800);
}

/* ---------- render ---------- */
function render() {
  renderWallet();
  renderEvents();
  renderBattles();
  renderCollection();
  renderHeroStats();
  save();
}

function renderWallet() {
  $("#walletBal").textContent = money(state.wallet);
}

function renderHeroStats() {
  const open = state.battles.filter((b) => b.status === "open").length;
  const escrowed = state.battles
    .filter((b) => b.status !== "settled")
    .reduce((s, b) => s + b.cardPrice + (b.status === "live" ? b.oppPrice : 0), 0);
  $("#statPool").textContent = money(escrowed).replace(".00", "");
  $("#statBets").textContent = open;
}

function renderEvents() {
  const grid = $("#eventGrid");
  grid.innerHTML = "";
  EVENTS.forEach((ev) => {
    const card = document.createElement("div");
    card.className = "event-card" + (ev.featured ? " featured" : "");
    card.dataset.openEvent = ev.id;
    const openCount = state.battles.filter((b) => b.eventId === ev.id && b.status === "open").length;
    card.innerHTML = `
      ${ev.featured ? '<div class="ec-tag">MAIN</div>' : ""}
      <div class="ec-org">${ev.org}</div>
      <div class="ec-name">${ev.name}</div>
      <div class="ec-meta">📍 ${ev.venue}<br />📅 ${ev.date}</div>
      <div class="ec-foot">
        <span class="pill">${ev.fights.length} fights</span>
        <span class="pill">${openCount} card${openCount === 1 ? "" : "s"} open</span>
      </div>`;
    grid.appendChild(card);
  });
}

function renderBattles() {
  const list = $("#wagerList");
  list.innerHTML = "";
  if (!state.battles.length) {
    list.innerHTML = '<div class="empty-note">No card battles yet — open an event and buy a fighter card.</div>';
    return;
  }
  const order = { open: 0, live: 1, settled: 2 };
  [...state.battles]
    .sort((a, b) => order[a.status] - order[b.status])
    .forEach((b) => {
      const card = document.createElement("div");
      card.className = "wager-card " + b.status;
      const statusLabel = b.status === "open" ? "Card Open" : b.status === "live" ? "In the Vault" : "Settled";
      const statusClass = b.status === "open" ? "status-open" : b.status === "live" ? "status-matched" : "status-settled";
      let right = "";
      if (b.status === "open") {
        right = `<button class="btn-mini" data-claim="${b.id}">Claim ${b.oppFighter.split(" ")[0]}'s Card · ${money(b.oppPrice)}</button>`;
      } else if (b.status === "live") {
        right = `<button class="btn-mini alt" data-settle="${b.id}">Run the Fight</button>`;
      } else {
        right = `<span class="wc-detail">🏆 ${b.winner}'s card holder wins both</span>`;
      }
      const oddsCard = b.oddsCard ? ` @ ${b.oddsCard.toFixed(2)}` : "";
      const oddsOpp = b.oddsOpp ? ` @ ${b.oddsOpp.toFixed(2)}` : "";
      card.innerHTML = `
        <div>
          <div class="wc-event">${b.eventName}</div>
          <div class="wc-fight">${b.fight}</div>
          <div class="wc-detail">
            <b>${b.creator}</b> holds <span class="side">${b.cardFighter}</span>${oddsCard} — ${money(b.cardPrice)}
            ${b.claimedBy
              ? ` · <b>${b.claimedBy}</b> holds <span class="side">${b.oppFighter}</span>${oddsOpp} — ${money(b.oppPrice)}`
              : ` · <span class="side">${b.oppFighter}</span>${oddsOpp} card open for ${money(b.oppPrice)}`}
          </div>
        </div>
        <div class="wc-right">
          <span class="wc-status ${statusClass}">${statusLabel}</span>
          <span class="wc-stake">${money(b.cardPrice + (b.status === "open" ? 0 : b.oppPrice))}</span>
          ${right}
        </div>`;
      list.appendChild(card);
    });
}

function renderCollection() {
  const grid = $("#collectionGrid");
  grid.innerHTML = "";
  const cards = state.collection;
  $("#collectionCount").textContent = cards.length;
  if (!cards.length) {
    grid.innerHTML = '<div class="empty-note">Your collection is empty — buy a fighter card to get started.</div>';
    return;
  }
  cards.forEach((c) => {
    const el = document.createElement("div");
    el.className = "fcard " + c.status;
    const badge = c.status === "inplay"
      ? '<span class="fcard-badge inplay">In the Vault</span>'
      : '<span class="fcard-badge tradeable">Tradeable</span>';
    const action = c.status === "tradeable"
      ? `<button class="btn-mini" data-sell="${c.id}">Sell Back · ${money(c.price)}</button>`
      : `<span class="fcard-locked">🔒 Locked until fight settles</span>`;
    el.innerHTML = `
      <div class="fcard-art">${initials(c.fighter)}</div>
      ${badge}
      <div class="fcard-name">${c.fighter}</div>
      <div class="fcard-event">${c.eventName}</div>
      <div class="fcard-foot">
        <span class="fcard-price">${money(c.price)}</span>
        ${action}
      </div>`;
    grid.appendChild(el);
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

/* ---------- event modal + card buyer ---------- */
let picker = {};

// favourite (lower odds) card costs proportionally MORE. The peer buying the
// opponent pays a price scaled by the win-probability ratio, so a short
// favourite costs a lot and the longshot is cheap.
function fairOppPrice(myPrice, myOdds, oppOdds) {
  return Math.max(1, Math.round(myPrice * (myOdds / oppOdds)));
}

function openEventModal(eventId, autoFightId) {
  const ev = EVENTS.find((e) => e.id === eventId);
  if (!ev) return;
  picker = { eventId };
  const body = $("#eventModalBody");
  body.innerHTML = `
    ${ev.poster ? `<div class="em-poster"><img src="${ev.poster}" alt="${escapeAttr(ev.name)} poster" /></div>` : ""}
    <div class="em-org">${ev.org}</div>
    <div class="em-name">${ev.name}</div>
    <div class="em-meta">📍 ${ev.venue} &nbsp; · &nbsp; 📅 ${ev.date}</div>
    <div id="fightList">
      ${ev.fights
        .map((f) => {
          const favA = f.oddsA <= f.oddsB;
          return `
        <div class="fight-row" data-fight="${f.id}">
          <div class="fight-bout">${f.a} <span style="color:var(--accent)">vs</span> ${f.b}</div>
          <div class="fight-class">${f.weight}</div>
          <div class="fight-actions">
            <button class="pick-btn" data-fid="${f.id}" data-fighter="${escapeAttr(f.a)}" data-opp="${escapeAttr(f.b)}" data-odds="${f.oddsA}" data-oppodds="${f.oddsB}" data-price="${f.cardA}">
              ${f.a}<span class="pick-odds">${favA ? "★ fav " : ""}odds ${f.oddsA.toFixed(2)} · card ~${money(f.cardA)}</span>
            </button>
            <button class="pick-btn" data-fid="${f.id}" data-fighter="${escapeAttr(f.b)}" data-opp="${escapeAttr(f.a)}" data-odds="${f.oddsB}" data-oppodds="${f.oddsA}" data-price="${f.cardB}">
              ${f.b}<span class="pick-odds">${!favA ? "★ fav " : ""}odds ${f.oddsB.toFixed(2)} · card ~${money(f.cardB)}</span>
            </button>
          </div>
        </div>`;
        })
        .join("")}
    </div>
    <div class="bet-builder" id="betBuilder" hidden>
      <h3>Buy a fighter card</h3>
      <div class="bet-summary" id="betSummary"></div>
      <label class="field-label">Set your card price (USD)</label>
      <input type="number" id="priceInput" min="1" placeholder="100.00" />
      <div class="fee-line"><span>Your card price</span><span id="feeStake">$0.00</span></div>
      <div class="fee-line"><span>Fight Betz hold (5%)</span><span id="feeHold">$0.00</span></div>
      <div class="fee-line total"><span>Debited from your wallet</span><span id="feeTotal">$0.00</span></div>
      <div class="odds-split" id="oddsSplit"></div>
      <button class="btn-primary full" id="createWager">Buy Card &amp; Open Battle</button>
      <p class="form-note" id="builderNote"></p>
    </div>`;

  $$(".pick-btn", body).forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".pick-btn", body).forEach((b) => b.classList.remove("sel"));
      btn.classList.add("sel");
      picker.fightId = btn.dataset.fid;
      picker.fighter = btn.dataset.fighter;
      picker.opponent = btn.dataset.opp;
      picker.odds = parseFloat(btn.dataset.odds);
      picker.oppOdds = parseFloat(btn.dataset.oppodds);
      picker.suggested = parseFloat(btn.dataset.price);
      const role = picker.odds <= picker.oppOdds ? "the favourite" : "the underdog";
      $("#betBuilder").hidden = false;
      $("#betSummary").innerHTML =
        `Buying the <b>${picker.fighter}</b> card — they're <b>${role}</b> at odds ${picker.odds.toFixed(2)}. ` +
        `If ${picker.fighter} wins their bout, you also collect the <b>${picker.opponent}</b> card.`;
      $("#priceInput").value = picker.suggested;
      updateFeePreview();
      $("#priceInput").focus();
    });
  });

  body.addEventListener("input", (e) => {
    if (e.target.id === "priceInput") updateFeePreview();
  });
  body.addEventListener("click", (e) => {
    if (e.target.id === "createWager") buyCard(ev);
  });

  openModal("eventModal");

  // optionally jump straight to a fight and pre-select fighter A
  if (autoFightId) {
    const row = body.querySelector(`.fight-row[data-fight="${autoFightId}"]`);
    if (row) {
      row.querySelector(".pick-btn").click();
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function updateFeePreview() {
  const price = Math.max(0, parseFloat($("#priceInput").value) || 0);
  const hold = price * FEE_RATE;
  $("#feeStake").textContent = money(price);
  $("#feeHold").textContent = money(hold);
  $("#feeTotal").textContent = money(price + hold);
  const oppPrice = fairOppPrice(price, picker.odds, picker.oppOdds);
  picker.oppComputed = oppPrice;
  const youFav = picker.odds <= picker.oppOdds;
  $("#oddsSplit").innerHTML =
    `<span class="odds-split-icon">⚖️</span>
     <span><b>Odds-fair pricing.</b> ${picker.opponent} is the ${youFav ? "underdog" : "favourite"} at
     odds ${picker.oppOdds.toFixed(2)} — your peer buys their card for
     <b>${money(oppPrice)}</b>. ${youFav
        ? "You back the favourite, so your card costs more."
        : "You back the underdog, so your card is cheaper."}</span>`;
}

function buyCard(ev) {
  const note = $("#builderNote");
  if (!picker.fighter) { note.textContent = "Pick a fighter card first."; return; }
  const price = Math.max(0, parseFloat($("#priceInput").value) || 0);
  if (price < 1) { note.textContent = "Set a card price of at least $1."; return; }
  const total = price * (1 + FEE_RATE);
  if (total > state.wallet) {
    note.textContent = `Need ${money(total)} (card + 5% hold). Add funds to your wallet.`;
    return;
  }
  const oppPrice = fairOppPrice(price, picker.odds, picker.oppOdds);
  const f = ev.fights.find((x) => x.id === picker.fightId);
  state.wallet -= total;
  const battleId = uid("b");
  state.battles.unshift({
    id: battleId,
    eventId: ev.id,
    eventName: ev.name,
    fight: `${f.a} vs ${f.b}`,
    cardFighter: picker.fighter, cardPrice: price, oddsCard: picker.odds,
    oppFighter: picker.opponent, oppPrice, oddsOpp: picker.oppOdds,
    creator: "You", status: "open",
  });
  state.collection.unshift({
    id: uid("c"), battleId,
    eventName: ev.name,
    fighter: picker.fighter, price, status: "inplay",
  });
  save();
  render();
  closeModal($("#eventModal"));
  toast(`Bought the ${picker.fighter} card for ${money(price)} — battle is open.`);
}

/* ---------- claim the opponent card on an open battle ---------- */
function claimCard(id) {
  const b = state.battles.find((x) => x.id === id);
  if (!b || b.status !== "open") return;
  if (b.creator === "You") { toast("That's your own card battle — wait for a friend to claim the other card."); return; }
  const total = b.oppPrice * (1 + FEE_RATE);
  if (total > state.wallet) {
    openDepositModal();
    toast(`Need ${money(total)} to claim the ${b.oppFighter} card.`);
    return;
  }
  state.wallet -= total;
  b.status = "live";
  b.claimedBy = "You";
  state.collection.unshift({
    id: uid("c"), battleId: b.id,
    eventName: b.eventName,
    fighter: b.oppFighter, price: b.oppPrice, status: "inplay",
  });
  save();
  render();
  toast(`Claimed the ${b.oppFighter} card — both cards are in the vault.`);
}

/* ---------- run the fight: settle a live battle ---------- */
function settleBattle(id) {
  const b = state.battles.find((x) => x.id === id);
  if (!b || b.status !== "live") return;
  const cardWins = Math.random() < 0.5;
  const winner = cardWins ? b.cardFighter : b.oppFighter;
  const loser = cardWins ? b.oppFighter : b.cardFighter;
  const loserPrice = cardWins ? b.oppPrice : b.cardPrice;
  b.status = "settled";
  b.winner = winner;

  // resolve any cards "You" hold in this battle
  const mine = state.collection.filter((c) => c.battleId === b.id);
  const wonCard = mine.find((c) => c.fighter === winner);
  const lostCard = mine.find((c) => c.fighter === loser);
  if (wonCard) wonCard.status = "tradeable";
  if (lostCard) state.collection = state.collection.filter((c) => c.id !== lostCard.id);

  if (wonCard) {
    // winner also collects the loser's card
    state.collection.unshift({
      id: uid("c"), battleId: b.id,
      eventName: b.eventName,
      fighter: loser, price: loserPrice, status: "tradeable",
    });
    toast(`🏆 ${winner} won! You collected the ${loser} card too — both are now tradeable.`);
  } else if (lostCard) {
    toast(`${winner} won. Your ${loser} card was transferred to the winner.`);
  } else {
    toast(`Settled — ${winner}'s card holder takes both cards.`);
  }
  save();
  render();
}

/* ---------- sell a tradeable card back to Fight Betz ---------- */
function sellCard(id) {
  const c = state.collection.find((x) => x.id === id);
  if (!c || c.status !== "tradeable") return;
  state.wallet += c.price;
  state.collection = state.collection.filter((x) => x.id !== id);
  save();
  render();
  toast(`Sold the ${c.fighter} card back for ${money(c.price)}.`);
}

/* ---------- deposit ---------- */
function openDepositModal() {
  $("#depositAmount").value = "";
  $("#depositNote").textContent = "";
  openModal("depositModal");
}

$("#openDeposit").addEventListener("click", openDepositModal);

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
  if (openEv) { openEventModal(openEv.dataset.openEvent, openEv.dataset.openFight); return; }
  const claimBtn = e.target.closest("[data-claim]");
  if (claimBtn) { claimCard(claimBtn.dataset.claim); return; }
  const settleBtn = e.target.closest("[data-settle]");
  if (settleBtn) { settleBattle(settleBtn.dataset.settle); return; }
  const sellBtn = e.target.closest("[data-sell]");
  if (sellBtn) { sellCard(sellBtn.dataset.sell); return; }
});

/* ---------- boot ---------- */
render();
