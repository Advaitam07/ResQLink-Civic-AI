import React, { useState, useEffect } from 'react';
import { CivicUser } from '../types';
import { Trophy, Award, Target, Star, Shield, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardProps {
  currentUserEmail: string;
}

export default function Leaderboard({ currentUserEmail }: LeaderboardProps) {
  const [users, setUsers] = useState<CivicUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/users/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Leaderboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const getRankBadge = (points: number, rankIndex: number) => {
    if (rankIndex === 0) return <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />;
    if (rankIndex === 1) return <Award className="h-4.5 w-4.5 text-slate-400 fill-slate-400/10" />;
    if (rankIndex === 2) return <Star className="h-4.5 w-4.5 text-orange-500 fill-orange-500/10" />;
    
    if (points >= 200) return <Shield className="h-4 w-4 text-emerald-500" title="Civic Guardian" />;
    if (points >= 100) return <Target className="h-4 w-4 text-indigo-500" title="Community Catalyst" />;
    return <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>;
  };

  const getRankTitle = (points: number) => {
    if (points >= 200) return "Civic Guardian";
    if (points >= 100) return "Community Catalyst";
    return "Local Observer";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0e111a] rounded-2xl border border-slate-200/50 dark:border-white/5 p-6 flex flex-col justify-center items-center h-80">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Acquiring municipal ranks...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0e111a] rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm flex flex-col h-full overflow-hidden font-sans">
      
      {/* Leaderboard Header */}
      <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/[0.04]">
        <h3 className="font-semibold text-slate-800 dark:text-white text-xs flex items-center gap-2">
          <Trophy className="h-4 w-4 text-indigo-500" />
          District Leaderboard
        </h3>
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
          Points generated via filing verified tickets, discussions, and upvote coordination.
        </p>
      </div>

      {/* Ranks List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 max-h-[350px]">
        {users.map((user, idx) => {
          const isCurrentUser = user.email.toLowerCase() === currentUserEmail.toLowerCase();
          return (
            <div
              key={user.email}
              className={`p-3.5 flex items-center justify-between transition-colors duration-150 ${
                isCurrentUser ? 'bg-indigo-500/[0.02]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.01]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Placement Rank Number */}
                <span className={`w-5 text-center text-xs font-bold font-mono ${
                  idx < 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  #{idx + 1}
                </span>

                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
                  isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-white/5'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* User details */}
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    {user.name}
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 rounded-md">
                        You
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-0.5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 rounded-md text-[9px]">
                      {getRankTitle(user.points)}
                    </span>
                    <span>&bull;</span>
                    <span>{user.reportsCount} filed</span>
                    {user.resolvedCount > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-500 font-bold">{user.resolvedCount} resolved</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges and Score */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center">
                  {getRankBadge(user.points, idx)}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {user.points}
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5 font-mono font-bold tracking-wide">PTS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gamification point reference legend */}
      <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center font-mono font-bold uppercase tracking-wide shrink-0">
        <span>Report: +50pts</span>
        <span>Comment: +15pts</span>
        <span>Vote: +10pts</span>
        <span className="text-emerald-500 font-bold">Resolved: +100pts</span>
      </div>
    </div>
  );
}
