/**
 * FlightDataProvider abstraction (spec section 42).
 *
 * The rest of the app (routes/*.js) only ever calls the methods on
 * `provider` below. It never touches db.js or a live GDS SDK directly.
 * That means going live is: implement LiveFlightDataProvider fully,
 * flip config.flags.liveAviationDataConnected, and nothing else in the
 * codebase changes.
 */
const db = require("./db");
const config = require("../config/site.config");

class DemoFlightDataProvider {
  isLive() {
    return false;
  }

  searchFlights({ origin, destination, date }) {
    const state = db.read();
    const dow = date ? new Date(date + "T00:00:00").getDay() : null;
    return state.flights
      .filter((f) => (!origin || f.origin === origin))
      .filter((f) => (!destination || f.destination === destination))
      .filter((f) => (dow === null || f.operating_days.includes(dow)))
      .map((f) => this._decorate(state, f));
  }

  getFlight(flightId) {
    const state = db.read();
    const f = state.flights.find((x) => x.id === flightId);
    return f ? this._decorate(state, f) : null;
  }

  _decorate(state, f) {
    const inv = state.inventory[f.id] || { capacity: f.capacity, held: 0, booked: 0 };
    const aircraft = state.aircraft.find((a) => a.id === f.aircraft_id);
    return {
      ...f,
      aircraft_name: aircraft ? aircraft.name : "TBD",
      seats_available: Math.max(0, inv.capacity - inv.held - inv.booked),
      seats_booked: inv.booked,
      seats_held: inv.held,
    };
  }

  // Operational status is simulated deterministically from schedule +
  // current time, purely so the Flight Status page has something
  // meaningful to show. This is explicitly NOT live aviation data.
  getStatus(flightId, dateStr) {
    const flight = this.getFlight(flightId);
    if (!flight) return null;
    const now = new Date();
    const [dh, dm] = flight.departure_time.split(":").map(Number);
    const dep = new Date(dateStr || now.toISOString().slice(0, 10));
    dep.setHours(dh, dm, 0, 0);
    const minsToDep = (dep.getTime() - now.getTime()) / 60000;

    let status = "SCHEDULED";
    if (minsToDep <= -180) status = "COMPLETED";
    else if (minsToDep <= -30) status = "LANDED";
    else if (minsToDep <= 0) status = "IN AIR";
    else if (minsToDep <= 20) status = "DEPARTED";
    else if (minsToDep <= 45) status = "BOARDING";
    else if (minsToDep <= 24 * 60) status = "CHECK-IN OPEN";

    return {
      flight_number: flight.flight_number,
      origin: flight.origin,
      destination: flight.destination,
      aircraft_name: flight.aircraft_name,
      scheduled_departure: flight.departure_time,
      estimated_departure: flight.departure_time,
      scheduled_arrival: flight.arrival_time,
      estimated_arrival: flight.arrival_time,
      status,
      is_simulated: true,
    };
  }
}

class LiveFlightDataProvider {
  constructor() {
    throw new Error(
      "LiveFlightDataProvider is not implemented. Connect a real GDS / " +
        "airline inventory API and flight-status feed here, then set " +
        "config.flags.liveAviationDataConnected = true."
    );
  }
}

const provider = config.flags.liveAviationDataConnected
  ? new LiveFlightDataProvider()
  : new DemoFlightDataProvider();

module.exports = { provider, DemoFlightDataProvider, LiveFlightDataProvider };
