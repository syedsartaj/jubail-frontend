import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Booking, Staff, BookingType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download, Calendar, DollarSign, Globe, User, Ticket, Clock, Filter, Printer, Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- FILTERS ---
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Toggle Filters
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'POS' | 'WEB'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'STAFF'>('ALL'); // Who made the booking
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TICKET' | 'ACTIVITY'>('ALL');

  // Print Mode State
  const [isPrinting, setIsPrinting] = useState(false);

  // 1. Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allBookings, allStaff] = await Promise.all([
          ApiService.getBookingsforuser(),
          ApiService.getStaff()
        ]);
        setBookings(allBookings);
        setStaffList(allStaff);
        // Initial filter application happens in the effect below
      } catch (error) {
        console.error("Failed to load report data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Run once on mount

  // 2. Re-apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [bookings, startDate, endDate, sourceFilter, roleFilter, typeFilter]);

  // 3. Handle Print Effect
  useEffect(() => {
    if (isPrinting) {
        // Small timeout to ensure DOM renders "print view" before browser print dialog opens
        const timer = setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isPrinting]);


  const getStaffName = (id?: string) => {
    if (!id) return '-';
    // Handle both _id (mongo) and id (mock)
    const staff = staffList.find(s => (s.id === id || s._id === id));
    return staff ? staff.name : 'Unknown Staff';
  };

  const applyFilters = () => {
    if (bookings.length === 0) {
        setFilteredBookings([]);
        return;
    }

    let result = [...bookings];

    // 1. Date Range
    result = result.filter(b => {
      const date = b.createdAt.split('T')[0];
      return date >= startDate && date <= endDate;
    });

    // 2. POS / Web Source
    if (sourceFilter !== 'ALL') {
      result = result.filter(b => {
        const isPos = !!b.createdByStaffId;
        return sourceFilter === 'POS' ? isPos : !isPos;
      });
    }

    // 3. Customer / Staff (Who booked it?)
    if (roleFilter !== 'ALL') {
        result = result.filter(b => {
            const isStaffBooked = !!b.createdByStaffId;
            return roleFilter === 'STAFF' ? isStaffBooked : !isStaffBooked;
        });
    }

    // 4. Ticket / Appointment Type
    if (typeFilter !== 'ALL') {
      result = result.filter(b => {
        return b.items.some(item => 
            typeFilter === 'TICKET' ? item.type === BookingType.TICKET : item.type === BookingType.ACTIVITY
        );
      });
    }

    // Sort Newest First
    result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredBookings(result);
  };

  // --- STATS CALCULATION (Based on Filtered Data) ---
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  
  const totalTicketsSold = filteredBookings.reduce((count, b) => {
      return count + b.items.filter(i => i.type === BookingType.TICKET).reduce((c, i) => c + i.quantity, 0);
  }, 0);

  const totalAppointments = filteredBookings.reduce((count, b) => {
      return count + b.items.filter(i => i.type === BookingType.ACTIVITY).reduce((c, i) => c + i.quantity, 0);
  }, 0);

  // --- EXPORT ---
  const handleExportCSV = () => {
    const headers = [
      "Booking ID", 
      "Date", 
      "Source (POS/Web)", 
      "Initiator (Staff/Customer)",
      "Customer Email",
      "Staff Email (if POS)",
      "Type",
      "Total Amount"
    ];

    const rows = filteredBookings.map(b => {
      const isPos = !!b.createdByStaffId;
      const staffName = isPos ? getStaffName(b.createdByStaffId) : '-';
      // Create a unique set of types involved in this booking
      const types = Array.from(new Set(b.items.map(i => i.type))).join(' & ');

      return [
        b.id, // Or b._id
        new Date(b.createdAt).toLocaleString(),
        isPos ? 'POS' : 'WEB',
        isPos ? `Staff: ${staffName}` : `Customer: ${b.customerName}`,
        b.customerEmail,
        isPos ? 'staff@riverrun.com' : '-', // Could fetch actual staff email if added to Staff type
        types,
        b.totalAmount.toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PRINT MODE RENDER ---
  if (isPrinting) {
      return (
          <div className="p-8 bg-white text-black min-h-screen font-sans">
              <div className="mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold">Sales Report</h1>
                  <p className="text-sm">Period: {startDate} to {endDate}</p>
                  <p className="text-sm">Generated on: {new Date().toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8 border-b pb-6">
                  <div>
                      <p className="text-xs font-bold uppercase text-gray-500">Total Revenue</p>
                      <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                      <p className="text-xs font-bold uppercase text-gray-500">Tickets Sold</p>
                      <p className="text-xl font-bold">{totalTicketsSold}</p>
                  </div>
                  <div>
                      <p className="text-xs font-bold uppercase text-gray-500">Appointments</p>
                      <p className="text-xl font-bold">{totalAppointments}</p>
                  </div>
              </div>

              <table className="w-full text-left text-xs">
                  <thead>
                      <tr className="border-b-2 border-black">
                          <th className="py-2">ID</th>
                          <th className="py-2">Date</th>
                          <th className="py-2">Source</th>
                          <th className="py-2">Details</th>
                          <th className="py-2 text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredBookings.map(b => (
                          <tr key={b.id || b._id} className="border-b border-gray-200">
                              <td className="py-2 font-mono">{b.id || b._id}</td>
                              <td className="py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                              <td className="py-2">{b.createdByStaffId ? 'POS' : 'WEB'}</td>
                              <td className="py-2">
                                  {b.createdByStaffId ? `Staff: ${getStaffName(b.createdByStaffId)}` : b.customerName}
                                  <br/>
                                  <span className="text-gray-500">{b.customerEmail}</span>
                              </td>
                              <td className="py-2 text-right font-bold">${b.totalAmount.toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  }

  // --- STANDARD DASHBOARD RENDER ---
  return (
    <div className="space-y-8">
      {/* HEADER & DATE FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Reports & Reconciliation</h1>
          <p className="text-gray-500">Track revenue, tickets, and appointments.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-500">From:</span>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"/>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-500">To:</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"/>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-500">Loading sales data...</span>
        </div>
      ) : (
        <>
            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-500 font-medium text-sm">Total Revenue</h3>
                    <DollarSign className="text-green-500 w-5 h-5"/>
                </div>
                <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Gross income for period</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-500 font-medium text-sm">Tickets Sold</h3>
                    <Ticket className="text-blue-500 w-5 h-5"/>
                </div>
                <p className="text-2xl font-bold text-slate-800">{totalTicketsSold}</p>
                <p className="text-xs text-gray-400 mt-1">Park entry passes</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-500 font-medium text-sm">Appointments</h3>
                    <Clock className="text-orange-500 w-5 h-5"/>
                </div>
                <p className="text-2xl font-bold text-slate-800">{totalAppointments}</p>
                <p className="text-xs text-gray-400 mt-1">Activity slots booked</p>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-300 font-medium text-sm">Statement Summary</h3>
                    <Filter className="text-white w-5 h-5 opacity-50"/>
                </div>
                <p className="text-2xl font-bold">{filteredBookings.length} Txns</p>
                <p className="text-xs text-gray-400 mt-1">Matching current filters</p>
                </div>
            </div>

            {/* ADVANCED FILTERS TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Source:</span>
                    <div className="flex bg-gray-100 rounded p-1">
                        {['ALL', 'POS', 'WEB'].map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setSourceFilter(opt as any)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${sourceFilter === opt ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Initiator:</span>
                    <div className="flex bg-gray-100 rounded p-1">
                        {['ALL', 'CUSTOMER', 'STAFF'].map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setRoleFilter(opt as any)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${roleFilter === opt ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Type:</span>
                    <div className="flex bg-gray-100 rounded p-1">
                        {['ALL', 'TICKET', 'ACTIVITY'].map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setTypeFilter(opt as any)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${typeFilter === opt ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsPrinting(true)}>
                        <Printer className="w-4 h-4 mr-2" /> PDF / Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* DETAILED TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details (Staff / Customer)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.length === 0 ? (
                        <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions match the selected filters.</td>
                        </tr>
                    ) : (
                        filteredBookings.map(b => {
                            const isPos = !!b.createdByStaffId;
                            return (
                                <tr key={b.id || b._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                        {b.id || b._id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(b.createdAt).toLocaleDateString()}
                                        <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isPos ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                            {isPos ? 'POS' : 'WEB'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {isPos ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-orange-500"/>
                                                <span className="font-bold">Staff:</span> {getStaffName(b.createdByStaffId)}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-indigo-500"/>
                                                <span className="font-bold">Customer:</span> {b.customerName}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {b.customerEmail}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-800">
                                        ${b.totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                    {/* Reconciliation Footer */}
                    <tfoot className="bg-gray-100 border-t border-gray-200">
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-right font-bold text-gray-600">TOTAL RECONCILIATION:</td>
                            <td className="px-6 py-4 text-right font-bold text-indigo-700 text-lg">${totalRevenue.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Reports;