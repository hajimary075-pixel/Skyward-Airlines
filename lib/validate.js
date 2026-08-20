const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PASSENGER_TYPES = ["adult", "child", "infant"];

function isNonEmptyString(v, max = 200) {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
}

function validatePassenger(p, index) {
  const errors = [];
  const prefix = `passenger[${index}]`;
  if (!isNonEmptyString(p.firstName)) errors.push(`${prefix}.firstName is required`);
  if (!isNonEmptyString(p.surname)) errors.push(`${prefix}.surname is required`);
  if (!isNonEmptyString(p.title, 10)) errors.push(`${prefix}.title is required`);
  if (p.type && !VALID_PASSENGER_TYPES.includes(p.type)) {
    errors.push(`${prefix}.type must be one of ${VALID_PASSENGER_TYPES.join(", ")}`);
  }
  return errors;
}

function validateContactDetails(c) {
  const errors = [];
  if (!isNonEmptyString(c.email) || !EMAIL_RE.test(c.email.trim())) {
    errors.push("contact.email must be a valid email address");
  }
  if (!isNonEmptyString(c.phone, 30)) errors.push("contact.phone is required");
  return errors;
}

function validateBookingPayload(body) {
  const errors = [];
  if (!isNonEmptyString(body.flightId)) errors.push("flightId is required");
  if (!isNonEmptyString(body.travelDate, 10)) errors.push("travelDate is required");
  if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
    errors.push("at least one passenger is required");
  } else {
    body.passengers.forEach((p, i) => errors.push(...validatePassenger(p, i)));
  }
  if (!body.contact) errors.push("contact details are required");
  else errors.push(...validateContactDetails(body.contact));
  return errors;
}

function validateContactForm(body) {
  const errors = [];
  if (!isNonEmptyString(body.name)) errors.push("name is required");
  if (!isNonEmptyString(body.email) || !EMAIL_RE.test(body.email.trim())) {
    errors.push("a valid email is required");
  }
  if (!isNonEmptyString(body.subject, 150)) errors.push("subject is required");
  if (!isNonEmptyString(body.message, 4000)) errors.push("message is required");
  return errors;
}

module.exports = { validateBookingPayload, validateContactForm, isNonEmptyString };
