/**
 * Lightweight persistence layer.
 *
 * WHY JSON FILES: this project ships with zero external dependencies so it
 * runs anywhere `node` runs, with no install step. All reads/writes go
 * through this module only — nothing else in the app touches the
 * filesystem directly. That means swapping this for Postgres/MySQL later
 * is a matter of reimplementing the exported functions below with real
 * SQL, not a rewrite of the application. Table shape mirrors the entity
 * list in the spec (flights, inventory, bookings, passengers, etc).
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
const RUNTIME_PATH = path.join(DATA_DIR, "runtime.json");

function loadSeed() {
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
}

function defaultRuntime() {
  const seed = loadSeed();
  const inventory = {};
  for (const f of seed.flights) {
    // inventory tracked per flight (date-agnostic for this demo network —
    // a real deployment would key this per flight_id + date)
    inventory[f.id] = {
      flight_id: f.id,
      capacity: f.capacity,
      held: 0,
      booked: 0,
    };
  }
  return {
    flights: seed.flights,
    airports: seed.airports,
    aircraft: seed.aircraft,
    destinations: seed.destinations,
    deals: seed.deals,
    faqs: seed.faqs,
    inventory,
    bookings: [],
    enquiries: [],
    audit_log: [],
    next_ids: { booking: 1, enquiry: 1, audit: 1 },
  };
}

function ensureRuntime() {
  if (!fs.existsSync(RUNTIME_PATH)) {
    fs.writeFileSync(RUNTIME_PATH, JSON.stringify(defaultRuntime(), null, 2));
  }
}

function read() {
  ensureRuntime();
  return JSON.parse(fs.readFileSync(RUNTIME_PATH, "utf8"));
}

function write(state) {
  fs.writeFileSync(RUNTIME_PATH, JSON.stringify(state, null, 2));
}

// --- simple in-process write lock -----------------------------------
// Node is single-threaded per process, but async handlers can interleave
// between an `await` and the next line. This queue serializes any
// operation that reads-then-writes state, which is what actually
// prevents double-booking the same seat under concurrent requests.
let queue = Promise.resolve();
function locked(fn) {
  const result = queue.then(() => fn());
  // swallow errors from this link so the queue keeps flowing for
  // subsequent callers even if one operation throws
  queue = result.catch(() => {});
  return result;
}

function audit(state, action, details) {
  state.audit_log.unshift({
    id: state.next_ids.audit++,
    action,
    details,
    at: new Date().toISOString(),
  });
  state.audit_log = state.audit_log.slice(0, 500);
}

function genBookingReference() {
  // Non-sequential reference: 6 chars, letters+digits, ambiguous
  // characters (0/O, 1/I) excluded.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

module.exports = {
  read,
  write,
  locked,
  audit,
  genBookingReference,
  RUNTIME_PATH,
};
