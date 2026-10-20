// Edit this file to change names, contact info, and the default numbers in the calculators.
// Everything else on the page reads from here.
window.CONFIG = {
  projectName: "The Home Place",
  familyName: "the family",
  host: "Jacob",
  contactEmail: "bigdawgelitediesel@gmail.com",
  contactPhone: "",            // e.g. "3075551234" to make the answer buttons open a text message instead of an email
  cityLabel: "Cheyenne, Wyoming",
  siteUrl: "https://the-home-place.vercel.app",

  // The households being pitched. Order is the order of home sites on the concept map.
  households: [
    { name: "Jacob & Abby", short: "Jacob", note: "already in Cheyenne" },
    { name: "Logan & Madi", short: "Logan", note: "" },
    { name: "Troy & Leah", short: "Troy", note: "" },
    { name: "Bri & Tyler", short: "Bri", note: "" },
    { name: "Jer", short: "Jer", note: "plus whoever he brings" },
    { name: "Tara & Steve", short: "Tara", note: "with the grandparents" }
  ],

  // Calculator defaults (all editable on the page by the visitor)
  defaults: {
    // The numbers (Phase 1: a regular house in Cheyenne)
    income: 120000,            // household income today, $/yr
    cheyenneIncome: 120000,    // what you'd earn in Cheyenne (same number if remote)
    utahHome: 600000,          // what your Utah house would sell for
    utahOwed: 320000,          // what you still owe on it
    utahRate: 3.5,             // your current mortgage rate, %
    cheyenneHome: 400000,      // a regular house in town for Phase 1
    groceries: 1200,           // $/month
    mortgageRate: 6.5,         // rate on a new Cheyenne loan, %

    // The land (Phase 2)
    acres: 160,                // total parcel size
    pricePerAcre: 5000,        // raw land outside Cheyenne, rough 2026 range $3k to $8k
    families: 6,
    futureSites: 4,            // extra home sites reserved for later
    wells: 2,                  // shared wells
    wellCost: 35000,
    waterLinesPerHome: 12000,  // buried main, pressure tank, meter to each home
    fencingTotal: 40000,       // perimeter and cross fencing
    septicCost: 15000,         // per home
    roadFeet: 2500,            // gravel road, total
    roadCostPerFoot: 30,
    powerFeet: 2000,           // power line extension, total
    powerCostPerFoot: 25,
    buildSqFt: 2200,           // per home
    buildCostPerSqFt: 225,     // Cheyenne area custom build, rough 2026 range $200 to $275

    // The homestead
    pastureShare: 80,          // percent of the parcel kept in pasture
    acresPerPair: 35,          // dryland east of Cheyenne; improved ~20; irrigated ~10
    calfPrice: 2200,           // weaned calf, fall 2026 Torrington prices
    hens: 30,
    people: 22                 // total people across all households
  },

  // Utah income tax, 2026: 4.45% flat on taxable income, less the taxpayer tax credit
  utahIncomeTaxRate: 0.0445,
  utahCreditBase: 1890,
  utahCreditPhaseoutStart: 36426,
  utahCreditPhaseoutRate: 0.013,
  utahGroceryTaxRate: 0.03,
  sellingCostRate: 0.06        // realtor and closing costs on the Utah sale
};
