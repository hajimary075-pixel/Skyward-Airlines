// Shared across every page. Pulls branding/contact info from /api/config
// so nothing customer-facing is hard-coded — edit config/site.config.js
// (or env vars) and the whole site updates.

const App = (() => {
  let configCache = null;

  async function getConfig() {
    if (configCache) return configCache;
    const res = await fetch("/api/config");
    configCache = await res.json();
    return configCache;
  }

  async function api(path, opts = {}) {
    const res = await fetch("/api" + path, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed");
      err.data = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function applyBranding(cfg) {
    const root = document.documentElement.style;
    root.setProperty("--primary", cfg.branding.primaryColor);
    root.setProperty("--secondary", cfg.branding.secondaryColor);
    root.setProperty("--accent", cfg.branding.accentColor);
    root.setProperty("--font", cfg.branding.fontFamily);
    document.title = document.title.includes("|") ? document.title : `${document.title} | ${cfg.company.name}`;

    let iconLink = document.querySelector('link[rel="icon"]');
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    iconLink.href = cfg.company.faviconUrl;
  }

  function whatsappLink(cfg, message) {
    const text = encodeURIComponent(message || `Hello, I would like to contact ${cfg.company.name} support.`);
    return `https://wa.me/${cfg.contact.whatsapp}?text=${text}`;
  }

  // Single source of truth for the WhatsApp payment message text, used
  // by both the confirmation/ticket page and Manage Booking so the
  // message a customer sends is identical regardless of where they
  // triggered it from.
  function buildPaymentMessage(booking) {
    const fb = booking.fare_breakdown;
    const passengerNames = booking.passengers.map((p) => `${p.title} ${p.firstName} ${p.surname}`).join(", ");
    const lines = [
      `Hello, I would like to complete payment for booking ${booking.reference}.`,
      ``,
      `Passenger(s): ${passengerNames}`,
      `Flight: ${booking.flight_number}`,
      `Route: ${fb.origin} to ${fb.destination}`,
      `Date: ${booking.travel_date || "TBC"}`,
      `Fare: ${fmtMoney(fb.fare_subtotal, fb.currency)}`,
      fb.discount_total > 0 ? `Discount: -${fmtMoney(fb.discount_total, fb.currency)}` : null,
      `Taxes & Fees: ${fmtMoney(fb.taxes_total + fb.airport_charges_total + fb.service_fee + fb.booking_fee, fb.currency)}`,
      fb.baggage_total > 0 ? `Extra Baggage: ${fmtMoney(fb.baggage_total, fb.currency)}` : null,
      `Total: ${fmtMoney(fb.grand_total, fb.currency)}`,
      `Currency: ${fb.currency}`,
    ].filter(Boolean);
    return lines.join("\n");
  }

  function renderHeader(cfg, activePath) {
    const el = document.getElementById("site-header");
    if (!el) return;
    const links = [
      ["/", "Home"],
      ["/search", "Book a Flight"],
      ["/manage-booking", "Manage Booking"],
      ["/flight-status", "Flight Status"],
      ["/destinations", "Destinations"],
      ["/deals", "Deals"],
      ["/fleet", "Our Fleet"],
      ["/faq", "FAQ"],
      ["/contact", "Contact"],
    ];
    el.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="/">
          <img src="${cfg.company.logoUrl}" alt="${cfg.company.name} logo" onerror="this.style.display='none'">
          <span>${cfg.company.name}</span>
        </a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">&#9776;</button>
        <nav class="main-nav" id="main-nav">
          ${links.map(([href, label]) => `<a href="${href}" ${activePath === href ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
          <a class="header-cta" href="/search">Search Flights</a>
        </nav>
      </div>`;
    document.getElementById("nav-toggle").addEventListener("click", () => {
      const nav = document.getElementById("main-nav");
      const open = nav.classList.toggle("open");
      document.getElementById("nav-toggle").setAttribute("aria-expanded", open);
    });
  }

  function renderFooter(cfg) {
    const el = document.getElementById("site-footer");
    if (!el) return;
    const socials = Object.entries(cfg.social).filter(([, v]) => v);
    el.innerHTML = `
      <div class="footer-grid">
        <div>
          <h4>${cfg.company.name}</h4>
          <p style="color:#cfd6d1;font-size:0.85rem;">${cfg.company.tagline}</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="/destinations">Destinations</a>
          <a href="/deals">Deals & Offers</a>
          <a href="/fleet">Our Fleet</a>
          <a href="/news">News</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="/manage-booking">Manage Booking</a>
          <a href="/flight-status">Flight Status</a>
          <a href="/faq">FAQ</a>
          <a href="/travel-info">Travel Information</a>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="tel:${cfg.contact.phone}">${cfg.contact.phone}</a>
          <a href="mailto:${cfg.contact.email}">${cfg.contact.email}</a>
          <span style="color:#cfd6d1;display:block;font-size:0.85rem;margin-bottom:8px;">${cfg.contact.address}</span>
          ${socials.length ? socials.map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a>`).join("") : ""}
        </div>
      </div>
      <div class="footer-bottom">&copy; ${new Date().getFullYear()} ${cfg.company.legalName}. All rights reserved.</div>`;
  }

  function renderWhatsappFloat(cfg, message) {
    const el = document.getElementById("whatsapp-float");
    if (!el) return;
    el.href = whatsappLink(cfg, message);
    el.textContent = "WhatsApp Us";
    el.target = "_blank";
    el.rel = "noopener";
  }

  async function initLayout(activePath, waMessage) {
    const cfg = await getConfig();
    applyBranding(cfg);
    renderHeader(cfg, activePath);
    renderFooter(cfg);
    renderWhatsappFloat(cfg, waMessage);
    return cfg;
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function fmtMoney(amount, currency) {
    return `${currency || "USD"} ${Number(amount).toFixed(2)}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { getConfig, api, initLayout, whatsappLink, buildPaymentMessage, qs, fmtMoney, escapeHtml };
})();
