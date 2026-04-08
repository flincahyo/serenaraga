'use client';

import React from 'react';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  MoreVertical,
  Star
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Sen', bookings: 12, revenue: 2400 },
  { name: 'Sel', bookings: 18, revenue: 3600 },
  { name: 'Rab', bookings: 15, revenue: 3000 },
  { name: 'Kam', bookings: 25, revenue: 5000 },
  { name: 'Jum', bookings: 22, revenue: 4400 },
  { name: 'Sab', bookings: 35, revenue: 7000 },
  { name: 'Min', bookings: 30, revenue: 6000 },
];

const stats = [
  { name: 'Total Bookings', value: '157', icon: <ShoppingBag size={24} />, change: '+12%', color: 'bg-blue-500/10 text-blue-500' },
  { name: 'Revenue', value: 'Rp 4,5JT', icon: <TrendingUp size={24} />, change: '+18%', color: 'bg-emerald-500/10 text-emerald-500' },
  { name: 'New Clients', value: '42', icon: <Users size={24} />, change: '+5%', color: 'bg-amber-500/10 text-amber-500' },
  { name: 'Avg. Rating', value: '4.9', icon: <Star size={24} />, change: '0.1', color: 'bg-rose-500/10 text-rose-500' },
];

const Dashboard = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary dark:text-white">Admin Dashboard</h1>
        <p className="text-text-secondary dark:text-white/40 mt-1">
          Pantau performa dan ringkasan operasional SerenaRaga secara real-time.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-earth-primary/5 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary dark:text-white/40">{stat.name}</p>
            <h3 className="text-2xl font-bold text-text-primary dark:text-white mt-1 tabular-nums">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-earth-primary/5 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-bold text-text-primary dark:text-white">Booking Overview</h3>
              <p className="text-xs text-text-secondary dark:text-white/40 italic">Data trafik pemesanan 7 hari terakhir</p>
            </div>
            <select className="bg-bg-cream dark:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold outline-none border-none dark:text-white">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#8B5E3C" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBook)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-earth-primary/5 dark:border-white/5 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary dark:text-white mb-8">Recent Bookings</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-earth-primary/10 flex items-center justify-center font-bold text-earth-primary text-xs">
                    JD
                  </div>
                  <div>
                    <h4 className="text-sm font-bold dark:text-white">Jane Doe</h4>
                    <p className="text-[10px] text-text-secondary dark:text-white/40 italic">Signature Massage • 90m</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-earth-primary">Rp 250rb</p>
                  <p className="text-[10px] text-text-secondary dark:text-white/40">10:45 AM</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 bg-bg-cream dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary dark:text-white/60 hover:bg-earth-primary hover:text-white transition-all">
            See All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
