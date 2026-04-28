import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faUsers, faIndianRupeeSign, faChartLine, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const stats = [
    { label: 'Total Revenue', value: '₹12,450', icon: faIndianRupeeSign, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: '154', icon: faBox, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customers', value: '1,205', icon: faUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'Growth', value: '+12.5%', icon: faChartLine, color: 'bg-orange-50 text-orange-600' },
  ];

  const recentOrders = [
    { id: '#GM-12934', customer: 'Anirban Biswas', date: '2026-04-26', status: 'Processing', total: '₹45.00' },
    { id: '#GM-12933', customer: 'Sarah Jenkins', date: '2026-04-25', status: 'Shipped', total: '₹89.00' },
    { id: '#GM-12932', customer: 'Michael Chen', date: '2026-04-25', status: 'Delivered', total: '₹124.00' },
    { id: '#GM-12931', customer: 'Elena Rodriguez', date: '2026-04-24', status: 'Delivered', total: '₹55.00' },
  ];

  return (
    <div className="pt-20 min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-100 hidden md:block">
        <div className="p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">Admin Console</h2>
          <nav className="space-y-2">
            {['Overview', 'Orders', 'Products', 'Customers', 'Settings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">Dashboard Overview</h1>
          <div className="flex space-x-4">
            <button className="btn btn-outline py-2 px-6 text-xs">Export Report</button>
            <button className="btn btn-primary py-2 px-6 text-xs">Add Product</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 border border-neutral-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <button className="text-neutral-300 hover:text-black transition-colors">
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Recent Orders</h3>
            <button className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="text-sm hover:bg-neutral-50 transition-colors">
                    <td className="px-8 py-6 font-bold">{order.id}</td>
                    <td className="px-8 py-6">{order.customer}</td>
                    <td className="px-8 py-6 text-neutral-500">{order.date}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold">{order.total}</td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
