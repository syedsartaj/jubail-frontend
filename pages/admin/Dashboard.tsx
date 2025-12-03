import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Booking } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Ticket, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    totalBookings: 0,
    ticketsSold: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const bookings = MockDB.getBookings();
    
    // Calculate Stats
    const totalRev = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTickets = bookings.reduce((sum, b) => sum + b.items.length, 0);
    
    setStats({
      revenue: totalRev,
      totalBookings: bookings.length,
      ticketsSold: totalTickets
    });

    // Mock Chart Data (Last 7 days)
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for(let i=0; i<7; i++) {
        data.push({
            name: days[i],
            sales: Math.floor(Math.random() * 500) + 100
        });
    }
    setChartData(data);
  }, []);

  const StatCard = ({ icon, title, value, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign />} title="Total Revenue" value={`$${stats.revenue}`} color="bg-green-500" />
        <StatCard icon={<Activity />} title="Total Bookings" value={stats.totalBookings} color="bg-blue-500" />
        <StatCard icon={<Ticket />} title="Tickets Sold" value={stats.ticketsSold} color="bg-purple-500" />
        <StatCard icon={<Users />} title="Active Users" value="12" color="bg-orange-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-6">Weekly Revenue</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} prefix="$" />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;