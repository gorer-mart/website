'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faBox, faHeart, faLocationDot, faArrowRight, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../ui/button';

const Account: React.FC = () => {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <title>My Account — Gorer Mart</title>
      <meta name="description" content="Manage your Gorer Mart account" />

      <div className="pt-24 pb-20 min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          
          {/* Dashboard Header with Cover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden mb-8"
          >
            {/* Subtle Cover Gradient */}
            <div className="h-32 bg-gradient-to-r from-neutral-900 to-neutral-800 relative">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </div>
            
            <div className="px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-12 space-y-6 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Avatar */}
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white relative z-10"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-neutral-300 relative z-10">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="text-center sm:text-left pb-2">
                    <h1 className="text-3xl font-display font-bold uppercase tracking-tighter">
                      {profile?.full_name || 'Gorer Mart Member'}
                    </h1>
                    <p className="text-neutral-500 font-medium">{profile?.email || user?.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pb-2">
                  <Button
                    variant="outline"
                    onClick={signOut}
                    className="flex items-center space-x-2 border-neutral-200 rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: faBox,
                title: 'Order History',
                description: 'Track and manage your recent purchases',
                href: '#',
              },
              {
                icon: faHeart,
                title: 'Saved Items',
                description: 'View products you\'ve favorited',
                href: '#',
              },
              {
                icon: faLocationDot,
                title: 'Address Book',
                description: 'Manage shipping and billing addresses',
                href: '#',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-neutral-100 hover:border-black hover:shadow-xl transition-all duration-500 cursor-pointer group relative overflow-hidden"
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                    <FontAwesomeIcon icon={faBox} className="text-xl" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-2">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.description}</p>
                </div>
                
                <div className="absolute bottom-8 right-8 text-neutral-300 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-black transition-all duration-500 z-10">
                  <FontAwesomeIcon icon={faArrowRight} className="text-xl" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
