const db = require("./lib/db");
const { provider } = require("./lib/flightDataProvider");
const config = require("./config/site.config");
const { sendJson, parseBody, parseUrl } = require("./lib/http-helpers");
const { validateBookingPayload, validateContactForm } = require("./lib/validate");
const { calculateQuote, findApplicableDeal } = require("./lib/pricing");

const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUND_REQUESTED", "REFUNDED"];

const HOLD_MINUTES = 10;

function requireAdmin(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return token && token === config.admin.demoToken;
}

async function handleApi(req, res) {
  const url = parseUrl(req);
  const parts = url.pathname.split("/").filter(Boolean); // ['api', ...]
  const seg = parts.slice(1); // drop 'api'
  const method = req.method;

  try {
    // ---- PUBLIC CONFIG (safe subset only — never leak secret keys) ----
    if (method === "GET" && seg[0] === "config") {
      return sendJson(res, 200, {
        company: config.company,
        branding: config.branding,
        contact: config.contact,
        social: config.social,
        payment: { provider: config.payment.provider, currency: config.payment.currency },
        analytics: config.analytics,
        flags: config.flags,
      });
    }

    // ---- FLIGHT SEARCH ----
    if (method === "GET" && seg[0] === "flights" && seg[1] === "search") {
      const origin = url.searchParams.get("origin") || undefined;
      const destination = url.searchParams.get("destination") || undefined;
      const date = url.searchParams.get("date") || undefined;
      let results = provider.searchFlights({ origin, destination, date });

      const sort = url.searchParams.get("sort");
      if (sort === "price") results.sort((a, b) => a.base_fare - b.base_fare);
      if (sort === "departure") results.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
      if (sort === "duration") results.sort((a, b) => durationMinutes(a) - durationMinutes(b));

      const maxPrice = url.searchParams.get("maxPrice");
      if (maxPrice) results = results.filter((f) => f.base_fare <= Number(maxPrice));

      return sendJson(res, 200, { count: results.length, results });
    }

    if (method === "GET" && seg[0] === "flights" && seg[1]) {
      const flight = provider.getFlight(seg[1]);
      if (!flight) return sendJson(res, 404, { error: "Flight not found" });
      return sendJson(res, 200, flight);
    }

    // ---- FLIGHT STATUS ----
    if (method === "GET" && seg[0] === "flight-status") {
      const flightNumber = url.searchParams.get("flightNumber");
      const date = url.searchParams.get("date");
      const state = db.read();
      let flights = state.flights;
      if (flightNumber) flights = flights.filter((f) => f.flight_number === flightNumber.toUpperCase());
      const origin = url.searchParams.get("origin");
      const destination = url.searchParams.get("destination");
      if (origin) flights = flights.filter((f) => f.origin === origin);
      if (destination) flights = flights.filter((f) => f.destination === destination);
      const statuses = flights.map((f) => provider.getStatus(f.id, date));
      return sendJson(res, 200, { results: statuses });
    }

    // ---- LIVE FARE QUOTE ----
    // Same calculateQuote() function used at booking-creation time, so a
    // quote shown on the booking form is guaranteed to match the total
    // actually charged when the booking is submitted.
    if (method === "POST" && seg[0] === "quote") {
      const body = await parseBody(req);
      if (!body.flightId || !Array.isArray(body.passengers) || !body.passengers.length) {
        return sendJson(res, 400, { error: "flightId and at least one passenger are required" });
      }
      const state = db.read();
      const flight = state.flights.find((f) => f.id === body.flightId);
      if (!flight) return sendJson(res, 404, { error: "Flight not found" });
      const deal = findApplicableDeal(state, flight);
      const quote = calculateQuote({ flight, passengers: body.passengers, extras: body.extras || {}, deal });
      return sendJson(res, 200, quote);
    }

    // ---- BOOKING: CREATE (holds seats, then "confirms" — see payment stub) ----
    if (method === "POST" && seg[0] === "bookings" && seg.length === 1) {
      const body = await parseBody(req);
      const errors = validateBookingPayload(body);
      if (errors.length) return sendJson(res, 400, { errors });

      const result = await db.locked(() => {
        const state = db.read();
        const flight = state.flights.find((f) => f.id === body.flightId);
        if (!flight) return { error: 404, body: { error: "Flight not found" } };

        const inv = state.inventory[flight.id];
        const seatsNeeded = body.passengers.length;
        const available = inv.capacity - inv.held - inv.booked;
        if (seatsNeeded > available) {
          return { error: 409, body: { error: "Not enough seats available", available } };
        }

        // Reserve immediately as "booked" for this demo (no separate
        // payment-provider redirect loop exists yet locally) but keep
        // payment_status = PENDING until WhatsApp payment is confirmed
        // by an administrator.
        inv.booked += seatsNeeded;

        const deal = findApplicableDeal(state, flight);
        const fareBreakdown = calculateQuote({
          flight,
          passengers: body.passengers,
          extras: body.extras || {},
          deal,
        });

        const reference = db.genBookingReference();
        const booking = {
          id: state.next_ids.booking++,
          reference,
          flight_id: flight.id,
          flight_number: flight.flight_number,
          travel_date: body.travelDate || null,
          passengers: body.passengers,
          contact: body.contact,
          extras: body.extras || {},
          fare_breakdown: fareBreakdown,
          fare_total: fareBreakdown.grand_total, // kept for simple sums (e.g. admin revenue)
          currency: config.payment.currency,
          payment_status: "PENDING",
          booking_status: "CONFIRMED",
          created_at: new Date().toISOString(),
        };
        state.bookings.push(booking);
        db.audit(state, "BOOKING_CREATED", { reference, flight: flight.flight_number, seats: seatsNeeded, total: fareBreakdown.grand_total });
        db.write(state);
        return { error: null, body: booking };
      });

      if (result.error) return sendJson(res, result.error, result.body);
      return sendJson(res, 201, result.body);
    }

    // ---- BOOKING: PAYMENT WEBHOOK STUB (future card/mobile-money gateway) ----
    // Not used by the current WhatsApp payment flow — kept ready for
    // whenever a real payment gateway is layered in. A real provider
    // would call this after confirming a charge server-side. We
    // deliberately do NOT flip a booking to PAID just because the
    // customer reached checkout or opened WhatsApp.
    if (method === "POST" && seg[0] === "payments" && seg[1] === "webhook") {
      if (config.payment.provider === "WHATSAPP" || config.payment.provider === "NOT_CONFIGURED") {
        return sendJson(res, 501, {
          error: "No payment gateway configured — this deployment completes payment via WhatsApp, confirmed manually by an administrator in the dashboard. Set PAYMENT_PROVIDER and verify webhook signatures before enabling this endpoint.",
        });
      }
      // Real implementation: verify signature header against
      // config.payment.secretKey before trusting the body.
      const body = await parseBody(req);
      const result = await db.locked(() => {
        const state = db.read();
        const booking = state.bookings.find((b) => b.reference === body.reference);
        if (!booking) return { error: 404, body: { error: "Booking not found" } };
        booking.payment_status = body.status === "succeeded" ? "PAID" : "FAILED";
        db.audit(state, "PAYMENT_WEBHOOK", { reference: booking.reference, status: booking.payment_status });
        db.write(state);
        return { error: null, body: booking };
      });
      return sendJson(res, result.error || 200, result.body);
    }

    // ---- MANAGE BOOKING: LOOKUP ----
    if (method === "GET" && seg[0] === "bookings" && seg[1]) {
      const surname = (url.searchParams.get("surname") || "").trim().toLowerCase();
      if (!surname) return sendJson(res, 400, { error: "surname is required to verify identity" });
      const state = db.read();
      const booking = state.bookings.find(
        (b) => b.reference === seg[1].toUpperCase() &&
          b.passengers.some((p) => (p.surname || "").trim().toLowerCase() === surname)
      );
      if (!booking) return sendJson(res, 404, { error: "No matching booking found" });
      const flight = provider.getFlight(booking.flight_id);
      return sendJson(res, 200, { booking, flight });
    }

    // ---- MANAGE BOOKING: CANCEL ----
    if (method === "POST" && seg[0] === "bookings" && seg[1] && seg[2] === "cancel") {
      const body = await parseBody(req);
      const surname = (body.surname || "").trim().toLowerCase();
      const result = await db.locked(() => {
        const state = db.read();
        const booking = state.bookings.find(
          (b) => b.reference === seg[1].toUpperCase() &&
            b.passengers.some((p) => (p.surname || "").trim().toLowerCase() === surname)
        );
        if (!booking) return { error: 404, body: { error: "No matching booking found" } };
        if (booking.booking_status === "CANCELLED") {
          return { error: 409, body: { error: "Booking already cancelled" } };
        }
        booking.booking_status = "CANCELLED";
        const inv = state.inventory[booking.flight_id];
        inv.booked = Math.max(0, inv.booked - booking.passengers.length);
        if (booking.payment_status === "PAID") booking.payment_status = "REFUND_REQUESTED";
        db.audit(state, "BOOKING_CANCELLED", { reference: booking.reference });
        db.write(state);
        return { error: null, body: booking };
      });
      return sendJson(res, result.error || 200, result.body);
    }

    // ---- CONTENT: destinations / deals / faqs / fleet / airports ----
    if (method === "GET" && seg[0] === "destinations") {
      const state = db.read();
      if (seg[1]) {
        const d = state.destinations.find((x) => x.slug === seg[1]);
        if (!d) return sendJson(res, 404, { error: "Destination not found" });
        const flights = state.flights.filter((f) => f.destination === d.airport_code);
        return sendJson(res, 200, { destination: d, flights });
      }
      return sendJson(res, 200, { results: state.destinations });
    }
    if (method === "GET" && seg[0] === "deals") {
      const state = db.read();
      return sendJson(res, 200, { results: state.deals.filter((d) => d.active) });
    }
    if (method === "GET" && seg[0] === "faqs") {
      const state = db.read();
      return sendJson(res, 200, { results: state.faqs });
    }
    if (method === "GET" && seg[0] === "fleet") {
      const state = db.read();
      return sendJson(res, 200, { results: state.aircraft });
    }
    if (method === "GET" && seg[0] === "airports") {
      const state = db.read();
      return sendJson(res, 200, { results: state.airports });
    }

    // ---- CONTACT FORM ----
    if (method === "POST" && seg[0] === "contact") {
      const body = await parseBody(req);
      const errors = validateContactForm(body);
      if (errors.length) return sendJson(res, 400, { errors });
      const state = db.read();
      const enquiry = {
        id: state.next_ids.enquiry++,
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone ? body.phone.trim() : "",
        subject: body.subject.trim(),
        message: body.message.trim(),
        status: "NEW",
        created_at: new Date().toISOString(),
      };
      state.enquiries.unshift(enquiry);
      db.audit(state, "ENQUIRY_RECEIVED", { id: enquiry.id, subject: enquiry.subject });
      db.write(state);
      // Email dispatch would happen here via config.email provider.
      return sendJson(res, 201, { ok: true, enquiry });
    }

    // ================= ADMIN (demo bearer-token auth) =================
    if (seg[0] === "admin") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });
      const state = db.read();

      if (method === "GET" && seg[1] === "overview") {
        const today = new Date().toISOString().slice(0, 10);
        const totalBooked = Object.values(state.inventory).reduce((s, i) => s + i.booked, 0);
        const totalCapacity = Object.values(state.inventory).reduce((s, i) => s + i.capacity, 0);
        return sendJson(res, 200, {
          total_bookings: state.bookings.length,
          bookings_today: state.bookings.filter((b) => b.created_at.startsWith(today)).length,
          revenue: state.bookings.filter((b) => b.payment_status === "PAID").reduce((s, b) => s + b.fare_total, 0),
          pending_payments: state.bookings.filter((b) => b.payment_status === "PENDING").length,
          seats_booked: totalBooked,
          seats_remaining: totalCapacity - totalBooked,
          open_enquiries: state.enquiries.filter((e) => e.status === "NEW").length,
          cancellations: state.bookings.filter((b) => b.booking_status === "CANCELLED").length,
        });
      }

      if (method === "GET" && seg[1] === "bookings") return sendJson(res, 200, { results: state.bookings });
      if (method === "GET" && seg[1] === "enquiries") return sendJson(res, 200, { results: state.enquiries });
      if (method === "GET" && seg[1] === "audit-log") return sendJson(res, 200, { results: state.audit_log });

      if (method === "GET" && seg[1] === "inventory") {
        const rows = state.flights.map((f) => {
          const inv = state.inventory[f.id];
          return {
            flight_number: f.flight_number,
            route: `${f.origin} -> ${f.destination}`,
            capacity: inv.capacity,
            booked: inv.booked,
            held: inv.held,
            available: inv.capacity - inv.booked - inv.held,
          };
        });
        return sendJson(res, 200, { results: rows });
      }

      if (method === "GET" && seg[1] === "flights") return sendJson(res, 200, { results: state.flights });

      if (method === "PUT" && seg[1] === "flights" && seg[2]) {
        const body = await parseBody(req);
        const flight = state.flights.find((f) => f.id === seg[2]);
        if (!flight) return sendJson(res, 404, { error: "Flight not found" });
        const editable = ["departure_time", "arrival_time", "base_fare", "operating_days", "capacity", "aircraft_id"];
        for (const key of editable) if (key in body) flight[key] = body[key];
        if ("capacity" in body) state.inventory[flight.id].capacity = body.capacity;
        db.audit(state, "FLIGHT_UPDATED", { flight_id: flight.id, changes: body });
        db.write(state);
        return sendJson(res, 200, flight);
      }

      if (method === "POST" && seg[1] === "enquiries" && seg[2] && seg[3] === "status") {
        const body = await parseBody(req);
        const enq = state.enquiries.find((e) => e.id === Number(seg[2]));
        if (!enq) return sendJson(res, 404, { error: "Enquiry not found" });
        enq.status = body.status;
        db.write(state);
        return sendJson(res, 200, enq);
      }

      // Admin manually confirms WhatsApp payment (or marks failed/refunded).
      // This is the only path that can move a booking to PAID — the
      // WhatsApp button on the customer side never does this itself.
      if (method === "POST" && seg[1] === "bookings" && seg[2] && seg[3] === "payment-status") {
        const body = await parseBody(req);
        if (!VALID_PAYMENT_STATUSES.includes(body.status)) {
          return sendJson(res, 400, { error: "Invalid payment status", valid: VALID_PAYMENT_STATUSES });
        }
        const booking = state.bookings.find((b) => b.reference === seg[2].toUpperCase());
        if (!booking) return sendJson(res, 404, { error: "Booking not found" });
        const previous = booking.payment_status;
        booking.payment_status = body.status;
        db.audit(state, "PAYMENT_STATUS_UPDATED", { reference: booking.reference, from: previous, to: body.status });
        db.write(state);
        return sendJson(res, 200, booking);
      }

      if (method === "GET" && seg[1] === "destinations") return sendJson(res, 200, { results: state.destinations });
      if (method === "GET" && seg[1] === "deals") return sendJson(res, 200, { results: state.deals });

      return sendJson(res, 404, { error: "Unknown admin endpoint" });
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

function durationMinutes(f) {
  const [dh, dm] = f.departure_time.split(":").map(Number);
  const [ah, am] = f.arrival_time.replace("+1", "").split(":").map(Number);
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (f.arrival_time.includes("+1")) mins += 24 * 60;
  if (mins < 0) mins += 24 * 60;
  return mins;
}

module.exports = { handleApi };
