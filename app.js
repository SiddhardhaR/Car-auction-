const state = {
  auctions: [],
  results: [],
  dashboard: null,
  selectedId: null,
  watched: new Set(JSON.parse(localStorage.getItem("watchedAuctions") || "[]"))
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const elements = {
  auctionGrid: document.querySelector("#auctionGrid"),
  endingSoon: document.querySelector("#endingSoon"),
  selectedLot: document.querySelector("#selectedLot"),
  cardTemplate: document.querySelector("#auctionCardTemplate"),
  liveCount: document.querySelector("#liveCount"),
  watchCount: document.querySelector("#watchCount"),
  bidVolume: document.querySelector("#bidVolume"),
  makeFilter: document.querySelector("#makeFilter"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  transmissionFilter: document.querySelector("#transmissionFilter"),
  yearMin: document.querySelector("#yearMin"),
  priceMax: document.querySelector("#priceMax"),
  resultRange: document.querySelector("#resultRange"),
  resultsChart: document.querySelector("#resultsChart"),
  adminGrid: document.querySelector("#adminGrid"),
  sellerForm: document.querySelector("#sellerForm"),
  formStatus: document.querySelector("#formStatus"),
  themeToggle: document.querySelector("#themeToggle")
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

async function loadData() {
  const [auctions, results, dashboard] = await Promise.all([
    api("/api/auctions"),
    api("/api/results"),
    api("/api/dashboard")
  ]);

  state.auctions = auctions;
  state.results = results;
  state.dashboard = dashboard;
  state.selectedId ||= auctions[0]?.id;
  populateFilters();
  renderAll();
}

function formatTime(ms) {
  if (ms <= 0) return "Ended";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function buyerFee(amount) {
  return Math.min(Math.max(amount * 0.05, 250), 7500);
}

function getEndTime(auction) {
  return new Date(auction.endTime).getTime();
}

function getMinimumNextBid(auction) {
  if (!auction.currentBid) return auction.reserve || 500;
  return auction.currentBid + Math.max(1000, Math.ceil((auction.currentBid * 0.02) / 500) * 500);
}

function getFilteredAuctions() {
  const term = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const make = elements.makeFilter.value;
  const transmission = elements.transmissionFilter.value;
  const yearMin = Number(elements.yearMin.value || 0);
  const priceMax = Number(elements.priceMax.value || Number.POSITIVE_INFINITY);

  return state.auctions.filter((auction) => {
    const haystack = `${auction.title} ${auction.make} ${auction.model} ${auction.location}`.toLowerCase();
    return (
      (!term || haystack.includes(term)) &&
      (status === "all" || auction.status === status) &&
      (make === "all" || auction.make === make) &&
      (transmission === "all" || auction.transmission === transmission) &&
      (!yearMin || auction.year >= yearMin) &&
      auction.currentBid <= priceMax
    );
  });
}

function renderCards() {
  elements.auctionGrid.replaceChildren();
  getFilteredAuctions().forEach((auction) => {
    const node = elements.cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".auction-card");
    const image = node.querySelector("img");
    const watchButton = node.querySelector(".watch-button");
    const status = node.querySelector(".status-pill");

    image.src = auction.image;
    image.alt = auction.title;
    status.textContent = auction.status;
    status.classList.add(auction.status);
    node.querySelector(".timer").textContent = formatTime(getEndTime(auction) - Date.now());
    node.querySelector("h3").textContent = auction.title;
    node.querySelector(".meta").textContent = `${auction.location} - ${auction.mileage.toLocaleString()} miles - ${auction.comments} comments`;
    node.querySelector("strong").textContent = auction.currentBid ? money.format(auction.currentBid) : "Preview";
    watchButton.classList.toggle("active", state.watched.has(auction.id));
    watchButton.textContent = state.watched.has(auction.id) ? "★" : "☆";
    watchButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleWatch(auction.id);
    });
    card.querySelector(".button").addEventListener("click", () => selectAuction(auction.id));
    card.addEventListener("dblclick", () => selectAuction(auction.id));
    elements.auctionGrid.append(node);
  });
}

function renderEndingSoon() {
  const liveLots = state.auctions
    .filter((auction) => auction.status === "live")
    .sort((a, b) => getEndTime(a) - getEndTime(b))
    .slice(0, 4);

  elements.endingSoon.innerHTML = liveLots
    .map((auction) => `
      <article class="ending-item">
        <strong>${auction.title}</strong>
        <span>${formatTime(getEndTime(auction) - Date.now())} - ${money.format(auction.currentBid)}</span>
        <span>${auction.comments} comments - ${auction.watchers + (state.watched.has(auction.id) ? 1 : 0)} watching</span>
      </article>
    `)
    .join("");
}

function renderSelectedLot() {
  const auction = state.auctions.find((item) => item.id === state.selectedId);
  if (!auction) return;
  const fee = buyerFee(auction.currentBid || auction.reserve);
  const minNextBid = getMinimumNextBid(auction);

  elements.selectedLot.innerHTML = `
    <article class="detail-card">
      <div class="detail-gallery">
        <img src="${auction.image}" alt="${auction.title}" />
        <img src="${auction.image}&sat=-20" alt="${auction.title} detail view" />
      </div>
      <div class="detail-info">
        <p class="eyebrow">${auction.status === "live" ? "Transparent live bidding" : auction.status}</p>
        <h2>${auction.title}</h2>
        <p>${auction.story}</p>
        <div class="spec-list">
          <div><span>VIN</span>${auction.vin}</div>
          <div><span>Engine</span>${auction.engine}</div>
          <div><span>Transmission</span>${auction.transmission}</div>
          <div><span>Location</span>${auction.location}</div>
        </div>
        <p>${auction.condition}</p>
        <div class="bid-box">
          <span class="timer">${formatTime(getEndTime(auction) - Date.now())}</span>
          <div class="amount">${auction.currentBid ? money.format(auction.currentBid) : "Awaiting first bid"}</div>
          <span>Reserve ${auction.currentBid >= auction.reserve ? "met" : "not met"} - buyer fee ${money.format(fee)} - total ${money.format((auction.currentBid || auction.reserve) + fee)}</span>
          <div class="bid-controls">
            <input id="bidAmount" type="number" min="${minNextBid}" step="500" value="${minNextBid}" aria-label="Bid amount" />
            <button class="button primary" id="placeBid" type="button">Place Bid</button>
          </div>
          <p class="form-status" id="bidStatus"></p>
        </div>
        <div class="comments">
          <h3>Comment thread</h3>
          ${auction.thread.map((comment) => `
            <div class="comment">
              <strong>${comment.user}</strong>
              <span class="comment-meta">${formatCommentTime(comment.at)}</span>
              <p>${comment.text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </article>
  `;

  document.querySelector("#placeBid").addEventListener("click", () => placeBid(auction.id));
}

function formatCommentTime(value) {
  if (!value || value === "Just now" || !value.includes("T")) return value;
  return new Date(value).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

function renderMetrics() {
  const live = state.auctions.filter((auction) => auction.status === "live");
  const volume = state.dashboard?.activeBidVolume ?? live.reduce((sum, auction) => sum + auction.currentBid, 0);
  elements.liveCount.textContent = state.dashboard?.liveCount ?? live.length;
  elements.watchCount.textContent = state.watched.size;
  elements.bidVolume.textContent = money.format(volume);
}

function renderChart() {
  const max = Number(elements.resultRange.value);
  const visible = state.results.filter((result) => result.amount <= max);
  const highest = Math.max(...state.results.map((result) => result.amount), 1);
  elements.resultsChart.innerHTML = visible.map((result) => `
    <div class="bar">
      <div class="bar-fill" style="height: ${Math.round((result.amount / highest) * 100)}%"></div>
      <strong>${money.format(result.amount)}</strong>
      <span>${result.year} ${result.label}</span>
    </div>
  `).join("");
}

function renderAdmin() {
  const dashboard = state.dashboard || {};
  const cards = [
    ["Listings awaiting approval", dashboard.awaitingApproval ?? 0, "Review VINs, titles, photo count, reserve strategy, and seller agreements."],
    ["Deposits verified", dashboard.depositsVerified ?? 0, "Card holds are active for qualified bidders on live lots."],
    ["Active comments", dashboard.activeComments ?? 0, "Moderation queue is clear; tagged users receive notifications."],
    ["Post-sale workflows", dashboard.postSaleWorkflows ?? 0, "Escrow, title transfer, and carrier pickup are being tracked."]
  ];
  elements.adminGrid.innerHTML = cards.map(([label, value, copy]) => `
    <article class="admin-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${copy}</p>
    </article>
  `).join("");
}

function selectAuction(id) {
  state.selectedId = id;
  renderSelectedLot();
  document.querySelector("#selectedLot").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleWatch(id) {
  if (state.watched.has(id)) state.watched.delete(id);
  else state.watched.add(id);
  localStorage.setItem("watchedAuctions", JSON.stringify([...state.watched]));
  renderAll();
}

async function placeBid(id) {
  const input = document.querySelector("#bidAmount");
  const status = document.querySelector("#bidStatus");
  const amount = Number(input.value);
  status.textContent = "Recording bid...";

  try {
    const updatedAuction = await api(`/api/auctions/${id}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount, user: "you" })
    });
    state.auctions = state.auctions.map((auction) => (auction.id === id ? updatedAuction : auction));
    state.dashboard = await api("/api/dashboard");
    renderAll();
  } catch (error) {
    status.textContent = error.message;
    input.setCustomValidity(error.message);
    input.reportValidity();
    input.setCustomValidity("");
  }
}

function populateFilters() {
  const selected = elements.makeFilter.value || "all";
  elements.makeFilter.replaceChildren(new Option("All makes", "all"));
  const makes = [...new Set(state.auctions.map((auction) => auction.make))].sort();
  makes.forEach((make) => elements.makeFilter.append(new Option(make, make)));
  elements.makeFilter.value = makes.includes(selected) ? selected : "all";
}

function wireEvents() {
  [elements.searchInput, elements.statusFilter, elements.makeFilter, elements.transmissionFilter, elements.yearMin, elements.priceMax].forEach((element) => {
    element.addEventListener("input", renderCards);
  });
  elements.resultRange.addEventListener("input", renderChart);
  elements.themeToggle.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
  elements.sellerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.formStatus.textContent = "Saving draft...";
    const data = Object.fromEntries(new FormData(elements.sellerForm));

    try {
      const draft = await api("/api/submissions", {
        method: "POST",
        body: JSON.stringify(data)
      });
      state.dashboard = await api("/api/dashboard");
      elements.formStatus.textContent = `${draft.title} saved as a draft for verification.`;
      elements.sellerForm.reset();
      renderAdmin();
    } catch (error) {
      elements.formStatus.textContent = error.message;
    }
  });
}

function renderAll() {
  renderCards();
  renderEndingSoon();
  renderSelectedLot();
  renderMetrics();
  renderChart();
  renderAdmin();
}

wireEvents();
loadData().catch((error) => {
  elements.auctionGrid.innerHTML = `<p class="form-status">${error.message}</p>`;
});

setInterval(() => {
  if (!state.auctions.length) return;
  renderCards();
  renderEndingSoon();
  renderSelectedLot();
}, 1000);

setInterval(() => {
  loadData().catch(() => {});
}, 15000);
