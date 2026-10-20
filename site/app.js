(function () {
  const C = window.CONFIG;
  const D = C.defaults;
  const $ = (id) => document.getElementById(id);
  const money = (n) => (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
  const num = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const val = (id) => { const el = $(id); if (!el) return 0; const n = parseFloat(String(el.value).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : 0; };
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Money inputs: show commas, read digits
  const fmtMoney = (el) => { const n = val(el.id); el.value = n ? n.toLocaleString("en-US") : ""; };
  document.querySelectorAll("input[data-money]").forEach((el) => {
    el.addEventListener("blur", () => fmtMoney(el));
    el.addEventListener("focus", () => { el.value = String(el.value).replace(/[^0-9.\-]/g, ""); });
  });
  const setInput = (id, v) => { const el = $(id); if (!el) return; el.value = v; if (el.hasAttribute("data-money")) fmtMoney(el); };

  // ---------- Config text ----------
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const k = el.getAttribute("data-cfg");
    if (C[k]) el.textContent = C[k];
  });
  document.title = C.projectName;

  // ---------- Nav ----------
  const navToggle = $("navToggle"), navLinks = $("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")));

  // ---------- Payment helper ----------
  const payment = (P, ratePct, years = 30) => {
    if (P <= 0) return 0;
    const r = Math.max(0, ratePct) / 100 / 12, n = years * 12;
    if (r === 0) return P / n;
    return (P * r) / (1 - Math.pow(1 + r, -n));
  };
  const famCount = () => Math.max(2, Math.min(12, Math.round(val("families")) || D.families));

  // ---------- Apart vs together ----------
  function renderCompare() {
    const f = famCount();
    const sharedWells = Math.max(1, Math.ceil(f / 3));
    $("cmpApartHead").textContent = `${f} houses in ${f} towns`;
    const rows = [
      ["Wells", `${f} wells, ${money(f * D.wellCost)}`, `${sharedWells} shared, ${money(sharedWells * D.wellCost)}`],
      ["Access road and power run", `${f} separate driveways and line extensions`, "One road, one line, built once"],
      ["Tractor, skid steer, trailer, tools", `${f} of each, or borrowing from strangers`, "One set, shared, always nearby"],
      ["Childcare", `${f} daycare bills or ${f} scrambles`, "Cousins, grandparents, and aunts next door"],
      ["Aging parents", "Facility, or one family quits a job", `${f} households within a two-minute walk`],
      ["Beef and eggs", "Store prices, store quality", `Your own herd and coop; one family can't, ${f} can`],
      ["Big jobs (fence, hay, barn)", "Hire it out or burn a month", `A Saturday with ${f * 2}+ adults and a grill`],
      ["Holidays", `${f} cars on the interstate`, "Walk across the pasture"],
      ["Going on vacation", "House-sitter, kennel, dead plants, a favor owed", "Home, animals, and garden looked after by family"],
      ["A hard year", "You handle it alone", "Nobody handles anything alone"]
    ];
    $("compareBody").innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
  }

  // ---------- Grandparent days ----------
  function renderGp() {
    const days = Math.min(365, Math.max(0, val("gpVisits")) * Math.max(0, val("gpDays")));
    $("gpNow").textContent = num(days);
    $("gpNowTen").textContent = num(days * 10);
  }
  ["gpVisits", "gpDays"].forEach((id) => $(id).addEventListener("input", renderGp));
  renderGp();

  // ---------- Kids week toggle ----------
  document.querySelectorAll(".week-btn").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".week-btn").forEach((x) => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on); });
    $("weekNow").hidden = b.dataset.week !== "now";
    $("weekLand").hidden = b.dataset.week !== "land";
  }));

  // ---------- The numbers (Phase 1) ----------
  function utahIncomeTax(income) {
    const credit = Math.max(0, C.utahCreditBase - C.utahCreditPhaseoutRate * Math.max(0, income - C.utahCreditPhaseoutStart));
    return Math.max(0, income * C.utahIncomeTaxRate - credit);
  }
  function renderSavings() {
    const income = val("income"), chyIncome = val("cheyenneIncome");
    const utahHome = val("utahHome"), utahOwed = val("utahOwed"), utahRate = val("utahRate");
    const chyHome = val("cheyenneHome"), rate = val("mortgageRate"), groc = val("groceries");
    const incomeTax = utahIncomeTax(income);
    const grocTax = groc * 12 * C.utahGroceryTaxRate;
    const netProceeds = utahHome * (1 - C.sellingCostRate) - utahOwed;
    const chyLoan = Math.max(0, chyHome - Math.max(0, netProceeds));
    const utahPay = payment(utahOwed, utahRate);
    const chyPay = payment(chyLoan, rate);
    const mDiff = utahPay - chyPay;
    const cashLeft = netProceeds - chyHome;
    const payChange = chyIncome - income;
    const tenYear = (incomeTax + grocTax + payChange) * 10 + mDiff * 120;
    $("outIncomeTax").textContent = money(incomeTax);
    $("outGroceryTax").textContent = money(grocTax);
    $("outMortgage").textContent = (mDiff >= 0 ? "" : "–") + money(Math.abs(mDiff)).replace("-", "");
    $("outMortgageSub").textContent = mDiff >= 0
      ? `per month less: ${money(utahPay)} now vs ${money(chyPay)} on a ${money(chyLoan)} Cheyenne note`
      : `per month MORE: ${money(utahPay)} now vs ${money(chyPay)} on a ${money(chyLoan)} Cheyenne note. A low Utah rate is worth a lot; this is the honest line.`;
    $("outEquity").textContent = money(Math.max(0, netProceeds));
    $("outEquitySub").textContent = cashLeft >= 0
      ? `after 6% selling costs and your payoff. Buys the ${money(chyHome)} Cheyenne house outright with ${money(cashLeft)} left over.`
      : `after 6% selling costs and your payoff. Covers the down payment on the ${money(chyHome)} Cheyenne house; the remaining ${money(chyLoan)} is the note above.`;
    $("outPay").textContent = (payChange < 0 ? "–" : "") + money(Math.abs(payChange));
    $("outTenYear").textContent = (tenYear < 0 ? "–" : "") + money(Math.abs(tenYear));
  }
  ["income", "cheyenneIncome", "utahHome", "utahOwed", "utahRate", "cheyenneHome", "mortgageRate", "groceries"].forEach((id) => {
    setInput(id, D[id]);
    $(id).addEventListener("input", renderSavings);
  });
  renderSavings();

  // ---------- The land (Phase 2) ----------
  const landIds = ["acres", "pricePerAcre", "families", "futureSites", "wells", "wellCost", "waterLinesPerHome", "fencingTotal", "septicCost", "roadFeet", "roadCostPerFoot", "powerFeet", "powerCostPerFoot", "buildSqFt", "buildCostPerSqFt"];
  const landNumbers = () => {
    const fam = famCount();
    const land = val("acres") * val("pricePerAcre");
    const infra = val("wells") * val("wellCost") + val("waterLinesPerHome") * fam + val("fencingTotal") + val("roadFeet") * val("roadCostPerFoot") + val("powerFeet") * val("powerCostPerFoot");
    return { fam, land, infra };
  };
  function renderLand() {
    const { fam, land: landTotal, infra: infraTotal } = landNumbers();
    const acres = val("acres");
    const homeEach = val("buildSqFt") * val("buildCostPerSqFt") + val("septicCost");
    const landEach = landTotal / fam, infraEach = infraTotal / fam;
    const allIn = landEach + infraEach + homeEach;
    const future = Math.max(0, Math.min(6, Math.round(val("futureSites"))));
    $("outLandTotal").textContent = money(landTotal);
    $("outAcresEach").textContent = `${num(acres / fam, 1)} acres per family`;
    $("outLandEach").textContent = money(landEach);
    $("outInfraEach").textContent = money(infraEach);
    $("outInfraTotal").textContent = `${money(infraTotal)} total for wells, water lines, fence, road, power`;
    $("outHomeEach").textContent = money(homeEach);
    $("outHomeSub").textContent = `${num(val("buildSqFt"))} sq ft at ${money(val("buildCostPerSqFt"))}/sq ft, plus septic`;
    $("outAllIn").textContent = money(allIn);
    $("outDownEach").textContent = money((landEach + infraEach) * 0.25);
    $("outAllInNote").textContent = `Land, your share of shared infrastructure, and a ${num(val("buildSqFt"))} sq ft home. Only ${money(landEach + infraEach)} of it is the part we do together; the house is each family's own timeline and budget.${future ? ` The layout also reserves ${future} more home sites for later.` : ""} Yes, that is more than a tract house in town. It is also the real number, and it buys about ${num(acres / fam)} acres, a shop, a barn, and family next door for roughly what a median house costs in Salt Lake County today ($645,000).`;
    $("mapFamilies").textContent = `${fam} families` + (future ? ` plus ${future} future sites` : "");
    $("mapAcres").textContent = num(acres);
    drawMap(fam, future);
    renderCompare();
    renderHomestead();
  }
  landIds.forEach((id) => { setInput(id, D[id]); $(id).addEventListener("input", renderLand); });

  // ---------- Land concept map ----------
  function drawMap(fam, future) {
    const W = 640, H = 440;
    const mobile = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    const k = mobile ? 1.8 : 1;
    const fs = (n) => Math.round(n * k * 10) / 10;
    let s = "";
    s += `<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#cfd8b8"/>`;
    for (let i = 0; i < 60; i++) {
      const x = (i * 97) % W, y = 20 + ((i * 53) % 220);
      s += `<path d="M${x} ${y} l3 -7 l3 7" stroke="#aebb92" stroke-width="1.5" fill="none"/>`;
    }
    s += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="10" fill="none" stroke="#5f5a3e" stroke-width="2" stroke-dasharray="6 5"/>`;
    s += `<text x="24" y="${24 + fs(15)}" font-family="Oswald, sans-serif" font-size="${fs(15)}" fill="#3f3a28" letter-spacing="2">PASTURE</text>`;
    // county road
    s += `<rect x="0" y="${H - 30}" width="${W}" height="30" fill="#8a7f6a"/>`;
    s += `<line x1="0" y1="${H - 15}" x2="${W}" y2="${H - 15}" stroke="#f6efe3" stroke-width="2" stroke-dasharray="12 10"/>`;
    if (!mobile) s += `<text x="${W / 2}" y="${H - 9}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="11" fill="#fffaf2" letter-spacing="2">COUNTY ROAD</text>`;
    // shared loop road
    const roadY = 320;
    s += `<rect x="60" y="${roadY - 9}" width="${W - 120}" height="18" rx="9" fill="#b8ad96"/>`;
    s += `<rect x="${W / 2 - 9}" y="${roadY}" width="18" height="${H - 30 - roadY}" fill="#b8ad96"/>`;
    // barn + corrals
    const bx = W / 2, by = 120;
    s += `<rect x="${bx - 90}" y="${by - 50}" width="180" height="110" rx="6" fill="none" stroke="#5f5a3e" stroke-width="2"/>`;
    s += `<line x1="${bx - 90}" y1="${by + 10}" x2="${bx + 90}" y2="${by + 10}" stroke="#5f5a3e" stroke-width="2"/>`;
    s += `<text x="${bx}" y="${by + 48}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fs(11)}" fill="#3f3a28" letter-spacing="2">CORRALS</text>`;
    s += `<path d="M${bx - 34} ${by + 2} v-30 l34 -22 l34 22 v30 z" fill="#b5411f" stroke="#8f3217" stroke-width="2"/>`;
    s += `<rect x="${bx - 8}" y="${by - 14}" width="16" height="16" fill="#1b1511"/>`;
    s += `<text x="${bx}" y="${by - 58}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fs(13)}" fill="#3f3a28" letter-spacing="2">BARN + HAY</text>`;
    // garden
    s += `<rect x="150" y="200" width="110" height="70" rx="4" fill="#9fb07e" stroke="#5d6b4d" stroke-width="2"/>`;
    for (let i = 1; i < 6; i++) s += `<line x1="${150 + i * 18}" y1="204" x2="${150 + i * 18}" y2="266" stroke="#7c8b6a" stroke-width="1.5"/>`;
    s += `<text x="205" y="${270 + fs(14)}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fs(11)}" fill="#3f3a28" letter-spacing="2">GARDEN</text>`;
    // future sites on a spur road, spaced to fit
    if (future > 0) {
      const step = Math.min(58, Math.floor((roadY - 70) / future));
      const sx = 70, topY = roadY - 9 - future * step;
      s += `<rect x="${sx - 9}" y="${topY}" width="18" height="${roadY - topY}" rx="9" fill="#b8ad96" opacity=".7"/>`;
      for (let j = 0; j < future; j++) {
        const y = roadY - 30 - j * step;
        const hx = sx + 34;
        s += `<line x1="${sx}" y1="${y}" x2="${hx - 18}" y2="${y}" stroke="#b8ad96" stroke-width="5" opacity=".7"/>`;
        s += `<path d="M${hx - 14} ${y + 12} v-16 l14 -10 l14 10 v16 z" fill="none" stroke="#5f5a3e" stroke-width="2" stroke-dasharray="4 3"/>`;
        if (!mobile) s += `<text x="${hx}" y="${y + 24}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="8" fill="#5f5a3e" letter-spacing="1">FUTURE</text>`;
      }
    }
    // coop
    s += `<rect x="${W - 150}" y="210" width="60" height="40" rx="3" fill="#d9a441" stroke="#8f3217" stroke-width="2"/>`;
    s += `<rect x="${W - 150}" y="196" width="60" height="14" fill="#b5411f"/>`;
    s += `<rect x="${W - 86}" y="212" width="40" height="38" fill="none" stroke="#5f5a3e" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    s += `<text x="${W - 110}" y="${252 + fs(14)}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fs(11)}" fill="#3f3a28" letter-spacing="2">COOP</text>`;
    // wells
    const wells = Math.max(1, Math.min(6, Math.round(val("wells")) || 1));
    for (let w = 0; w < wells; w++) {
      const wx = bx + 130 + (w % 2) * 34, wy = by - 20 + Math.floor(w / 2) * 34;
      s += `<circle cx="${wx}" cy="${wy}" r="7" fill="#fff" stroke="#2d5c8a" stroke-width="2"/>`;
    }
    s += `<text x="${bx + 147}" y="${by - 32}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fs(10)}" fill="#2d5c8a">WELL${wells > 1 ? "S" : ""}</text>`;
    // homes
    const left = 70, right = W - 70, span = right - left;
    const hhs = C.households || [];
    for (let i = 0; i < fam; i++) {
      const x = fam === 1 ? W / 2 : left + (span * i) / (fam - 1);
      const y = roadY + 48;
      s += `<line x1="${x}" y1="${roadY}" x2="${x}" y2="${y - 22}" stroke="#b8ad96" stroke-width="6"/>`;
      s += `<circle cx="${x}" cy="${y - 4}" r="30" fill="#e6dcc3" opacity=".8"/>`;
      s += `<path d="M${x - 16} ${y + 10} v-18 l16 -12 l16 12 v18 z" fill="#f6efe3" stroke="#1b1511" stroke-width="2"/>`;
      s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="12" fill="#b5411f"/>`;
      const hh = hhs[i];
      const label = hh ? (mobile || fam > 6 ? (hh.short || hh.name.split(" ")[0]) : hh.name).toUpperCase() : `HOME ${i + 1}`;
      const size = mobile ? 13 : (fam > 6 ? 9 : 10);
      s += `<text x="${x}" y="${y + 14 + size}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${size}" fill="#3f3a28" letter-spacing=".5">${esc(label)}</text>`;
    }
    $("compoundMap").innerHTML = s;
  }
  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(renderLand, 200); });

  // ---------- Homestead ----------
  const homeIds = ["pastureShare", "calfPrice", "hens", "people"];
  const seg = $("acresPerPairSeg");
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    seg.querySelectorAll("button").forEach((x) => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on); });
    $("acresPerPair").value = b.dataset.v;
    renderHomestead();
  });
  $("acresPerPair").value = D.acresPerPair;
  seg.querySelectorAll("button").forEach((x) => { const on = +x.dataset.v === D.acresPerPair; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on); });
  function renderHomestead() {
    const acres = val("acres");
    const share = Math.min(95, Math.max(30, val("pastureShare"))) / 100;
    $("pastureOut").textContent = Math.round(share * 100) + "%";
    const pasture = acres * share;
    const app = Math.max(3, val("acresPerPair"));
    const pairs = Math.floor(pasture / app);
    const calves = Math.round(pairs * 0.9);
    const calfValue = calves * val("calfPrice");
    const hens = val("hens");
    const eggsWeek = Math.round(hens * 4.5);
    const dozYear = Math.round((eggsWeek * 52) / 12);
    const people = Math.max(1, val("people"));
    const lbPerPerson = 58, lbPerSteer = 480;
    const steers = Math.ceil((people * lbPerPerson) / lbPerSteer);
    $("outPairs").textContent = num(pairs);
    $("outPasture").textContent = `${num(pasture)} acres in pasture at ${num(app)} acres per pair`;
    $("outCalves").textContent = num(calves);
    $("outCalfValue").textContent = `worth about ${money(calfValue)} if all were sold`;
    $("outEggs").textContent = num(eggsWeek);
    $("outEggsSub").textContent = `${num(dozYear)} dozen a year from ${num(hens)} hens`;
    $("outSteers").textContent = num(steers);
    $("outSteersSub").textContent = `${num(people)} people at ~${lbPerPerson} lb of beef each, ~${lbPerSteer} lb per finished steer`;
    const keep = Math.min(steers, calves), sell = Math.max(0, calves - keep);
    $("outHomesteadLine").textContent = pairs > 0
      ? `${num(pairs)} pairs, ${num(calves)} calves a year, ${num(dozYear)} dozen eggs.`
      : "Chickens and a garden first; cattle when we add pasture.";
    $("outHomesteadNote").textContent = pairs > 0
      ? (sell > 0
        ? `Keep ${num(keep)} calves to finish for our own freezers and sell the other ${num(sell)} for roughly ${money(sell * val("calfPrice"))} a year, which covers hay and vet. These are planning numbers; the UW Extension office in Cheyenne will tighten them for the actual parcel.`
        : `All ${num(calves)} calves go into our own freezers, so the sale barn check comes later, once we lease more pasture or add head. Hay and vet get paid out of the household share until then. Eggs and the garden produce from day one.`)
      : `At ${num(app)} acres per pair this parcel doesn't carry cattle year-round yet. Lease neighboring pasture, buy hay, or improve the ground. Eggs and the garden start on day one regardless.`;
  }
  homeIds.forEach((id) => { setInput(id, D[id]); $(id).addEventListener("input", renderHomestead); });
  renderLand();

  // ---------- Together pays ----------
  const LINES = [
    { id: "beef", name: "Freezer beef", who: "Logan + everyone on butcher day", gross: 45000, hrs: 8, lin: true, note: "10 head a year, home-raised calves plus bought feeders, sold by the half and quarter" },
    { id: "bakery", name: "Sourdough and baked goods", who: "Abby", gross: 36000, hrs: 25, lin: true, note: "market Saturdays plus standing orders in town" },
    { id: "eggs", name: "Eggs", who: "the kids", gross: 12000, hrs: 6, lin: true, note: "30 hens to start, 100 at full scale" },
    { id: "soap", name: "Handmade soap and candles", who: "open", gross: 8000, hrs: 5, note: "market table, gift boxes, online" },
    { id: "produce", name: "Honey and produce", who: "open", gross: 6000, hrs: 6, lin: true, note: "high tunnel, a few hives, a farm stand" },
    { id: "firewood", name: "Firewood", who: "whoever has a Saturday", gross: 5000, hrs: 4, note: "seasonal, sold by the cord" },
    { id: "fab", name: "Welding and fab", who: "open", gross: 25000, hrs: 12, note: "gates, panels, trailer repair, custom work" },
    { id: "shop", name: "Vehicle and equipment repair", who: "Jacob", gross: 40000, hrs: 15, note: "outside work out of the ranch shop" },
    { id: "hay", name: "Hay", who: "Logan", gross: 10000, hrs: 5, lin: true, note: "if the ground and water allow" }
  ];
  const bizEl = $("bizLines");
  if (bizEl) {
    bizEl.innerHTML = LINES.map((l) => `
      <label class="biz-line">
        <input type="checkbox" data-line="${l.id}" checked>
        <span class="bl-main"><strong>${l.name}</strong><span class="bl-note">${l.note}. ${l.who === "open" ? "Open role" : "Run by " + l.who}.</span></span>
        <span class="bl-meta"><span class="bl-num" data-gross="${l.id}">${money(l.gross)}</span> <span class="bl-hrs" data-hrs="${l.id}">${l.hrs} hrs/wk</span></span>
      </label>`).join("");
    const hoursAt = (l, scale) => l.hrs * (l.lin ? scale : Math.pow(scale, 0.75));
    const loanPayment = () => {
      const { land, infra } = landNumbers();
      const principal = (land + infra) * 0.75;
      const ratePct = (val("mortgageRate") || 6.5) + 1;
      return { principal, ratePct, monthly: payment(principal, ratePct, 20) };
    };
    function renderBiz() {
      const scale = parseFloat($("bizScale").value) || 1;
      const hrsEach = Math.max(1, val("bizHours"));
      const margin = Math.max(0.1, Math.min(0.8, val("bizMargin") / 100));
      $("bizMarginOut").textContent = Math.round(margin * 100) + "%";
      const fam = famCount();
      const active = LINES.filter((l) => bizEl.querySelector(`[data-line="${l.id}"]`).checked);
      LINES.forEach((l) => {
        bizEl.querySelector(`[data-gross="${l.id}"]`).textContent = money(l.gross * scale);
        bizEl.querySelector(`[data-hrs="${l.id}"]`).textContent = `${Math.round(hoursAt(l, scale))} hrs/wk`;
      });
      const needHrs = active.reduce((a, l) => a + hoursAt(l, scale), 0);
      const togGross = active.reduce((a, l) => a + l.gross * scale, 0);
      const sorted = [...active].sort((a, b) => b.gross / b.hrs - a.gross / a.hrs);
      let aloneHrs = 0, aloneGross = 0, aloneLines = [];
      for (const l of sorted) {
        const h = hoursAt(l, scale);
        if (aloneHrs + h <= hrsEach) { aloneHrs += h; aloneGross += l.gross * scale; aloneLines.push(l.name.toLowerCase()); }
      }
      const haveHrs = hrsEach * fam;
      const bigOnes = active.filter((l) => hoursAt(l, scale) > hrsEach);
      const net = togGross * margin;
      const loan = loanPayment();
      const annualNote = loan.monthly * 12;
      const cover = annualNote > 0 ? net / annualNote : 0;
      const payoffYears = (() => {
        if (net <= 0) return Infinity;
        const r = loan.ratePct / 100, P = loan.principal, A = net;
        if (P <= 0) return 0;
        if (A <= P * r) return Infinity;
        return Math.log(A / (A - P * r)) / Math.log(1 + r);
      })();
      $("aloneGross").textContent = money(aloneGross);
      $("aloneNote").textContent = aloneLines.length ? `In ${hrsEach} hours a week one household can run ${aloneLines.join(" and ")}. Everything else on the list never happens.` : `Nothing on the list fits in ${hrsEach} hours a week for one household.`;
      $("togTag").textContent = `${fam} households together`;
      $("togGross").textContent = money(togGross);
      $("togNote").textContent = `${active.length} product lines, ${Math.round(needHrs)} hours a week spread across ${fam} households. About ${Math.round(needHrs / fam)} hours each.`;
      $("bizNeedHrs").textContent = num(Math.round(needHrs));
      $("bizHaveHrs").textContent = `${fam} households × ${hrsEach} hrs = ${haveHrs} hrs available. ` + (needHrs > haveHrs ? "Scale back or add hours." : bigOnes.length ? `It fits, but ${bigOnes.map((l) => l.name.toLowerCase()).join(" and ")} needs one household to make it their main job.` : "It fits.");
      $("bizNet").textContent = money(net);
      $("bizNetEach").textContent = `${money(net / fam)} per household at a ${Math.round(margin * 100)}% margin`;
      $("bizCover").textContent = (Math.round(cover * 10) / 10) + "×";
      $("bizCoverSub").textContent = `land + infrastructure note of about ${money(loan.monthly)}/mo (75% financed, 20 yrs at ${loan.ratePct}%)`;
      $("bizPayoff").textContent = isFinite(payoffYears) ? `${Math.round(payoffYears * 10) / 10} yrs` : "never";
      $("bizLine").textContent = needHrs > hrsEach ? `This plan needs ${Math.round(needHrs)} hours a week. One family has ${hrsEach}.` : `One family could do this. ${fam} could do it well.`;
      $("bizWhy").textContent = `Alone, a household picks the one or two lines it can fit around a job and makes ${money(aloneGross)} on the side. Together, the same ${hrsEach} hours from each of ${fam} households run the whole list and gross ${money(togGross)}, which after expenses is about ${money(net)} a year toward the land note first, then a reserve, then the ranch manager's draw. One household can't staff that list. ${fam} can.`;
    }
    bizEl.addEventListener("change", renderBiz);
    ["bizScale", "bizHours", "bizMargin", "mortgageRate"].forEach((id) => $(id).addEventListener("input", renderBiz));
    landIds.forEach((id) => $(id).addEventListener("input", renderBiz));
    renderBiz();
  }

  // ---------- 250 reasons ----------
  const R = Array.isArray(window.REASONS) ? window.REASONS : [];
  const cats = [...new Set(R.map((r) => r.cat))];
  let activeCat = "All", query = "", shown = 10;
  const chipsEl = $("reasonChips"), listEl = $("reasonsList"), countEl = $("reasonsCount"), moreBtn = $("showMore");
  chipsEl.innerHTML = ["All", ...cats].map((c) => `<button class="chip${c === "All" ? " active" : ""}" data-cat="${esc(c)}" aria-pressed="${c === "All"}">${esc(c)}</button>`).join("");
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    activeCat = b.dataset.cat; shown = 10;
    chipsEl.querySelectorAll(".chip").forEach((x) => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on); });
    renderReasons();
  });
  $("reasonSearch").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); shown = 10; renderReasons(); });
  moreBtn.addEventListener("click", () => { shown += 50; renderReasons(); });
  function hi(text) {
    if (!query) return esc(text);
    const re = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join("");
  }
  function filtered() {
    return R.filter((r) => (activeCat === "All" || r.cat === activeCat) && (!query || r.text.toLowerCase().includes(query) || r.cat.toLowerCase().includes(query)));
  }
  function renderReasons() {
    const list = filtered();
    countEl.textContent = list.length === R.length ? `All ${R.length} reasons` : `${list.length} of ${R.length} reasons`;
    listEl.innerHTML = list.slice(0, shown).map((r) => `<li><span class="num">${r.n}</span>${hi(r.text)}<span class="cat">${esc(r.cat)}</span></li>`).join("");
    const left = list.length - shown;
    moreBtn.style.display = left > 0 ? "" : "none";
    moreBtn.textContent = `Show ${Math.min(50, Math.max(0, left))} more (${Math.max(0, left)} remaining)`;
  }
  renderReasons();
  $("randomReason").addEventListener("click", () => {
    if (!R.length) return;
    const pool = filtered().length ? filtered() : R;
    const r = pool[Math.floor(Math.random() * pool.length)];
    const sp = $("spotlight");
    sp.hidden = false;
    sp.querySelector(".spot-num").textContent = "Reason #" + r.n;
    sp.querySelector(".spot-text").textContent = r.text;
    sp.querySelector(".spot-cat").textContent = r.cat;
    sp.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
  });

  // ---------- Households ----------
  const hhEl = $("households");
  if (hhEl && C.households && C.households.length) {
    hhEl.innerHTML = C.households.map((h, i) =>
      `<div class="hh"><span class="hh-num">${i + 1}</span><strong>${esc(h.name)}</strong>${h.note ? `<span class="hh-note">${esc(h.note)}</span>` : ""}</div>`
    ).join("") + (D.futureSites ? `<div class="hh hh-future"><span class="hh-num">+</span><strong>${D.futureSites} more sites</strong><span class="hh-note">reserved for later: kids who grow up here, new households</span></div>` : "");
  }

  // ---------- Answers ----------
  function buildLink(subject, body) {
    if (C.contactPhone) return `sms:${C.contactPhone}?&body=${encodeURIComponent(subject + " " + body)}`;
    return `mailto:${C.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  const url = C.siteUrl || location.href.split("#")[0];
  $("ansIn").href = buildLink(`${C.projectName}: I'm in`, `I read the whole thing. Count my family in. Let's set up the call.\n\nWhat I'm thinking:\n\n\n(${url})`);
  $("ansMaybe").href = buildLink(`${C.projectName}: I'm interested`, `I'm interested. Not committing yet, but keep me in the loop and tell me more about:\n\n\n(${url})`);
  $("ansQ").href = buildLink(`${C.projectName}: questions`, `Before I can answer, here's what I need to know:\n\n1. \n2. \n3. \n\n(${url})`);
  $("copyLink").addEventListener("click", async () => {
    const msg = $("copyMsg");
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(url);
      msg.textContent = "Copied.";
      setTimeout(() => { msg.textContent = ""; }, 3000);
    } catch (e) {
      msg.textContent = "Copy this: " + url;
    }
  });

  // ---------- Mobile answer bar ----------
  const bar = $("ctaBar"), inSec = $("in");
  if (bar && inSec && "IntersectionObserver" in window) {
    let nearAnswer = false;
    new IntersectionObserver((es) => { nearAnswer = es[0].isIntersecting; update(); }, { threshold: 0.1 }).observe(inSec);
    const update = () => { bar.classList.toggle("hidden", nearAnswer || window.scrollY < 600); };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  // ---------- Print ----------
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("details").forEach((d) => { d.open = true; });
    if (shown < R.length) { shown = R.length; renderReasons(); }
  });
})();
