(function () {
  const C = window.CONFIG;
  const D = C.defaults;
  const $ = (id) => document.getElementById(id);
  const money = (n) => (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
  const num = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
  const val = (id) => parseFloat($(id).value) || 0;

  // ---------- Config text ----------
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const k = el.getAttribute("data-cfg");
    if (C[k]) el.textContent = C[k];
  });
  document.title = C.projectName + ": Our Land in Wyoming";

  // ---------- Nav ----------
  const navToggle = $("navToggle"), navLinks = $("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")));

  // ---------- Apart vs together ----------
  function renderCompare() {
    const f = Math.max(2, Math.min(12, parseInt($("cmpFamilies").value) || 5));
    const rows = [
      ["Wells", `${f} wells, ${money(f * D.wellCost)}`, `${Math.max(1, Math.ceil(f / 3))} shared, ${money(Math.max(1, Math.ceil(f / 3)) * D.wellCost)}`],
      ["Access road and power run", `${f} separate driveways and line extensions`, "One road, one line, built once"],
      ["Tractor, skid steer, trailer, tools", `${f} of each, or borrowing from strangers`, "One set, shared, always nearby"],
      ["Childcare", `${f} daycare bills or ${f} scrambles`, "Cousins, grandparents, and aunts next door"],
      ["Aging parents", "Facility, or one family quits a job", `${f} households within a two-minute walk`],
      ["Beef and eggs", "Store prices, store quality", "Your own herd and coop; one family can't, " + f + " can"],
      ["Big jobs (fence, hay, barn)", "Hire it out or burn a month", `A Saturday with ${f * 2}+ adults and a grill`],
      ["Holidays", `${f} cars on the interstate`, "Walk across the pasture"],
      ["A hard year", "You handle it alone", "Nobody handles anything alone"]
    ];
    $("compareBody").innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
  }
  $("cmpFamilies").addEventListener("input", renderCompare);
  renderCompare();

  // ---------- Savings calculator ----------
  const payment = (P, ratePct, years = 30) => {
    const r = ratePct / 100 / 12, n = years * 12;
    if (r === 0) return P / n;
    return (P * r) / (1 - Math.pow(1 + r, -n));
  };
  function renderSavings() {
    const income = val("income"), utahHome = val("utahHome"), chyHome = val("cheyenneHome"), groc = val("groceries"), rate = val("mortgageRate");
    const incomeTax = income * C.utahIncomeTaxRate;
    const grocTax = groc * 12 * C.utahGroceryTaxRate;
    // Compare mortgage on 80% of each home's price at the same rate
    const mDiff = payment(utahHome * 0.8, rate) - payment(chyHome * 0.8, rate);
    const equity = utahHome - chyHome;
    const tenYear = (incomeTax + grocTax) * 10 + mDiff * 120;
    $("outIncomeTax").textContent = money(incomeTax);
    $("outGroceryTax").textContent = money(grocTax);
    $("outMortgage").textContent = money(mDiff);
    $("outEquity").textContent = money(equity);
    $("outTenYear").textContent = money(tenYear);
  }
  ["income", "utahHome", "cheyenneHome", "groceries", "mortgageRate"].forEach((id) => {
    $(id).value = D[id];
    $(id).addEventListener("input", renderSavings);
  });
  renderSavings();

  // ---------- Land calculator ----------
  const landIds = ["acres", "pricePerAcre", "families", "futureSites", "wells", "wellCost", "septicCost", "roadFeet", "roadCostPerFoot", "powerFeet", "powerCostPerFoot", "buildSqFt", "buildCostPerSqFt"];
  function renderLand() {
    const acres = val("acres"), ppa = val("pricePerAcre");
    const fam = Math.max(2, Math.min(12, Math.round(val("families")) || 2));
    const landTotal = acres * ppa;
    const infraTotal = val("wells") * val("wellCost") + val("roadFeet") * val("roadCostPerFoot") + val("powerFeet") * val("powerCostPerFoot");
    const homeEach = val("buildSqFt") * val("buildCostPerSqFt") + val("septicCost");
    const landEach = landTotal / fam, infraEach = infraTotal / fam;
    const allIn = landEach + infraEach + homeEach;
    $("outLandTotal").textContent = money(landTotal);
    $("outAcresEach").textContent = `${num(acres / fam, 1)} acres per family`;
    $("outLandEach").textContent = money(landEach);
    $("outInfraEach").textContent = money(infraEach);
    $("outInfraTotal").textContent = `${money(infraTotal)} total for wells, road, power`;
    $("outHomeEach").textContent = money(homeEach);
    $("outHomeSub").textContent = `${num(val("buildSqFt"))} sq ft at ${money(val("buildCostPerSqFt"))}/sq ft, plus septic`;
    $("outAllIn").textContent = money(allIn);
    const future = Math.max(0, Math.min(6, Math.round(val("futureSites"))));
    $("outAllInNote").textContent = `Land, your share of shared infrastructure, and a ${num(val("buildSqFt"))} sq ft home. Of that, only ${money(landEach + infraEach)} is the part we have to do together; the house is each family's own timeline and budget.${future ? ` The layout also reserves ${future} more home sites for later, so kids who grow up here and new households have a place without buying more ground.` : ""} For comparison, Salt Lake County's median single-family home alone is over $600,000.`;
    $("mapFamilies").textContent = fam + (future ? ` (plus ${future} future sites)` : "");
    $("mapAcres").textContent = num(acres);
    drawMap(fam, future);
    renderHomestead();
  }
  landIds.forEach((id) => { $(id).value = D[id]; $(id).addEventListener("input", renderLand); });

  // ---------- Compound map ----------
  function drawMap(fam, future) {
    const W = 640, H = 440;
    let s = "";
    // pasture
    s += `<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#cfd8b8"/>`;
    // subtle grass texture
    for (let i = 0; i < 60; i++) {
      const x = (i * 97) % W, y = 20 + ((i * 53) % 220);
      s += `<path d="M${x} ${y} l3 -7 l3 7" stroke="#aebb92" stroke-width="1.5" fill="none"/>`;
    }
    // perimeter fence
    s += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="10" fill="none" stroke="#5f5a3e" stroke-width="2" stroke-dasharray="6 5"/>`;
    s += `<text x="24" y="40" font-family="Oswald, sans-serif" font-size="15" fill="#3f3a28" letter-spacing="2">PASTURE</text>`;
    // county road along bottom
    s += `<rect x="0" y="${H - 30}" width="${W}" height="30" fill="#8a7f6a"/>`;
    s += `<line x1="0" y1="${H - 15}" x2="${W}" y2="${H - 15}" stroke="#f6efe3" stroke-width="2" stroke-dasharray="12 10"/>`;
    s += `<text x="${W / 2}" y="${H - 9}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="11" fill="#f6efe3" letter-spacing="2">COUNTY ROAD</text>`;
    // shared loop road
    const roadY = 320;
    s += `<rect x="60" y="${roadY - 9}" width="${W - 120}" height="18" rx="9" fill="#b8ad96"/>`;
    s += `<rect x="${W / 2 - 9}" y="${roadY}" width="18" height="${H - 30 - roadY}" fill="#b8ad96"/>`;
    // barn + corrals (center top)
    const bx = W / 2, by = 120;
    s += `<rect x="${bx - 90}" y="${by - 50}" width="180" height="110" rx="6" fill="none" stroke="#5f5a3e" stroke-width="2"/>`;
    s += `<line x1="${bx - 90}" y1="${by + 10}" x2="${bx + 90}" y2="${by + 10}" stroke="#5f5a3e" stroke-width="2"/>`;
    s += `<text x="${bx}" y="${by + 48}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="11" fill="#3f3a28" letter-spacing="2">CORRALS</text>`;
    s += `<path d="M${bx - 34} ${by + 2} v-30 l34 -22 l34 22 v30 z" fill="#b5411f" stroke="#8f3217" stroke-width="2"/>`;
    s += `<rect x="${bx - 8}" y="${by - 14}" width="16" height="16" fill="#1b1511"/>`;
    s += `<text x="${bx}" y="${by - 58}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="13" fill="#3f3a28" letter-spacing="2">BARN + HAY</text>`;
    // garden + coop (left, near houses)
    s += `<rect x="130" y="200" width="110" height="70" rx="4" fill="#9fb07e" stroke="#5d6b4d" stroke-width="2"/>`;
    for (let i = 1; i < 6; i++) s += `<line x1="${130 + i * 18}" y1="204" x2="${130 + i * 18}" y2="266" stroke="#7c8b6a" stroke-width="1.5"/>`;
    s += `<text x="185" y="288" text-anchor="middle" font-family="Oswald, sans-serif" font-size="11" fill="#3f3a28" letter-spacing="2">GARDEN</text>`;
    // future home sites along a spur road on the left
    if (future > 0) {
      const sx = 70, topY = roadY - 9 - future * 58;
      s += `<rect x="${sx - 9}" y="${topY}" width="18" height="${roadY - topY}" rx="9" fill="#b8ad96" opacity=".7"/>`;
      for (let j = 0; j < future; j++) {
        const y = roadY - 30 - j * 58;
        const hx = sx + 34;
        s += `<line x1="${sx}" y1="${y}" x2="${hx - 18}" y2="${y}" stroke="#b8ad96" stroke-width="5" opacity=".7"/>`;
        s += `<path d="M${hx - 14} ${y + 12} v-16 l14 -10 l14 10 v16 z" fill="none" stroke="#5f5a3e" stroke-width="2" stroke-dasharray="4 3"/>`;
        s += `<text x="${hx}" y="${y + 24}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="8" fill="#5f5a3e" letter-spacing="1">FUTURE</text>`;
      }
    }
    s += `<rect x="${W - 150}" y="210" width="60" height="40" rx="3" fill="#d9a441" stroke="#8f3217" stroke-width="2"/>`;
    s += `<rect x="${W - 150}" y="196" width="60" height="14" fill="#b5411f"/>`;
    s += `<rect x="${W - 86}" y="212" width="40" height="38" fill="none" stroke="#5f5a3e" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    s += `<text x="${W - 110}" y="268" text-anchor="middle" font-family="Oswald, sans-serif" font-size="11" fill="#3f3a28" letter-spacing="2">COOP</text>`;
    // wells
    s += `<circle cx="${bx + 130}" cy="${by - 20}" r="7" fill="#fff" stroke="#2d5c8a" stroke-width="2"/><text x="${bx + 130}" y="${by + 2}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="10" fill="#2d5c8a">WELL</text>`;
    // homes along the loop road
    const left = 70, right = W - 70, span = right - left;
    for (let i = 0; i < fam; i++) {
      const x = fam === 1 ? W / 2 : left + (span * i) / (fam - 1);
      const y = roadY + 48;
      // driveway
      s += `<line x1="${x}" y1="${roadY}" x2="${x}" y2="${y - 22}" stroke="#b8ad96" stroke-width="6"/>`;
      // yard
      s += `<circle cx="${x}" cy="${y - 4}" r="30" fill="#e6dcc3" opacity=".8"/>`;
      // house
      s += `<path d="M${x - 16} ${y + 10} v-18 l16 -12 l16 12 v18 z" fill="#f6efe3" stroke="#1b1511" stroke-width="2"/>`;
      s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="12" fill="#b5411f"/>`;
      const hh = (C.households || [])[i];
      const label = hh && fam <= (C.households || []).length ? hh.name.toUpperCase().replace(" & HIS FUTURE PERSON", " & ?") : `HOME ${i + 1}`;
      s += `<text x="${x}" y="${y + 26}" text-anchor="middle" font-family="Oswald, sans-serif" font-size="${fam > 5 ? 9 : 10}" fill="#3f3a28" letter-spacing=".5">${label}</text>`;
    }
    $("compoundMap").innerHTML = s;
  }

  // ---------- Homestead ----------
  const homeIds = ["pastureShare", "acresPerPair", "calfPrice", "hens", "people"];
  function renderHomestead() {
    const acres = val("acres");
    const pasture = acres * Math.min(0.95, Math.max(0.3, val("pastureShare")));
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
    $("outCalfValue").textContent = `about ${money(calfValue)} a year at the sale barn, before feed and hay`;
    $("outEggs").textContent = num(eggsWeek);
    $("outEggsSub").textContent = `${num(dozYear)} dozen a year from ${num(hens)} hens`;
    $("outSteers").textContent = num(steers);
    $("outSteersSub").textContent = `${num(people)} people at ~${lbPerPerson} lb of beef each, ~${lbPerSteer} lb per finished steer`;
    const keep = Math.min(steers, calves);
    $("outHomesteadLine").textContent = pairs > 0
      ? `${num(pairs)} pairs, ${num(calves)} calves a year, ${num(dozYear)} dozen eggs.`
      : "Chickens and a garden first; cattle when we add pasture.";
    $("outHomesteadNote").textContent = pairs > 0
      ? `Keep ${num(keep)} of the calves to finish for our own freezers and sell the other ${num(Math.max(0, calves - keep))}. That puts roughly ${money(Math.max(0, calves - keep) * val("calfPrice"))} a year back into the operation, covers hay and vet, and the family eats beef it raised. These are planning numbers; the UW Extension office in Cheyenne will tighten them for the actual parcel.`
      : `At ${num(app)} acres per pair this parcel doesn't carry cattle year-round yet. Lease neighboring pasture, buy hay, or improve the ground. Eggs and the garden start on day one regardless.`;
  }
  homeIds.forEach((id) => { $(id).value = D[id]; $(id).addEventListener("input", renderHomestead); });
  renderLand();

  // ---------- 250 reasons ----------
  const R = window.REASONS || [];
  const cats = [...new Set(R.map((r) => r.cat))];
  let activeCat = "All", query = "", shown = 30;
  const chipsEl = $("reasonChips"), listEl = $("reasonsList"), countEl = $("reasonsCount"), moreBtn = $("showMore");
  chipsEl.innerHTML = ["All", ...cats].map((c) => `<button class="chip${c === "All" ? " active" : ""}" data-cat="${c}">${c}</button>`).join("");
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    activeCat = b.dataset.cat; shown = 30;
    chipsEl.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === b));
    renderReasons();
  });
  $("reasonSearch").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); shown = 30; renderReasons(); });
  moreBtn.addEventListener("click", () => { shown += 50; renderReasons(); });
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function hi(text) {
    if (!query) return esc(text);
    const re = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return esc(text).replace(re, "<mark>$1</mark>");
  }
  function filtered() {
    return R.filter((r) => (activeCat === "All" || r.cat === activeCat) && (!query || r.text.toLowerCase().includes(query) || r.cat.toLowerCase().includes(query)));
  }
  function renderReasons() {
    const list = filtered();
    countEl.textContent = list.length === R.length ? `All ${R.length} reasons` : `${list.length} of ${R.length} reasons`;
    listEl.innerHTML = list.slice(0, shown).map((r) => `<li><span class="num">${r.n}</span>${hi(r.text)}<span class="cat">${r.cat}</span></li>`).join("");
    moreBtn.style.display = list.length > shown ? "" : "none";
    moreBtn.textContent = `Show more (${Math.min(50, list.length - shown)} of ${list.length - shown} remaining)`;
  }
  renderReasons();
  $("randomReason").addEventListener("click", () => {
    const pool = filtered().length ? filtered() : R;
    const r = pool[Math.floor(Math.random() * pool.length)];
    const sp = $("spotlight");
    sp.hidden = false;
    sp.querySelector(".spot-num").textContent = "Reason #" + r.n;
    sp.querySelector(".spot-text").textContent = r.text;
    sp.querySelector(".spot-cat").textContent = r.cat;
    sp.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (C.contactPhone) {
      return `sms:${C.contactPhone}?&body=${encodeURIComponent(subject + " " + body)}`;
    }
    return `mailto:${C.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  const url = location.href.split("#")[0];
  $("ansIn").href = buildLink(`${C.projectName}: I'm in`, `I read the whole thing. Count my family in. Let's set up the call.\n\nWhat I'm thinking:\n\n\n(${url})`);
  $("ansMaybe").href = buildLink(`${C.projectName}: I'm interested`, `I'm interested. Not committing yet, but keep me in the loop and tell me more about:\n\n\n(${url})`);
  $("ansQ").href = buildLink(`${C.projectName}: questions`, `Before I can answer, here's what I need to know:\n\n1. \n2. \n3. \n\n(${url})`);
  $("copyLink").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(url); $("copyMsg").textContent = "Copied."; }
    catch (e) { $("copyMsg").textContent = url; }
    setTimeout(() => { $("copyMsg").textContent = ""; }, 3000);
  });
})();
