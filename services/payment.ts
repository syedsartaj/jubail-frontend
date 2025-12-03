
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

export const PaymentService = {
  // Simulate API Latency and Processing
  processPayment: async (amount: number, card: CardDetails): Promise<PaymentResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Basic Validation Logic
        const cleanNumber = card.number.replace(/\s/g, '');
        const cleanExpiry = card.expiry.replace(/\//g, '');
        
        // 1. Validate Card Number Length
        if (cleanNumber.length < 15 || cleanNumber.length > 16) {
          resolve({ success: false, error: 'Invalid card number length.' });
          return;
        }

        // 2. Validate Expiry (Simple Future Check)
        const month = parseInt(cleanExpiry.substring(0, 2));
        const year = parseInt('20' + cleanExpiry.substring(2, 4));
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) {
            resolve({ success: false, error: 'Invalid expiry month.' });
            return;
        }

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          resolve({ success: false, error: 'Card has expired.' });
          return;
        }

        // 3. Validate CVC
        if (card.cvc.length < 3) {
          resolve({ success: false, error: 'Invalid CVC code.' });
          return;
        }

        // 4. Simulate Random Decline (for testing robust UI)
        // In a real app, this logic happens on the bank's side
        if (cleanNumber.endsWith('0000')) {
             resolve({ success: false, error: 'Card was declined by the issuing bank.' });
             return;
        }

        // Success
        resolve({
          success: true,
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
        });

      }, 2000); // 2 second mock delay
    });
  },

  // Helper to format card number with spaces
  formatCardNumber: (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  },

  // Helper to format expiry date MM/YY
  formatExpiry: (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  },

  // Detect Card Type for UI Icon
  getCardType: (number: string) => {
    const re = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/
    };
    if (re.visa.test(number)) return 'VISA';
    if (re.mastercard.test(number)) return 'MASTERCARD';
    if (re.amex.test(number)) return 'AMEX';
    if (re.discover.test(number)) return 'DISCOVER';
    return 'UNKNOWN';
  }
};
