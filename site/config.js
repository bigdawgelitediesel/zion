// Edit this file to change names, contact info, and the default numbers in the calculators.
// Everything else on the page reads from here.
window.CONFIG = {
  projectName: "The Home Place",
  familyName: "the family",
  host: "Jacob",
  contactEmail: "bigdawgelitediesel@gmail.com",
  contactPhone: "",            // e.g. "3075551234" to enable the text-message button
  cityLabel: "Cheyenne, Wyoming",

  // The households being pitched. Order is the order of home sites on the concept map.
  households: [
    { name: "Jacob & Abby", note: "already in Cheyenne" },
    { name: "Logan & Madi", note: "" },
    { name: "Troy & Leah", note: "" },
    { name: "Bri & Tyler", note: "" },
    { name: "Jer & his future person", note: "" },
    { name: "Tara & Steve", note: "with the grandparents" }
  ],

  // Calculator defaults (all editable on the page by the visitor)
  defaults: {
    income: 120000,            // household income, $/yr
    utahHome: 600000,          // what your Utah house would sell for
    cheyenneHome: 420000,      // what you'd spend on a house or build here
    groceries: 1200,           // $/month
    mortgageRate: 6.5,         // %

    acres: 160,                // total parcel size
    pricePerAcre: 5000,        // raw land outside Cheyenne, rough 2026 range $3k to $8k
    families: 6,
    futureSites: 4,            // extra home sites reserved for later (kids, new households)
    wells: 2,                  // shared wells
    wellCost: 35000,
    septicCost: 15000,         // per home
    roadFeet: 2500,            // gravel road, total
    roadCostPerFoot: 30,
    powerFeet: 2000,           // power line extension, total
    powerCostPerFoot: 25,
    buildSqFt: 2200,           // per home
    buildCostPerSqFt: 225,     // Cheyenne area custom build, rough 2026 range $200 to $275

    pastureShare: 0.8,         // fraction of the parcel kept in pasture
    acresPerPair: 35,          // dry rangeland east of Cheyenne, rough carrying capacity
    calfPrice: 1800,           // weaned calf, 2026 market is strong
    hens: 30,
    people: 22                 // total people across all families
  },

  // Utah's flat income tax rate used in the savings math (Wyoming is 0)
  utahIncomeTaxRate: 0.045,
  utahGroceryTaxRate: 0.03
};
