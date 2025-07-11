import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ParticipantCounter = ({ eventId, showDetails = true }) => {
  const [stats, setStats] = useState({
    total: 0,
    onsite: 0,
    online: 0,
    presenters: 0,
    recentRegistrations: []
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up polling for real-time updates
    const interval = setInterval(fetchStats, 5000);

    // Cleanup
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/stats`);
      const data = await response.json();

      if (data.total !== stats.total) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }

      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const CounterCard = ({ label, count, icon, color }) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-white rounded-xl p-4 shadow-lg border-2 border-${color}-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <motion.p
            key={count}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-3xl font-bold text-${color}-600`}
          >
            {count}
          </motion.p>
        </div>
        <div className={`text-4xl ${icon.includes('🎤') ? 'animate-bounce' : ''}`}>{icon}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Main counter */}
      <motion.div animate={isAnimating ? { scale: [1, 1.05, 1] } : {}} className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">現在の参加登録者数</h3>
        <motion.div
          key={stats.total}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center"
        >
          <span className="text-6xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            {stats.total}
          </span>
          <span className="text-3xl font-medium text-gray-600 ml-2">名</span>
        </motion.div>
      </motion.div>

      {showDetails && (
        <>
          {/* Detailed stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CounterCard label="会場参加" count={stats.onsite} icon="🏢" color="blue" />
            <CounterCard label="オンライン参加" count={stats.online} icon="💻" color="green" />
            <CounterCard label="発表者" count={stats.presenters} icon="🎤" color="purple" />
          </div>

          {/* Recent registrations */}
          {stats.recentRegistrations.length > 0 && (
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">最近の登録者</h4>
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {stats.recentRegistrations.slice(0, 3).map((reg, index) => (
                    <motion.div
                      key={reg.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-xl">
                          {reg.participationType === 'onsite' ? '🏢' : '💻'}
                        </span>
                        <span className="font-medium">{reg.name}</span>
                        {reg.isPresenter && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            発表者
                          </span>
                        )}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(reg.registeredAt).toLocaleTimeString('ja-JP')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {stats.total > 3 && (
                <p className="text-center text-xs text-gray-500 mt-3">
                  他 {stats.total - 3} 名が登録済み
                </p>
              )}
            </div>
          )}

          {/* Visual progress bar */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">定員まで</h4>
              <span className="text-sm text-gray-600">{stats.total} / 100名</span>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.total / 100) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              />
            </div>
            {stats.total >= 80 && (
              <p className="text-xs text-orange-600 mt-2 text-center animate-pulse">
                ⚠️ 残りわずか！お早めにご登録ください
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
