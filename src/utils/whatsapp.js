/**
 * WhatsApp Integration Utility
 * 
 * 1. Uses the native `whatsapp://send?phone={number}&text={message}` URI scheme
 *    to trigger the native WhatsApp Desktop app when installed.
 * 2. Uses a timeout-based fallback to `https://wa.me/{number}?text={message}`
 *    if the desktop protocol handler does not resolve or launch.
 * 3. Consistently targets `whatsapp_share_window` so that repeated share clicks
 *    reuse the same browser tab/window instead of opening multiple tabs.
 */

export const WHATSAPP_WINDOW_TARGET = 'whatsapp_share_window';

/**
 * Normalizes phone numbers by stripping non-digit characters.
 * If a 10-digit phone number is provided (standard in India),
 * prepends '91' for proper international routing in WhatsApp.
 */
export const normalizeWhatsAppPhone = (rawPhone) => {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Builds the native WhatsApp Desktop URI scheme URL
 */
export const buildWhatsAppDesktopUrl = (phone, text) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || '');

  if (normalizedPhone && normalizedPhone.length >= 10) {
    return `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`;
  }
  return `whatsapp://send?text=${encodedText}`;
};

/**
 * Builds the fallback web URL (wa.me)
 */
export const buildWhatsAppWebFallbackUrl = (phone, text) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || '');

  if (normalizedPhone && normalizedPhone.length >= 10) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Opens WhatsApp using the native Desktop app scheme in a reused named window,
 * with an automatic timeout-based fallback to wa.me if the desktop app is not available.
 * 
 * @param {Object} options
 * @param {string} options.phone - Recipient phone number / contact info
 * @param {string} options.text - Pre-filled message content
 */
export const openWhatsApp = ({ phone, text }) => {
  const desktopUrl = buildWhatsAppDesktopUrl(phone, text);
  const fallbackUrl = buildWhatsAppWebFallbackUrl(phone, text);
  const target = WHATSAPP_WINDOW_TARGET;

  let appLaunched = false;
  const onBlur = () => {
    appLaunched = true;
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('blur', onBlur, { once: true });
  }

  let shareWindow = null;
  try {
    // 1. Attempt opening native whatsapp:// URI in the designated reusable window
    shareWindow = window.open(desktopUrl, target);
  } catch (err) {
    console.warn('Direct whatsapp:// launch failed; opening fallback URL:', err);
    window.open(fallbackUrl, target);
    return;
  }

  // 2. Timeout-based fallback pattern:
  // If the browser window does not blur (no OS prompt or native app launched),
  // redirect the existing named window to the web fallback wa.me URL.
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', onBlur);
      if (!appLaunched && document.hasFocus && document.hasFocus()) {
        try {
          if (shareWindow && !shareWindow.closed) {
            shareWindow.location.href = fallbackUrl;
          } else {
            window.open(fallbackUrl, target);
          }
        } catch {
          window.open(fallbackUrl, target);
        }
      }
    }
  }, 1200);
};

/**
 * Formats a Morning Issued Slip (Combined or Single) into a clean, formatted WhatsApp text message.
 */
export const formatIssuedSlipWhatsAppMessage = (slip) => {
  if (!slip) return '';

  if (slip.isCombined) {
    const itemsListStr = (slip.items || []).map((item, idx) => 
      `${idx + 1}. *${item.productName}* (${item.qty} units @ ₹${Number(item.unitPrice).toFixed(2)}) = ₹${Number(item.totalValue).toFixed(2)}`
    ).join('\n');

    return `*DAILY DISTRIBUTION - COMBINED MORNING ISSUE SLIP*
----------------------------------------
📅 *Date:* ${slip.date}
👤 *Hawker:* ${slip.hawkerName}
📍 *Route:* ${slip.route || 'N/A'}
----------------------------------------
📦 *ISSUED PRODUCTS (${slip.totalProducts} Types):*
${itemsListStr}
----------------------------------------
🔢 *Total Units Issued:* ${slip.totalUnits} units
💰 *GRAND TOTAL VALUE:* ₹${Number(slip.grandTotalValue).toFixed(2)}
----------------------------------------
_Issued via Inventory Management System_`;
  }

  return `*DAILY DISTRIBUTION - MORNING ISSUE SLIP*
----------------------------------------
📅 *Date:* ${slip.date}
👤 *Hawker:* ${slip.hawkerName}
📍 *Route:* ${slip.route || 'N/A'}
🏷️ *Category:* ${slip.category || 'General'}
📦 *Product:* ${slip.productName}
🔢 *Quantity Issued:* ${slip.qty} units
💵 *Unit Price:* ₹${Number(slip.unitPrice).toFixed(2)}
----------------------------------------
💰 *Total Value:* ₹${Number(slip.totalValue).toFixed(2)}
----------------------------------------
_Issued via Inventory Management System_`;
};

/**
 * Helper to share an Issued Slip directly to WhatsApp
 */
export const shareIssuedSlipToWhatsApp = (slip) => {
  if (!slip) return;
  const message = formatIssuedSlipWhatsAppMessage(slip);
  openWhatsApp({
    phone: slip.contactInfo,
    text: message
  });
};
