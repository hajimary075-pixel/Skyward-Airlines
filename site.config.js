/**
 * CENTRAL SITE CONFIGURATION
 * Change branding, contact info, and integration placeholders here.
 * Nothing else in the codebase should hard-code these values.
 * In production, prefer environment variables (see .env.example) —
 * this file falls back to sane defaults for local/demo use.
 */
const env = process.env;

module.exports = {
  company: {
    name: env.COMPANY_NAME || "Skyward Airlines",
    legalName: env.COMPANY_LEGAL_NAME || "Skyward Airlines Ltd.",
    tagline: env.COMPANY_TAGLINE || "Africa, Elevated.",
    logoUrl: env.LOGO_URL || "/img/logo.png",
    faviconUrl: env.FAVICON_URL || "/img/favicon.png",
  },
  branding: {
    primaryColor: env.PRIMARY_COLOR || "#0B3D2E",
    secondaryColor: env.SECONDARY_COLOR || "#D9A441",
    accentColor: env.ACCENT_COLOR || "#F4F1EA",
    fontFamily: env.FONT_FAMILY || "'Inter', system-ui, sans-serif",
  },
  contact: {
    phone: env.COMPANY_PHONE || "+254 700 000 000",
    email: env.COMPANY_EMAIL || "support@skywardairlines.example",
    whatsapp: env.WHATSAPP_NUMBER || "254700000000",
    address: env.COMPANY_ADDRESS || "Jomo Kenyatta International Airport, Nairobi, Kenya",
    hours: env.SUPPORT_HOURS || "Mon-Sun, 06:00-22:00 EAT",
  },
  social: {
    facebook: env.SOCIAL_FACEBOOK || "",
    instagram: env.SOCIAL_INSTAGRAM || "",
    tiktok: env.SOCIAL_TIKTOK || "",
    x: env.SOCIAL_X || "",
    linkedin: env.SOCIAL_LINKEDIN || "",
    youtube: env.SOCIAL_YOUTUBE || "",
  },
  payment: {
    // Final payment is completed via WhatsApp for this deployment (see
    // lib/pricing.js + confirmation/manage-booking pages). A card/mobile
    // money gateway can still be layered in later without touching the
    // booking model — provider/keys are kept here for that future step.
    provider: env.PAYMENT_PROVIDER || "WHATSAPP",
    publicKey: env.PAYMENT_PUBLIC_KEY || "",
    secretKey: env.PAYMENT_SECRET_KEY || "",
    currency: env.PAYMENT_CURRENCY || "KES",
    successUrl: env.PAYMENT_SUCCESS_URL || "/booking/confirmation",
    failureUrl: env.PAYMENT_FAILURE_URL || "/booking/failed",
  },
  // Central fare/tax/fee configuration — every monetary figure charged
  // to a passenger flows through lib/pricing.js, which reads only from
  // here and from each flight's base_fare. Change rates in one place.
  fares: {
    childDiscountPct: Number(env.FARE_CHILD_DISCOUNT_PCT || 25),   // child pays base_fare - 25%
    infantDiscountPct: Number(env.FARE_INFANT_DISCOUNT_PCT || 90), // lap infant pays base_fare - 90%
    taxPerPax: Number(env.FARE_TAX_PER_PAX || 500),                // government/passenger tax, per passenger
    airportChargePerPax: Number(env.FARE_AIRPORT_CHARGE_PER_PAX || 300), // airport charge, per passenger
    serviceFeePerBooking: Number(env.FARE_SERVICE_FEE || 150),     // flat, per booking
    bookingFeePerBooking: Number(env.FARE_BOOKING_FEE || 100),     // flat, per booking
    extraBaggageFee: Number(env.FARE_EXTRA_BAGGAGE_FEE || 1500),   // flat, if extra bag selected
  },
  email: {
    provider: env.EMAIL_PROVIDER || "NOT_CONFIGURED",
    from: env.EMAIL_FROM || "no-reply@skywardairlines.example",
    smtpHost: env.SMTP_HOST || "",
    smtpUser: env.SMTP_USER || "",
    smtpPass: env.SMTP_PASS || "",
  },
  analytics: {
    googleAnalyticsId: env.GA_ID || "",
  },
  admin: {
    // Placeholder auth for local/demo use only. Replace with real
    // hashed-password + session auth before any real deployment.
    demoToken: env.ADMIN_DEMO_TOKEN || "demo-admin-token",
  },
  flags: {
    liveAviationDataConnected: false,
    livePaymentConnected: false,
  },
};
