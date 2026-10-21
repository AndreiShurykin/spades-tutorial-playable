(() => {
  const C = () => window.TUTORIAL_COPY;
  const GOAL = 4;
  const POINTS_PER_BID = 10;
  const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const SUIT_ORDER = ["C", "D", "H", "S"];
  const SUIT_COLOR = { C: "black", D: "red", H: "red", S: "black" };
  /** Visual cap for opponent/partner card-back stacks. */
  const BACK_MAX = { north: 7, west: 6, east: 6 };

  /**
   * Full 13-card hands from SeedsHandler.TutorialSeed
   * (Assets/_Game/Scripts/Scripts N/Tutorial/SeedsHandler.cs).
   * Codes are Suit+Rank; sprites are Rank+Suit (Unity).
   */
  const START_HANDS = {
    south: ["D4", "D10", "DJ", "C9", "CK", "CA", "H3", "H8", "HJ", "HK", "S10", "SQ", "SK"],
    west: ["D5", "D6", "D7", "D8", "D9", "C2", "C3", "C4", "H7", "H10", "S6", "S8", "SJ"],
    north: ["D2", "DQ", "DA", "C5", "CJ", "CQ", "H5", "HQ", "S2", "S4", "S5", "S7", "S9"],
    east: ["D3", "DK", "C6", "C7", "C8", "C10", "H2", "H4", "H6", "H9", "HA", "S3", "SA"],
  };

  const SEAT_LABEL = {
    south: "you",
    north: "partner",
    west: "them",
    east: "them",
  };

  const el = {
    goal: document.getElementById("goalPill"),
    score: document.getElementById("scorePill"),
    tip: document.getElementById("tip"),
    flash: document.getElementById("flash"),
    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    modalBody: document.getElementById("modalBody"),
    modalFoot: document.getElementById("modalFoot"),
    modalCta: document.getElementById("modalCta"),
    hands: {
      south: document.getElementById("handSouth"),
      north: document.getElementById("handNorth"),
      west: document.getElementById("handWest"),
      east: document.getElementById("handEast"),
    },
    slots: {
      south: document.getElementById("slotSouth"),
      north: document.getElementById("slotNorth"),
      west: document.getElementById("slotWest"),
      east: document.getElementById("slotEast"),
    },
    labels: {
      south: document.getElementById("labelSouth"),
      north: document.getElementById("labelNorth"),
      west: document.getElementById("labelWest"),
      east: document.getElementById("labelEast"),
    },
    restart: document.getElementById("restartBtn"),
  };

  const state = {
    hands: null,
    trick: [],
    ledSuit: null,
    spadesBroken: false,
    teamTricks: 0,
    themTricks: 0,
    bags: 0,
    points: 0,
    contractMade: false,
    leader: "west",
    tricksPlayed: 0,
    awaitingHuman: false,
    sawFirstTrickModal: false,
    sawFollowTip: false,
    sawLeadTip: false,
    sawTrumpTip: false,
    sawBrokenTip: false,
    skipTeachingPauses: false,
    busy: false,
    runId: 0,
  };

  /** Hand codes are Suit+Rank (e.g. D4, S10, SK). Sprites are Rank+Suit (4D, TS, KS). */
  function parseCard(code) {
    const suit = code[0];
    const rank = code.slice(1);
    return { code, suit, rank, color: SUIT_COLOR[suit] };
  }

  /** Unity sprite filenames use T for ten (e.g. TS.png). */
  function spriteName(card) {
    const rank = card.rank === "10" ? "T" : card.rank;
    return `${rank}${card.suit}`;
  }

  function rankValue(rank) {
    return RANK_ORDER.indexOf(rank);
  }

  function sortHand(codes) {
    return codes.slice().sort((a, b) => {
      const ca = parseCard(a);
      const cb = parseCard(b);
      const s = SUIT_ORDER.indexOf(ca.suit) - SUIT_ORDER.indexOf(cb.suit);
      if (s !== 0) return s;
      return rankValue(ca.rank) - rankValue(cb.rank);
    });
  }

  function contractPoints() {
    return GOAL * POINTS_PER_BID;
  }

  function totalPoints() {
    if (!state.contractMade) return 0;
    return contractPoints() + state.bags;
  }

  function fmtGoal() {
    const copy = C().hud;
    if (state.contractMade) {
      el.goal.textContent = copy.teamTricksMade
        .replace("{current}", String(state.teamTricks))
        .replace("{goal}", String(GOAL))
        .replace("{points}", String(totalPoints()));
      el.goal.classList.add("made");
    } else {
      el.goal.textContent = copy.teamTricks
        .replace("{current}", String(state.teamTricks))
        .replace("{goal}", String(GOAL));
      el.goal.classList.remove("made");
    }

    if (state.bags > 0) {
      el.score.hidden = false;
      el.score.textContent = copy.bags
        .replace("{bags}", String(state.bags))
        .replace("{s}", state.bags === 1 ? "" : "s");
    } else {
      el.score.hidden = true;
    }
  }

  function cardNode(card, { face = true, clickable = false, legal = false, illegal = false } = {}) {
    const div = document.createElement("div");
    div.className = "card";
    if (card) {
      div.dataset.code = card.code;
      div.dataset.suit = card.suit;
      div.classList.add(card.color);
    }
    if (!face) {
      div.classList.add("back");
      div.setAttribute("aria-label", "card back");
      return div;
    }
    const img = document.createElement("img");
    img.className = "face";
    img.alt = `${card.rank} of ${card.suit}`;
    img.draggable = false;
    img.src = `assets/cards/${spriteName(card)}.png`;
    div.appendChild(img);
    if (clickable) div.classList.add("clickable");
    if (legal) div.classList.add("legal");
    if (illegal) div.classList.add("illegal");
    return div;
  }

  function layoutFan(handEl, count) {
    const cards = [...handEl.querySelectorAll(".card")];
    if (!count) return;
    const maxSpread = 300;
    const step = count <= 1 ? 0 : Math.min(26, maxSpread / (count - 1));
    const start = -((count - 1) * step) / 2;
    const maxAngle = Math.min(30, 2.6 * (count - 1));
    cards.forEach((node, i) => {
      const x = start + i * step;
      const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
      const rot = t * (maxAngle / 2);
      const y = Math.abs(t) * 10;
      node.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${rot}deg)`;
      node.style.zIndex = String(10 + i);
    });
  }

  function renderHands() {
    const copy = C();
    el.labels.south.textContent = copy.hud.you;
    el.labels.north.textContent = copy.hud.partner;
    el.labels.west.textContent = copy.hud.left;
    el.labels.east.textContent = copy.hud.right;

    for (const seat of ["north", "west", "east"]) {
      const handEl = el.hands[seat];
      handEl.innerHTML = "";
      const n = Math.min(BACK_MAX[seat], state.hands[seat].length);
      for (let i = 0; i < n; i++) {
        handEl.appendChild(cardNode(null, { face: false }));
      }
    }

    const south = el.hands.south;
    south.innerHTML = "";
    const legalSet = new Set(legalCardsFor("south").map((c) => c.code));
    const ordered = sortHand(state.hands.south);
    ordered.forEach((code) => {
      const card = parseCard(code);
      const isLegal = legalSet.has(code);
      const node = cardNode(card, {
        face: true,
        clickable: state.awaitingHuman,
        legal: state.awaitingHuman && isLegal,
        illegal: state.awaitingHuman && !isLegal,
      });
      if (state.awaitingHuman) {
        node.addEventListener("click", () => onHumanPlay(code));
      }
      south.appendChild(node);
    });
    layoutFan(south, ordered.length);
  }

  function clearTrickSlots() {
    Object.values(el.slots).forEach((s) => { s.innerHTML = ""; });
  }

  function placeOnTable(seat, card) {
    el.slots[seat].innerHTML = "";
    el.slots[seat].appendChild(cardNode(card, { face: true }));
  }

  function showTip(text) {
    el.tip.textContent = text;
    el.tip.classList.add("show");
  }

  function hideTip() {
    el.tip.classList.remove("show");
  }

  async function flashWin(kind, extraMs = 0) {
    const text = C().flash[kind];
    if (!text) return;
    el.flash.textContent = text;
    el.flash.className = `flash show ${kind}`;
    await wait(state.skipTeachingPauses ? 520 : 900 + extraMs);
    el.flash.classList.remove("show");
  }

  function showModal(stepKey, bodyOverrides = {}) {
    const step = C().steps[stepKey];
    let body = step.body;
    Object.entries(bodyOverrides).forEach(([key, val]) => {
      body = body.replace(`{${key}}`, String(val));
    });
    el.modalTitle.textContent = step.title;
    el.modalBody.textContent = body;
    if (step.footnote) {
      el.modalFoot.textContent = step.footnote;
      el.modalFoot.hidden = false;
    } else {
      el.modalFoot.hidden = true;
    }
    el.modalCta.textContent = step.cta;
    el.modal.dataset.step = stepKey;
    el.modal.classList.add("show");
    return new Promise((resolve) => {
      const onClick = () => {
        el.modalCta.removeEventListener("click", onClick);
        el.modal.classList.remove("show");
        resolve(stepKey);
      };
      el.modalCta.addEventListener("click", onClick);
    });
  }

  function legalCardsFor(seat) {
    const hand = state.hands[seat].map(parseCard);
    if (!state.ledSuit) {
      if (!state.spadesBroken) return hand.filter((c) => c.suit !== "S");
      return hand.slice();
    }
    const inSuit = hand.filter((c) => c.suit === state.ledSuit);
    return inSuit.length ? inSuit : hand.slice();
  }

  function pickBotCard(seat) {
    const legal = legalCardsFor(seat);
    if (seat === "north") {
      // Partner: prefer winning high when following; lead mid-high.
      legal.sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
    } else {
      legal.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    }
    return legal[0];
  }

  function removeFromHand(seat, code) {
    state.hands[seat] = state.hands[seat].filter((c) => c !== code);
  }

  function winnerOfTrick(plays) {
    const led = plays[0].card.suit;
    let best = plays[0];
    for (const p of plays.slice(1)) {
      const c = p.card;
      const b = best.card;
      if (c.suit === "S" && b.suit !== "S") {
        best = p;
      } else if (c.suit === "S" && b.suit === "S") {
        if (rankValue(c.rank) > rankValue(b.rank)) best = p;
      } else if (c.suit === led && b.suit === led) {
        if (rankValue(c.rank) > rankValue(b.rank)) best = p;
      } else if (c.suit === led && b.suit !== "S" && b.suit !== led) {
        best = p;
      }
    }
    return best.seat;
  }

  const ORDER = ["west", "north", "east", "south"];

  function seatsFrom(leader) {
    const i = ORDER.indexOf(leader);
    return ORDER.slice(i).concat(ORDER.slice(0, i));
  }

  async function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function playCard(seat, code) {
    const card = parseCard(code);
    const wasBroken = state.spadesBroken;
    removeFromHand(seat, code);
    if (!state.ledSuit) state.ledSuit = card.suit;
    if (card.suit === "S") {
      if (state.trick.length > 0 && state.ledSuit !== "S") state.spadesBroken = true;
      if (state.ledSuit === "S") state.spadesBroken = true;
    }
    state.trick.push({ seat, card });
    placeOnTable(seat, card);
    renderHands();

    if (state.spadesBroken && !wasBroken && !state.sawBrokenTip && state.ledSuit !== "S") {
      state.sawBrokenTip = true;
      if (!state.skipTeachingPauses) {
        showTip(C().steps.spadesBroken.tip);
        await wait(1200);
        hideTip();
      }
    }

    await wait(state.skipTeachingPauses ? 220 : 380);
  }

  async function resolveTrick() {
    const winner = winnerOfTrick(state.trick);
    const winCard = state.trick.find((p) => p.seat === winner).card;
    const trumpWin = winCard.suit === "S" && state.trick.some((p) => p.card.suit === "S");
    const teamWin = winner === "south" || winner === "north";

    if (teamWin) {
      state.teamTricks += 1;
      if (state.contractMade) {
        state.bags += 1;
      }
    } else {
      state.themTricks += 1;
    }
    state.tricksPlayed += 1;
    fmtGoal();

    // Pulse goal when team count changes
    if (teamWin) {
      el.goal.classList.add("pulse");
      setTimeout(() => el.goal.classList.remove("pulse"), 500);
    }

    await wait(state.skipTeachingPauses ? 280 : 480);

    const flashKind = SEAT_LABEL[winner];
    await flashWin(flashKind);

    if (teamWin && state.bags > 0 && state.contractMade) {
      await flashWin("bag", -200);
    }

    if (trumpWin && !state.sawTrumpTip) {
      state.sawTrumpTip = true;
      if (!state.skipTeachingPauses) {
        showTip(C().steps.spadesTrump.tip);
        await wait(1500);
        hideTip();
      }
    }

    if (!state.sawFirstTrickModal && !state.skipTeachingPauses) {
      state.sawFirstTrickModal = true;
      hideTip();
      await showModal("trickExplained");
    }

    if (winner === "south" && !state.sawLeadTip && !state.skipTeachingPauses) {
      state.sawLeadTip = true;
      showTip(C().steps.youWonLead.tip);
    } else if (!state.skipTeachingPauses) {
      hideTip();
    } else {
      hideTip();
    }

    // Contract made — show once, then finish remaining tricks with lighter pauses
    if (state.teamTricks >= GOAL && !state.contractMade) {
      state.contractMade = true;
      state.points = contractPoints();
      fmtGoal();
      hideTip();
      await showModal("contractMade");
      state.skipTeachingPauses = true;
    }

    clearTrickSlots();
    state.trick = [];
    state.ledSuit = null;
    state.leader = winner;

    // Full hand finished (13 tricks)
    if (state.tricksPlayed >= 13 || state.hands.south.length === 0) {
      hideTip();
      const pts = totalPoints();
      if (state.contractMade) {
        const bagsNote = state.bags > 0
          ? ` (${GOAL * POINTS_PER_BID} + ${state.bags} bag${state.bags === 1 ? "" : "s"})`
          : "";
        await showModal("handComplete", { points: pts, bagsNote });
      } else {
        await showModal("handCompleteMissed", { tricks: state.teamTricks });
      }
      await resetGame(true);
      return false;
    }

    return true;
  }

  async function runBotSeats(seats) {
    for (const seat of seats) {
      if (seat === "south") return;
      const pick = pickBotCard(seat);
      await playCard(seat, pick.code);
    }
  }

  async function startTrick() {
    if (state.busy) return;
    state.busy = true;
    state.awaitingHuman = false;
    renderHands();

    const seats = seatsFrom(state.leader);
    const beforeHuman = [];
    for (const s of seats) {
      if (s === "south") break;
      beforeHuman.push(s);
    }
    await runBotSeats(beforeHuman);

    state.awaitingHuman = true;
    if (state.ledSuit === "C" && !state.sawFollowTip && !state.skipTeachingPauses) {
      state.sawFollowTip = true;
      showTip(C().steps.followSuit.tip);
    }
    renderHands();
    state.busy = false;
  }

  async function onHumanPlay(code) {
    if (!state.awaitingHuman || state.busy) return;
    const runId = state.runId;
    const legal = legalCardsFor("south").map((c) => c.code);
    const card = parseCard(code);

    if (!legal.includes(code)) {
      if (!state.ledSuit && card.suit === "S" && !state.spadesBroken) {
        showTip(C().steps.spadesLeadError.tip);
      } else {
        showTip(C().steps.followSuitError.tip);
      }
      return;
    }

    state.busy = true;
    state.awaitingHuman = false;
    hideTip();
    await playCard("south", code);
    if (runId !== state.runId) return;

    const seats = seatsFrom(state.leader);
    const idx = seats.indexOf("south");
    const after = seats.slice(idx + 1);
    for (const seat of after) {
      const pick = pickBotCard(seat);
      await playCard(seat, pick.code);
      if (runId !== state.runId) return;
    }

    const cont = await resolveTrick();
    if (runId !== state.runId) return;
    state.busy = false;
    if (cont) await startTrick();
  }

  async function resetGame(withIntro = true) {
    state.runId += 1;
    state.hands = {
      south: START_HANDS.south.slice(),
      west: START_HANDS.west.slice(),
      north: START_HANDS.north.slice(),
      east: START_HANDS.east.slice(),
    };
    state.trick = [];
    state.ledSuit = null;
    state.spadesBroken = false;
    state.teamTricks = 0;
    state.themTricks = 0;
    state.bags = 0;
    state.points = 0;
    state.contractMade = false;
    state.leader = "west";
    state.tricksPlayed = 0;
    state.awaitingHuman = false;
    state.sawFirstTrickModal = false;
    state.sawFollowTip = false;
    state.sawLeadTip = false;
    state.sawTrumpTip = false;
    state.sawBrokenTip = false;
    state.skipTeachingPauses = false;
    state.busy = false;
    hideTip();
    el.flash.classList.remove("show");
    clearTrickSlots();
    fmtGoal();
    renderHands();

    const skipIntro = new URLSearchParams(location.search).has("skipIntro");
    if (withIntro && !skipIntro) {
      await showModal("intro");
      await showModal("goal");
      await showModal("howToWin");
      await showModal("spadesTrumpIntro");
    }
    await startTrick();
  }

  el.restart.addEventListener("click", () => {
    resetGame(true);
  });

  document.getElementById("restartLabel").textContent = C().hud.restart;
  resetGame(true);
})();
