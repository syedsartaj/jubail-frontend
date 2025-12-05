import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Booking, Staff, BookingType, User } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx/xlsx.mjs';
import { DollarSign, Users, Ticket, Activity, Download, Filter } from 'lucide-react';
import { ApiService } from '../../services/api';

interface Filters {
  startDate: string;
  endDate: string;
  staffId: string;
  paymentStatus: string;
  attendanceStatus: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

const ROWS_PER_PAGE = 10;

const Dashboard: React.FC = () => {
  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // Filtered State
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [chartData, setChartData] = useState<{ name: string; sales: number }[]>([]);
  const [stats, setStats] = useState({ revenue: 0, totalBookings: 0, ticketsSold: 0 });

  // Filters
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    staffId: '',
    paymentStatus: '',
    attendanceStatus: ''
  });

  // View Mode & Pagination
  const [viewMode, setViewMode] = useState<'booking' | 'customer'>('booking');
  const [bookingPage, setBookingPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  // --- INITIAL LOAD ---
useEffect(() => {
  const fetchData = async () => {
    try {
      const [allBookings, allUsers, allStaff] = await Promise.all([
        ApiService.getBookings(),
        ApiService.getUsers(),
        ApiService.getStaff()
      ]);
      setBookings(allBookings);
      setUsersList(allUsers);
      setStaffList(allStaff);
      setFilteredBookings(allBookings); // Default show all
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  fetchData();
}, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = [...bookings];

    if (filters.startDate) {
        result = result.filter(b => b.createdAt.split('T')[0] >= filters.startDate);
    }
    if (filters.endDate) {
        result = result.filter(b => b.createdAt.split('T')[0] <= filters.endDate);
    }
    if (filters.staffId) {
        result = result.filter(b => b.createdByStaffId === filters.staffId);
    }
    if (filters.paymentStatus) {
        result = result.filter(b => b.status === filters.paymentStatus);
    }
    if (filters.attendanceStatus) {
        const isPresent = filters.attendanceStatus === 'present';
        result = result.filter(b => b.scanned === isPresent);
    }

    // Sort descending by date
    result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredBookings(result);
    setBookingPage(1); // Reset pagination on filter change
    setCustomerPage(1);

    // Update Stats based on FILTERED data
    const totalRev = result.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTix = result.reduce((sum, b) => sum + b.items.length, 0);

    setStats({
        revenue: totalRev,
        totalBookings: result.length,
        ticketsSold: totalTix
    });

    // Update Chart Data
    const dailyMap: Record<string, number> = {};
    result.forEach(b => {
        const date = new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        dailyMap[date] = (dailyMap[date] || 0) + b.totalAmount;
    });
    
    // Ensure chart has data points even if empty
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chart = daysOrder.map(day => ({
        name: day,
        sales: dailyMap[day] || 0
    }));
    setChartData(chart);

  }, [filters, bookings]);

  // --- HELPERS ---
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const paginate = <T,>(data: T[], page: number) => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- DERIVED CUSTOMER DATA ---
  // Group bookings by email to create a customer view
  const customerData = Object.values(
    filteredBookings.reduce((acc: Record<string, any>, b) => {
      const email = b.customerEmail || 'Unknown';
      if (!acc[email]) {
          acc[email] = { 
              name: b.customerName, 
              email: email, 
              bookingsCount: 0, 
              totalSpent: 0,
              lastVisit: b.createdAt
          };
      }
      acc[email].bookingsCount += 1;
      acc[email].totalSpent += b.totalAmount;
      if (b.createdAt > acc[email].lastVisit) acc[email].lastVisit = b.createdAt;
      return acc;
    }, {})
  );

  const totalBookingPages = Math.ceil(filteredBookings.length / ROWS_PER_PAGE);
  const totalCustomerPages = Math.ceil(customerData.length / ROWS_PER_PAGE);
  const totalUserPages = Math.ceil(usersList.length / ROWS_PER_PAGE);

  const StatCard = ({ icon, title, value, color }: StatCardProps) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 text-opacity-100`}>
{React.isValidElement(icon) &&
  React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
    className: `w-6 h-6 ${color.replace('bg-', 'text-')}`,
  })}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign />} title="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} color="bg-green-500" />
        <StatCard icon={<Activity />} title="Total Bookings" value={stats.totalBookings} color="bg-blue-500" />
        <StatCard icon={<Ticket />} title="Tickets Sold" value={stats.ticketsSold} color="bg-purple-500" />
        <StatCard icon={<Users />} title="Total Users" value={usersList.length} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">Revenue Trends (Filtered)</h2>
            <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Quick Filters Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-indigo-600"/>
                <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="border rounded p-2 text-sm w-full" />
                        <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="border rounded p-2 text-sm w-full" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Staff Member</label>
                    <select value={filters.staffId} onChange={e => handleFilterChange('staffId', e.target.value)} className="border rounded p-2 text-sm w-full">
                        <option value="">All Staff</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment</label>
                        <select value={filters.paymentStatus} onChange={e => handleFilterChange('paymentStatus', e.target.value)} className="border rounded p-2 text-sm w-full">
                            <option value="">All</option>
                            <option value="PAID">Paid</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Attendance</label>
                        <select value={filters.attendanceStatus} onChange={e => handleFilterChange('attendanceStatus', e.target.value)} className="border rounded p-2 text-sm w-full">
                            <option value="">All</option>
                            <option value="present">Scanned</option>
                            <option value="absent">Not Scanned</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={() => setFilters({ startDate: '', endDate: '', staffId: '', paymentStatus: '', attendanceStatus: '' })}
                    className="w-full py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 mt-2"
                >
                    Reset Filters
                </button>
            </div>
        </div>
      </div>

      {/* --- DATA TABLES SECTION --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header & Tabs */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button 
                    onClick={() => setViewMode('booking')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'booking' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Transactions
                </button>
                <button 
                    onClick={() => setViewMode('customer')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'customer' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Customer Analytics
                </button>
            </div>

            <button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                    const dataToExport = viewMode === 'booking' 
                        ? filteredBookings.map(b => ({
                            ID: b.id, Date: b.createdAt, Name: b.customerName, Email: b.customerEmail, Amount: b.totalAmount, Status: b.status
                          }))
                        : customerData;
                    exportToExcel(dataToExport, viewMode === 'booking' ? 'Transactions' : 'Customers');
                }}
            >
                <Download size={16} /> Export Excel
            </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        {viewMode === 'booking' ? (
                            <>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">ID / Date</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Customer</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Items</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Amount</th>
                            </>
                        ) : (
                            <>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Customer Name</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Email</th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">Total Bookings</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Total Spent</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Last Visit</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {viewMode === 'booking' ? (
                        filteredBookings.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No bookings match the current filters.</td></tr>
                        ) : (
                            paginate(filteredBookings, bookingPage).map(b => (
                                <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-gray-500">{b.id}</div>
                                        <div className="text-gray-900">{new Date(b.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{b.customerName}</div>
                                        <div className="text-xs text-gray-500">{b.customerEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {b.items.length} items
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            b.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                        ${b.totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )
                    ) : (
                        customerData.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No customer data available.</td></tr>
                        ) : (
                            paginate(customerData, customerPage).map((c: any) => (
                                <tr key={c.email} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{c.email}</td>
                                    <td className="px-6 py-4 text-center">{c.bookingsCount}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600">${c.totalSpent.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-xs text-gray-500">
                                        {new Date(c.lastVisit).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">
                Page {viewMode === 'booking' ? bookingPage : customerPage} of {viewMode === 'booking' ? totalBookingPages : totalCustomerPages}
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => viewMode === 'booking' ? setBookingPage(p => Math.max(1, p-1)) : setCustomerPage(p => Math.max(1, p-1))}
                    disabled={(viewMode === 'booking' ? bookingPage : customerPage) === 1}
                    className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                    Previous
                </button>
                <button 
                    onClick={() => viewMode === 'booking' ? setBookingPage(p => Math.min(totalBookingPages, p+1)) : setCustomerPage(p => Math.min(totalCustomerPages, p+1))}
                    disabled={(viewMode === 'booking' ? bookingPage : customerPage) >= (viewMode === 'booking' ? totalBookingPages : totalCustomerPages)}
                    className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                    Next
                </button>
            </div>
        </div>
      </div>

      {/* REGISTERED USERS TABLE (Optional Separate Section) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
         <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Registered Users Directory</h2>
            <button 
                onClick={() => exportToExcel(usersList, 'RegisteredUsers')}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
                <Download size={14}/> Download List
            </button>
         </div>
         <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Role</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {paginate(usersList, userPage).map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-mono text-xs text-gray-500">{u.id}</td>
                            <td className="px-6 py-3 font-medium">{u.name}</td>
                            <td className="px-6 py-3 text-gray-600">{u.email}</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold 
                                    ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                      u.role === 'STAFF' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {u.role}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
         <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-center">
             <div className="flex gap-2">
                <button onClick={() => setUserPage(p => Math.max(1, p-1))} disabled={userPage===1} className="px-2 py-1 text-xs border rounded bg-white">Prev</button>
                <span className="text-xs py-1">Page {userPage}</span>
                <button onClick={() => setUserPage(p => Math.min(totalUserPages, p+1))} disabled={userPage>=totalUserPages} className="px-2 py-1 text-xs border rounded bg-white">Next</button>
             </div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;