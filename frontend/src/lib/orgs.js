// Official web addresses of organisations that scammers imitate most often in India.
// Every entry was checked by loading the organisation's own website on CHECKED_ON, except where `check` says "known".
// Banks: the RBI told banks to move to the exclusive ".bank.in" domain by 31 Oct 2025 (circular of 22 Apr 2025).
// On CHECKED_ON, 15 of the 16 old bank addresses below redirected to the new ones; SBI's old address (sbi.co.in) still opened normally, while its old net banking address (onlinesbi.sbi) redirected.
// This list is NOT complete. An address missing from it is "unknown", never "safe" or "fake".

export const CHECKED_ON = "2026-10-15";

// Banks: [id, name, brand words, new domain, old domains that redirect]
const BANKS = [
  ["hdfc", "HDFC Bank", ["hdfc"], "hdfc.bank.in", ["hdfcbank.com"]],
  ["icici", "ICICI Bank", ["icici"], "icici.bank.in", ["icicibank.com"]],
  ["sbi", "State Bank of India", ["sbi", "sbibank", "onlinesbi", "yono"], "sbi.bank.in", ["sbi.co.in", "onlinesbi.sbi"]],
  ["axis", "Axis Bank", ["axisbank", "axis"], "axis.bank.in", ["axisbank.com"]],
  ["pnb", "Punjab National Bank", ["pnb", "pnbindia"], "pnb.bank.in", ["pnbindia.in"]],
  ["bob", "Bank of Baroda", ["bankofbaroda", "bobcard", "bob"], "bankofbaroda.bank.in", ["bankofbaroda.in"]],
  ["kotak", "Kotak Mahindra Bank", ["kotak"], "kotak.bank.in", ["kotak.com"]],
  ["canara", "Canara Bank", ["canarabank", "canara"], "canarabank.bank.in", ["canarabank.com"]],
  ["union", "Union Bank of India", ["unionbankofindia", "unionbank"], "unionbankofindia.bank.in", ["unionbankofindia.co.in"]],
  ["yes", "Yes Bank", ["yesbank"], "yes.bank.in", ["yesbank.in"]],
  ["indusind", "IndusInd Bank", ["indusind"], "indusind.bank.in", ["indusind.com"]],
  ["idfc", "IDFC FIRST Bank", ["idfcfirst", "idfcbank", "idfc"], "idfcfirst.bank.in", ["idfcfirstbank.com"]],
  ["bandhan", "Bandhan Bank", ["bandhan"], "bandhan.bank.in", ["bandhanbank.com"]],
  ["rbl", "RBL Bank", ["rblbank"], "rbl.bank.in", ["rblbank.com"]],
  ["federal", "Federal Bank", ["federalbank"], "federal.bank.in", ["federalbank.co.in"]],
  ["indianbank", "Indian Bank", ["indianbank"], "indianbank.bank.in", ["indianbank.in"]],
].map(([id, name, words, official, legacy]) => ({ id, type: "bank", name, words, official: [official], legacy, check: "fetched" }));

const others = (type, rows) => rows.map(([id, name, words, official, check = "fetched"]) => ({ id, type, name, words, official, legacy: [], check }));

export const ORGS = [
  ...BANKS,
  ...others("gov", [
    ["incometax", "Income Tax Department", ["incometax", "incometaxindia", "itr"], ["incometax.gov.in"]],
    ["uidai", "UIDAI (Aadhaar)", ["uidai", "aadhaar", "aadhar"], ["uidai.gov.in"]],
    ["epfo", "EPFO (Provident Fund)", ["epfindia", "epfo"], ["epfindia.gov.in"]],
    ["rbi", "Reserve Bank of India", ["rbi", "reservebank"], ["rbi.org.in"]],
    ["sebi", "SEBI", ["sebi"], ["sebi.gov.in"]],
    ["trai", "TRAI", ["trai"], ["trai.gov.in"]],
    ["sanchar", "Sanchar Saathi (DoT)", ["sancharsaathi", "chakshu"], ["sancharsaathi.gov.in"]],
    ["cybercrime", "National Cyber Crime Reporting Portal", ["cybercrime"], ["cybercrime.gov.in"]],
    ["indiapost", "India Post", ["indiapost"], ["indiapost.gov.in"]],
    ["npci", "NPCI (UPI, BHIM)", ["npci", "bhim"], ["npci.org.in"]],
    ["irctc", "IRCTC", ["irctc"], ["irctc.co.in"], "known"],
    ["parivahan", "Parivahan (e-challan, driving licence)", ["parivahan", "echallan"], ["parivahan.gov.in"], "known"],
  ]),
  ...others("payment", [
    ["paytm", "Paytm", ["paytm"], ["paytm.com"]],
    ["phonepe", "PhonePe", ["phonepe"], ["phonepe.com"]],
  ]),
  ...others("shop", [
    ["amazon", "Amazon India", ["amazon"], ["amazon.in", "amazon.com"]],
    ["flipkart", "Flipkart", ["flipkart"], ["flipkart.com"]],
  ]),
  ...others("courier", [
    ["delhivery", "Delhivery", ["delhivery"], ["delhivery.com"]],
    ["bluedart", "Blue Dart", ["bluedart"], ["bluedart.com"]],
    ["dtdc", "DTDC", ["dtdc"], ["dtdc.com", "dtdc.in"]],
  ]),
  ...others("telecom", [
    ["airtel", "Airtel", ["airtel"], ["airtel.in"]],
    ["jio", "Jio", ["jio"], ["jio.com"]],
    ["bsnl", "BSNL", ["bsnl"], ["bsnl.co.in"], "known"],
  ]),
];

export const TYPE_LABEL = { bank: "Bank", gov: "Government", payment: "Payments", shop: "Shopping", courier: "Courier", telecom: "Telecom" };
