const API_BASE = 'http://127.0.0.1:5000/api';

function getAuthHeaders() {
  const stored = localStorage.getItem('riverrun_auth');

  if (!stored) {
    return { 'Content-Type': 'application/json' };
  }

  const parsed = JSON.parse(stored);
  const token = parsed.token;

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`   // ✅ FIXED
  };
}


export const ApiService = {
  // --- AUTH ---
login: async (email: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  const data = await res.json();

  // ✅ Expecting: { token: "...", user: {...} }
  if (data?.token) {
    localStorage.setItem('riverrun_auth', JSON.stringify(data));
  }

  return data; // return full payload
},
register: (name: string, email: string, password: string) =>
  fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // ✅ no token
    body: JSON.stringify({ name, email, password })
  }).then(res => res.json()),
  // --- TICKETS ---
  async getTickets() {
    const res = await fetch(`${API_BASE}/tickets`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return await res.json();
  },

  async saveTicket(ticket: any) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(ticket),
    });
    if (!res.ok) throw new Error('Failed to save ticket');
    return await res.json();
  },

  async deleteTicket(id: string) {
    return fetch(`${API_BASE}/tickets/${id}`, {
      method: 'DELETE',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- STAFF ---
  async getStaff() {
    const res = await fetch(`${API_BASE}/staff`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch staff');
    return await res.json();
  },

  async saveStaff(staff: any) {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(staff),
    });
    if (!res.ok) throw new Error('Failed to save staff');
    return await res.json();
  },

  async deleteStaff(id: string) {
    return fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- ✅ CATEGORIES (BACKEND ADDED) ---
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  },

  async saveCategory(category: any) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to save category');
    return await res.json();
  },

  async deleteCategory(id: string) {
    return fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- SLOTS ---
  async getSlots(date?: string) {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE}/slots${query}`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch slots');
    return await res.json();
  },

  async saveSlot(slot: any) {
    const res = await fetch(`${API_BASE}/slots`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(slot),
    });
    if (!res.ok) throw new Error('Failed to save slot');
    return await res.json();
  },


  async deleteSlot(id: string) {
    return fetch(`${API_BASE}/slots/${id}`, {
      method: 'DELETE',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- ✅ FIXED SCHEDULE RULE PATH ---
  async saveScheduleRule(rule: any) {
    const res = await fetch(`${API_BASE}/schedulerules`, {  // ✅ FIXED
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to save rule');
    return await res.json();
  },

  // ---- USERS ---
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  // --- BOOKINGS ---
  async getBookings() {
    const res = await fetch(`${API_BASE}/bookings`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return await res.json();
  },
  async getBookingsforuser(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_BASE}/bookings${query}`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return await res.json();
  },

  async createBooking(booking: any) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return await res.json();
  },

  async markBookingScanned(bookingId: string) {
    return fetch(`${API_BASE}/bookings/${bookingId}/scan`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- COUPONS ---
async getCouponByCode(code: string) {
  const res = await fetch(`${API_BASE}/coupons/code/${code}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Invalid coupon');
  return await res.json();
},

  async getCoupons() {
    const res = await fetch(`${API_BASE}/coupons`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch coupons');
    return await res.json();
  },

  async saveCoupon(coupon: any) {
    const res = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(coupon),
    });
    if (!res.ok) throw new Error('Failed to save coupon');
    return await res.json();
  },

  async deleteCoupon(id: string) {
    return fetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    }).then(res => res.ok);
  },

  // --- ✅ SETTINGS (BACKEND ADDED BELOW) ---
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, {
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  async saveSettings(settings: any) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      // headers: getAuthHeaders(),
          headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return await res.json();
  },

  // --- ACTIVITIES ---
async getActivities() {
  const res = await fetch(`${API_BASE}/activities`, {
    // headers: getAuthHeaders(),   // ✅ REQUIRED
        headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
  });

  if (!res.ok) throw new Error('Failed to fetch activities');
  return await res.json();
},

async saveActivity(activity: any) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    // headers: getAuthHeaders(),     // ✅ REQUIRED
        headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
    body: JSON.stringify(activity),
  });

  if (!res.ok) throw new Error('Failed to save activity');
  return await res.json();
},

async deleteActivity(id: string) {
  const res = await fetch(`${API_BASE}/activities/${id}`, {
    method: 'DELETE',
    // headers: getAuthHeaders(),    // ✅ REQUIRED
        headers: { 'Content-Type': 'application/json' }, // ✅ NO token on login
  });

  return res.ok;
},

};

