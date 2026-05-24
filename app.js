const AUCTIONS = [
  {
    id: "lot-356",
    title: "1967 Porsche 911S Coupe",
    make: "Porsche",
    model: "911S",
    year: 1967,
    vin: "308012S",
    engine: "2.0L flat-six",
    transmission: "Manual",
    mileage: 42700,
    location: "Scottsdale, AZ",
    status: "live",
    currentBid: 248000,
    reserve: 225000,
    watchers: 812,
    comments: 134,
    endsInMinutes: 94,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=82",
    story: "Numbers-matching short-wheelbase 911S with Kardex copy, recent compression test, and records from long-term California ownership.",
    condition: "Older glass-out repaint, restored Fuchs, correct Weber carburetors, clean underside, and minor patina on the original dash trim."
  },
  {
    id: "lot-412",
    title: "1958 Mercedes-Benz 190SL",
    make: "Mercedes-Benz",
    model: "190SL",
    year: 1958,
    vin: "1210428501021",
    engine: "1.9L inline-four",
    transmission: "Manual",
    mileage: 68300,
    location: "Greenwich, CT",
    status: "live",
    currentBid: 171500,
    reserve: 185000,
    watchers: 544,
    comments: 89,
    endsInMinutes: 42,
    image: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=1200&q=82",
    story: "Two-top roadster with documented refurbishment, tool roll, data card, and recent independent inspection.",
    condition: "Excellent leather and brightwork, correct Solex carburetors, strong cold start, and a small paint chip noted on the left rocker."
  },
  {
    id: "lot-287",
    title: "1972 Datsun 240Z Series II",
    make: "Datsun",
    model: "240Z",
    year: 1972,
    vin: "HLS3082451",
    engine: "2.4L inline-six",
    transmission: "Manual",
    mileage: 91840,
    location: "Portland, OR",
    status: "live",
    currentBid: 68500,
    reserve: 64000,
    watchers: 391,
    comments: 57,
    endsInMinutes: 18,
    image: "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1200&q=82",
    story: "Dry-climate Z with rebuilt SU carburetors, refreshed suspension, service binder, and original color combination.",
    condition: "Straight panels, driver-quality repaint, clean hatch area, rebuilt brake hydraulics, and small cracks in the console plastic."
  },
  {
    id: "lot-519",
    title: "1965 Ford Mustang Fastback",
    make: "Ford",
    model: "Mustang",
    year: 1965,
    vin: "5F09A742211",
    engine: "289ci V8",
    transmission: "Manual",
    mileage: 12400,
    location: "Nashville, TN",
    status: "upcoming",
    currentBid: 0,
    reserve: 92000,
    watchers: 229,
    comments: 21,
    endsInMinutes: 1660,
    image: "https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?auto=format&fit=crop&w=1200&q=82",
    story: "A-code fastback prepared for a seven-day auction window with Marti report, restoration photos, and dyno sheet.",
    condition: "Fresh interior, strong paint depth readings, tidy engine bay, and pending cold-start video."
  },
  {
    id: "lot-221",
    title: "1988 BMW M3",
    make: "BMW",
    model: "M3",
    year: 1988,
    vin: "WBSAK0303J2198774",
    engine: "2.3L S14 inline-four",
    transmission: "Manual",
    mileage: 76400,
    location: "Chicago, IL",
    status: "ended",
    currentBid: 126000,
    reserve: 118000,
    watchers: 477,
    comments: 76,
    endsInMinutes: -240,
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=82",
    story: "Clean E30 M3 with ownership history back to 1997, recent valve adjustment, and unmodified bodywork.",
    condition: "Sale completed after reserve was met. Buyer documents and carrier pickup are in progress."
  }
];

const RESULTS = [
  { label: "356", year: 1964, amount: 132000 },
  { label: "E-Type", year: 1966, amount: 216000 },
  { label: "2002tii", year: 1974, amount: 69000 },
  { label: "Giulia", year: 1967, amount: 104000 },
  { label: "Bronco", year: 1972, amount: 151000 },
  { label: "Testarossa", year: 1987, amount: 288000 },
  { label: "240Z", year: 1971, amount: 82000 }
];

const state = {
  auctions: AUCTIONS.map((auction) => ({
    ...auction,
    endTime: Date.now() + auction.endsInMinutes * 60 * 1000,
    bidHistory: auction.currentBid ? [{ user: "collector41", amount: auction.currentBid, at: "Current high bid" }] : [],
    thread: [
      { user: "marshal", text: "Inspection report and underbody photos are attached to the gallery.", at: "18 min ago" },
      { user: "seller", text: "@petrolnotes cold-start video was added this morning.", at: "7 min ago" }
    ]
  })),
  selectedId: "lot-356",
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
    node.querySelector(".timer").textContent = formatTime(auction.endTime - Date.now());
    node.querySelector("h3").textContent = auction.title;
    node.querySelector(".meta").textContent = `${auction.location} • ${auction.mileage.toLocaleString()} miles • ${auction.comments} comments`;
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
    .sort((a, b) => a.endTime - b.endTime)
    .slice(0, 4);

  elements.endingSoon.innerHTML = liveLots
    .map((auction) => `
      <article class="ending-item">
        <strong>${auction.title}</strong>
        <span>${formatTime(auction.endTime - Date.now())} • ${money.format(auction.currentBid)}</span>
        <span>${auction.comments} comments • ${auction.watchers + (state.watched.has(auction.id) ? 1 : 0)} watching</span>
      </article>
    `)
    .join("");
}

function renderSelectedLot() {
  const auction = state.auctions.find((item) => item.id === state.selectedId);
  if (!auction) return;
  const fee = buyerFee(auction.currentBid || auction.reserve);
  const minNextBid = auction.currentBid ? auction.currentBid + Math.max(1000, Math.ceil(auction.currentBid * 0.02 / 500) * 500) : auction.reserve;

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
          <span class="timer">${formatTime(auction.endTime - Date.now())}</span>
          <div class="amount">${auction.currentBid ? money.format(auction.currentBid) : "Awaiting first bid"}</div>
          <span>Reserve ${auction.currentBid >= auction.reserve ? "met" : "not met"} • buyer fee ${money.format(fee)} • total ${money.format((auction.currentBid || auction.reserve) + fee)}</span>
          <div class="bid-controls">
            <input id="bidAmount" type="number" min="${minNextBid}" step="500" value="${minNextBid}" aria-label="Bid amount" />
            <button class="button primary" id="placeBid" type="button">Place Bid</button>
          </div>
        </div>
        <div class="comments">
          <h3>Comment thread</h3>
          ${auction.thread.map((comment) => `
            <div class="comment">
              <strong>${comment.user}</strong>
              <span class="comment-meta">${comment.at}</span>
              <p>${comment.text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </article>
  `;

  document.querySelector("#placeBid").addEventListener("click", () => placeBid(auction.id));
}

function renderMetrics() {
  const live = state.auctions.filter((auction) => auction.status === "live");
  const volume = live.reduce((sum, auction) => sum + auction.currentBid, 0);
  elements.liveCount.textContent = live.length;
  elements.watchCount.textContent = state.watched.size;
  elements.bidVolume.textContent = money.format(volume);
}

function renderChart() {
  const max = Number(elements.resultRange.value);
  const visible = RESULTS.filter((result) => result.amount <= max);
  const highest = Math.max(...RESULTS.map((result) => result.amount));
  elements.resultsChart.innerHTML = visible.map((result) => `
    <div class="bar">
      <div class="bar-fill" style="height: ${Math.round((result.amount / highest) * 100)}%"></div>
      <strong>${money.format(result.amount)}</strong>
      <span>${result.year} ${result.label}</span>
    </div>
  `).join("");
}

function renderAdmin() {
  const pending = state.auctions.filter((auction) => auction.status === "upcoming").length;
  const disputes = state.auctions.filter((auction) => auction.status === "ended").length;
  const cards = [
    ["Listings awaiting approval", pending, "Review VINs, titles, photo count, reserve strategy, and seller agreements."],
    ["Deposits verified", 86, "Card holds are active for qualified bidders on live lots."],
    ["Active comments", state.auctions.reduce((sum, auction) => sum + auction.comments, 0), "Moderation queue is clear; tagged users receive notifications."],
    ["Post-sale workflows", disputes, "Escrow, title transfer, and carrier pickup are being tracked."]
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

function placeBid(id) {
  const auction = state.auctions.find((item) => item.id === id);
  const input = document.querySelector("#bidAmount");
  const amount = Number(input.value);
  if (!amount || amount <= auction.currentBid) {
    input.setCustomValidity("Bid must exceed current bid.");
    input.reportValidity();
    return;
  }
  auction.currentBid = amount;
  auction.status = "live";
  auction.bidHistory.unshift({ user: "you", amount, at: "Just now" });
  auction.thread.unshift({ user: "system", text: `New high bid recorded at ${money.format(amount)}.`, at: "Just now" });

  const remaining = auction.endTime - Date.now();
  if (remaining > 0 && remaining < 2 * 60 * 1000) {
    auction.endTime = Date.now() + 2 * 60 * 1000;
    auction.thread.unshift({ user: "system", text: "Anti-sniping protection extended this auction by two minutes.", at: "Just now" });
  }
  renderAll();
}

function populateFilters() {
  const makes = [...new Set(state.auctions.map((auction) => auction.make))].sort();
  makes.forEach((make) => {
    const option = document.createElement("option");
    option.value = make;
    option.textContent = make;
    elements.makeFilter.append(option);
  });
}

function wireEvents() {
  [elements.searchInput, elements.statusFilter, elements.makeFilter, elements.transmissionFilter, elements.yearMin, elements.priceMax].forEach((element) => {
    element.addEventListener("input", renderCards);
  });
  elements.resultRange.addEventListener("input", renderChart);
  elements.themeToggle.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
  elements.sellerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.sellerForm);
    const title = data.get("title");
    elements.formStatus.textContent = `${title} saved as a draft for verification.`;
    elements.sellerForm.reset();
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

populateFilters();
wireEvents();
renderAll();
setInterval(() => {
  renderCards();
  renderEndingSoon();
  renderSelectedLot();
}, 1000);
