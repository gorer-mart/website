'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faUsers, 
  faDollarSign, 
  faChartLine, 
  faEllipsisVertical, 
  faCheckCircle, 
  faExclamationCircle, 
  faDatabase,
  faGear,
  faLaptopCode
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { PRODUCTS } from '../../data/products';
import { getProducts, isSanityConfigured, client } from '../../lib/sanity';
import { Product } from '../../types/product';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<{
    projectId: string;
    dataset: string;
    categoriesCount: number;
    productsCount: number;
    errorMsg?: string;
    isCorsError?: boolean;
  } | null>(null);

  const runConnectionTest = async () => {
    setTestStatus('testing');
    setTestResults(null);
    try {
      // Fetch categories and products using Sanity client to test live connection
      const categoriesQuery = `*[_type == "category"]{_id}`;
      const productsQuery = `*[_type == "product"]{_id}`;
      
      const [cats, prods] = await Promise.all([
        client.fetch(categoriesQuery),
        client.fetch(productsQuery)
      ]);

      setTestStatus('success');
      setTestResults({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk',
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
        categoriesCount: cats.length,
        productsCount: prods.length,
      });
    } catch (err: any) {
      console.error("Sanity live test failed:", err);
      const isCors = err.message?.toLowerCase().includes('network error') || 
                     err.message?.toLowerCase().includes('cors') ||
                     err.message?.toLowerCase().includes('failed to fetch') ||
                     err.toString().toLowerCase().includes('network error');
      
      setTestStatus('error');
      setTestResults({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk',
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
        categoriesCount: 0,
        productsCount: 0,
        errorMsg: err.message || err.toString(),
        isCorsError: isCors || true,
      });
    }
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const sanityConnected = isSanityConfigured();
        setIsConnected(sanityConnected);
        const fetched = await getProducts();
        setProductsList(fetched);
      } catch (err) {
        console.error("Admin portal data loading error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const stats = [
    { label: 'Total Revenue', value: '₹58,380', icon: faDollarSign, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    { label: 'Total Orders', value: '117', icon: faBox, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { label: 'Catalog Products', value: productsList.length.toString(), icon: faDatabase, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
    { label: 'Active Users', value: '1,205', icon: faUsers, color: 'bg-orange-50 text-orange-600 border border-orange-100' },
  ];

  const recentOrders = [
    { id: '#GM-12934', customer: 'Anirban Biswas', date: '2026-05-22', status: 'Processing', total: '₹499.00' },
    { id: '#GM-12933', customer: 'Sarah Jenkins', date: '2026-05-21', status: 'Shipped', total: '₹998.00' },
    { id: '#GM-12932', customer: 'Michael Chen', date: '2026-05-20', status: 'Delivered', total: '₹1,497.00' },
    { id: '#GM-12931', customer: 'Elena Rodriguez', date: '2026-05-19', status: 'Delivered', total: '₹499.00' },
  ];

  return (
    <div className="pt-20 min-h-screen bg-neutral-50/50 flex flex-col md:flex-row">
      <title>Admin Console — Gorer Mart</title>
      <meta name="description" content="Gorer Mart administrative dashboard" />

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-neutral-100 p-8 flex-shrink-0">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">Admin Console</h2>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {isConnected ? 'CMS Connected' : 'Static Fallback'}
            </span>
          </div>
        </div>
        
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 pb-4 md:pb-0 no-scrollbar">
          {['Overview', 'Products', 'Settings'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${activeTab === tab ? 'bg-black text-white shadow-premium' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12 max-w-7xl">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
              Console {activeTab}
            </h1>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">
              Manage website catalog, track metrics, and connect database
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button asChild className="text-xs uppercase tracking-widest py-3 flex-1 sm:flex-none">
              <Link href="/studio" target="_blank">
                Open Sanity Studio
              </Link>
            </Button>
          </div>
        </div>

        {/* Dynamic CMS Warning alert if offline */}
        {!isConnected && activeTab === 'Overview' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-amber-50 border border-amber-200/50 p-6 rounded-2xl flex items-start space-x-4 shadow-sm"
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="text-amber-500 text-xl mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="font-bold text-sm uppercase tracking-wider text-amber-900 mb-1">Sanity CMS Offline Fallback</h3>
              <p className="text-xs text-amber-700 leading-relaxed mb-4">
                The administrative dashboard is currently operating on the local static dataset (<code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-[10px]">src/data/products.ts</code>) because the Sanity credentials are not yet configured in your local environment.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('Settings')}
                className="bg-white border-amber-200 text-amber-900 hover:bg-amber-100 hover:text-black text-[10px] py-1.5 px-4 rounded-lg uppercase tracking-wider h-auto"
              >
                Configure Sanity Credentials
              </Button>
            </div>
          </motion.div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 border border-neutral-100 shadow-sm rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-display font-black tracking-tight">{stat.value}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <FontAwesomeIcon icon={stat.icon} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-neutral-100 shadow-sm rounded-2xl overflow-hidden mb-12">
              <div className="px-8 py-6 border-b border-neutral-50 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Recent Sales Activity</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 px-3 py-1 rounded">Live Orders</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      <th className="px-8 py-4">Order ID</th>
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentOrders.map((order, idx) => (
                      <tr key={idx} className="text-sm hover:bg-neutral-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold">{order.id}</td>
                        <td className="px-8 py-5 font-medium">{order.customer}</td>
                        <td className="px-8 py-5 text-neutral-400 text-xs font-medium">{order.date}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold">{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'Products' && (
          <div className="bg-white border border-neutral-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Products List ({productsList.length})</h3>
              <Button asChild className="text-[10px] uppercase tracking-wider py-2 h-auto">
                <Link href="/studio" target="_blank">Add Product</Link>
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    <th className="px-8 py-4">Image</th>
                    <th className="px-8 py-4">Product Name</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Tag</th>
                    <th className="px-8 py-4">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {productsList.map((product, idx) => (
                    <tr key={idx} className="text-sm hover:bg-neutral-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="w-12 h-16 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-100">
                          <img 
                            src={product.images[0]?.src || product.images[0]} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div>
                          <div className="font-normal text-neutral-900">{product.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">ID: {product.id}</div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2.5 py-1 rounded bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        {product.tags && product.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                            {product.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded bg-accent/5 text-accent text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : product.tag ? (
                          <span className="px-2.5 py-1 rounded bg-accent/5 text-accent text-xs font-bold uppercase tracking-wider">
                            {product.tag}
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-8 py-4 font-bold">₹{product.price.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS / INSTRUCTIONS */}
        {activeTab === 'Settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 p-8 md:p-12 shadow-sm rounded-3xl"
          >
            <div className="max-w-3xl">
              <h2 className="text-2xl font-display font-black uppercase tracking-tight mb-4">
                CMS Connection Settings
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed mb-8">
                Gorer Mart CMS uses Sanity.io. In this environment, dynamic content loading and fallback data triggers are enabled. Follow these steps to fully configure the live environment.
              </p>

              {/* Dynamic Live Connection Tester */}
              <div className="mb-10 p-6 border border-neutral-100 bg-neutral-50/55 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGear} />
                  <span>Interactive Connection Tester</span>
                </h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Click below to test if your browser can successfully connect to the Sanity cloud database. This will check for CORS blocks and verify document counts in real-time.
                </p>

                {testStatus === 'idle' && (
                  <Button onClick={runConnectionTest} className="text-xs uppercase tracking-wider px-6 py-3">
                    Run Connection Test
                  </Button>
                )}

                {testStatus === 'testing' && (
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
                    <span>Querying Sanity API...</span>
                  </div>
                )}

                {testStatus === 'success' && testResults && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg w-fit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Connection Successful!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-white border border-neutral-100 p-4 rounded-xl text-xs">
                      <div>
                        <span className="text-neutral-400 uppercase tracking-wider text-[9px] block">Project ID</span>
                        <strong className="font-mono text-neutral-800">{testResults.projectId}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 uppercase tracking-wider text-[9px] block">Dataset</span>
                        <strong className="font-mono text-neutral-800">{testResults.dataset}</strong>
                      </div>
                      <div className="mt-2">
                        <span className="text-neutral-400 uppercase tracking-wider text-[9px] block">Categories in Cloud</span>
                        <strong className="text-neutral-800 text-sm font-bold">{testResults.categoriesCount}</strong>
                      </div>
                      <div className="mt-2">
                        <span className="text-neutral-400 uppercase tracking-wider text-[9px] block">Products in Cloud</span>
                        <strong className="text-neutral-800 text-sm font-bold">{testResults.productsCount}</strong>
                      </div>
                    </div>
                    {testResults.productsCount === 0 && (
                      <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-xl text-xs leading-relaxed space-y-1">
                        <div><strong>Attention Required: Empty Catalog</strong></div>
                        <div>Connection succeeded, but <strong>0 products</strong> were found in your cloud dataset. Go to the <Link href="/studio" target="_blank" className="underline font-bold">Sanity Studio (/studio)</Link> and publish a Category first, then publish Products under it!</div>
                      </div>
                    )}
                  </div>
                )}

                {testStatus === 'error' && testResults && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-lg w-fit">
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      <span>Connection Failed / CORS Blocked</span>
                    </div>

                    <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-900 rounded-xl text-xs space-y-2">
                      <div className="font-bold">Error Details:</div>
                      <pre className="bg-white/80 p-2.5 rounded border border-rose-100 font-mono text-[10px] text-rose-800 overflow-x-auto">
                        {testResults.errorMsg}
                      </pre>
                    </div>

                    <div className="p-5 bg-amber-50/70 border border-amber-100 text-amber-900 rounded-2xl text-xs space-y-3 leading-relaxed">
                      <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Action Required: Resolve CORS Blockage</span>
                      </div>
                      <p>
                        This "network error" means the Sanity servers rejected the request from your browser because <strong>http://localhost:3000</strong> is not whitelisted.
                      </p>
                      <h4 className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 mt-2">How to solve this:</h4>
                      <ol className="list-decimal pl-4 space-y-2 mt-1">
                        <li>Log into your Sanity account at <a href="https://www.sanity.io/manage" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950">sanity.io/manage</a></li>
                        <li>Click on your project (ID: <strong>{testResults.projectId}</strong>)</li>
                        <li>Go to the <strong>API</strong> tab in the navigation bar</li>
                        <li>Scroll to the <strong>CORS origins</strong> section</li>
                        <li>Click <strong>Add CORS origin</strong></li>
                        <li>Enter <code className="bg-white/90 px-1 py-0.5 rounded font-mono text-amber-950">http://localhost:3000</code> and check the <strong>"Allow credentials"</strong> checkbox (Crucial!)</li>
                        <li>Click <strong>Save</strong> and then click <strong>Retest Connection</strong> below!</li>
                      </ol>
                    </div>

                    <Button onClick={runConnectionTest} variant="outline" className="text-xs uppercase tracking-wider px-6 py-3 border-neutral-200">
                      Retest Connection
                    </Button>
                  </div>
                )}
              </div>

              {/* Status card */}
              <div className={`p-6 rounded-2xl mb-10 flex items-center justify-between border ${isConnected ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Connection Health</div>
                  <div className="text-base font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={isConnected ? faCheckCircle : faExclamationCircle} />
                    <span>{isConnected ? 'Sanity CMS Connected & Active' : 'Offline Mode (Local Fallback Dataset)'}</span>
                  </div>
                </div>
                <div className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded bg-white shadow-sm border border-neutral-100">
                  {isConnected ? 'Prod-ready' : 'Setup Required'}
                </div>
              </div>

              {/* Setup Instruction Steps */}
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Integration Steps</h3>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-900 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLaptopCode} className="text-neutral-400" />
                      <span>Configure local .env keys</span>
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                      Retrieve your project ID and dataset from your Sanity Dashboard and add them to the website's root `.env` file:
                    </p>
                    <pre className="bg-neutral-950 p-4 rounded-xl text-yellow text-[11px] font-mono border border-neutral-900 overflow-x-auto shadow-inner">
{`NEXT_PUBLIC_SANITY_PROJECT_ID="your_sanity_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"`}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-900 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faGear} className="text-neutral-400" />
                      <span>CORS Configuration</span>
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Make sure to whitelist your local domain <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[10px]">http://localhost:3000</code> in your Sanity project settings under the "API" tab (allow credentials enabled) to fetch content without CORS blocks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-900 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faDatabase} className="text-neutral-400" />
                      <span>Add documents</span>
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Go to the embedded <Link href="/studio" target="_blank" className="underline hover:text-black font-bold">Sanity Studio (/studio)</Link> to start writing products and matching the numeric IDs to see them automatically render live on the shop page!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
