/**
 * Central fare engine. This is the ONLY place fare math happens.
 *
 * Every page that shows a price — search results, the booking form's
 * live quote, the created booking record, the ticket/confirmation page,
 * Manage Booking, the WhatsApp payment message, and the admin
 * dashboard — all read a value that ultimately came from
 * calculateQuote() below. That's what keeps the total identical at
 * every step of the journey (spec requirement: price consistency).
 *
 * Rates live in config/site.config.js -> fares. Nothing here is
 * hard-coded.
 */
const config = require("../config/site.config");

const PASSENGER_TYPES = ["adult", "child", "infant"];

function fareForPassengerType(baseFare, type) {
  const f = config.fares;
  if (type === "child") return round2(baseFare * (1 - f.childDiscountPct / 100));
  if (type === "infant") return round2(baseFare * (1 - f.infantDiscountPct / 100));
  return round2(baseFare); // adult
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {object} flight - flight record with base_fare, destination, flight_number, origin
 * @param {Array<{type?: string}>} passengers - one entry per passenger; type defaults to "adult"
 * @param {object} extras - { extraBag?: boolean }
 * @param {object|null} deal - an active deal record whose destination_slug matches this flight's
 *                             destination, or null. Applied as a percentage off each passenger's
 *                             base fare (before taxes/fees).
 */
function calculateQuote({ flight, passengers, extras = {}, deal = null }) {
  const f = config.fares;
  const currency = config.payment.currency;

  const passengerLines = passengers.map((p) => {
    const type = PASSENGER_TYPES.includes(p.type) ? p.type : "adult";
    const rawFare = fareForPassengerType(flight.base_fare, type);
    const discount = deal ? round2(rawFare * (deal.discount_pct / 100)) : 0;
    const fareAfterDiscount = round2(rawFare - discount);
    return {
      type,
      base_fare: rawFare,
      discount,
      fare_after_discount: fareAfterDiscount,
      tax: f.taxPerPax,
      airport_charge: f.airportChargePerPax,
    };
  });

  const fareSubtotal = round2(passengerLines.reduce((s, p) => s + p.fare_after_discount, 0));
  const discountTotal = round2(passengerLines.reduce((s, p) => s + p.discount, 0));
  const taxesTotal = round2(passengerLines.reduce((s, p) => s + p.tax, 0));
  const airportChargesTotal = round2(passengerLines.reduce((s, p) => s + p.airport_charge, 0));
  const serviceFee = f.serviceFeePerBooking;
  const bookingFee = f.bookingFeePerBooking;
  const baggageTotal = extras.extraBag ? f.extraBaggageFee : 0;

  const grandTotal = round2(
    fareSubtotal + taxesTotal + airportChargesTotal + serviceFee + bookingFee + baggageTotal
  );

  return {
    currency,
    flight_number: flight.flight_number,
    origin: flight.origin,
    destination: flight.destination,
    passenger_count: passengers.length,
    passengers: passengerLines,
    deal_applied: deal ? { id: deal.id, title: deal.title, discount_pct: deal.discount_pct } : null,
    fare_subtotal: fareSubtotal,
    discount_total: discountTotal,
    taxes_total: taxesTotal,
    airport_charges_total: airportChargesTotal,
    service_fee: serviceFee,
    booking_fee: bookingFee,
    baggage_total: baggageTotal,
    grand_total: grandTotal,
  };
}

/** Finds an active deal matching a flight's destination, if any. */
function findApplicableDeal(state, flight) {
  const destSlug = state.destinations.find((d) => d.airport_code === flight.destination)?.slug;
  if (!destSlug) return null;
  return state.deals.find((d) => d.active && d.destination_slug === destSlug) || null;
}

module.exports = { calculateQuote, findApplicableDeal, PASSENGER_TYPES };
