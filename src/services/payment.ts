export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  zip: string;
  name: string;
}

const API_BASE = "http://localhost:5000/api/aps";

export const PaymentService = {
  // ✅ REAL AMAZON PAYMENT SERVICES FLOW
  processPayment: async (
    amount: number,
    card: CardDetails,
    email: string
  ): Promise<PaymentResult> => {
    try {
      // 🔹 1. TOKENIZE CARD
      const tokenRes = await fetch(`${API_BASE}/tokenize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: card.number,
          expiry: card.expiry,
          cvv: card.cvc,
          name: card.name
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.status !== "02") {
        return {
          success: false,
          error: tokenData.response_message || "Card tokenization failed"
        };
      }

      // 🔹 2. CHARGE TOKEN
      const payRes = await fetch(`${API_BASE}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenData.token_name,
          amount: amount,
          email: email
        })
      });

      const payData = await payRes.json();

      if (payData.status === "14") {
        return {
          success: true,
          transactionId: payData.fort_id
        };
      }

      return {
        success: false,
        error: payData.response_message || "Payment failed"
      };

    } catch (error: any) {
      console.error("APS Payment Error:", error);
      return {
        success: false,
        error: "Payment service unavailable"
      };
    }
  },

  // ✅ KEEP YOUR EXISTING HELPERS (UNCHANGED)

  formatCardNumber: (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  },

  formatExpiry: (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  },

  getCardType: (number: string) => {
    const re = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/
    };
    if (re.visa.test(number)) return "VISA";
    if (re.mastercard.test(number)) return "MASTERCARD";
    if (re.amex.test(number)) return "AMEX";
    if (re.discover.test(number)) return "DISCOVER";
    return "UNKNOWN";
  }
};
