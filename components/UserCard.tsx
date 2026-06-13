'use client';

import { useState, useEffect } from 'react';

interface UserCardProps {
  username: string;
}

interface LeetCodeData {
  username: string;
  solvedToday: boolean;
  currentStreak: number;
  totalSolved: number;
  stats: { difficulty: string; count: number; submissions: number }[];
}

export default function UserCard({ username }: UserCardProps) {
  const [data, setData] = useState<LeetCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/leetcode/${username}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('Could not fetch data');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-lc-border/30 rounded w-1/3 mb-4" />
        <div className="h-4 bg-lc-border/30 rounded w-2/3 mb-2" />
        <div className="h-4 bg-lc-border/30 rounded w-1/2" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-xl p-6 border-lc-red/30">
        <p className="text-lc-red">{error || 'Failed to load data'}</p>
      </div>
    );
  }

  const easy = data.stats.find((s) => s.difficulty === 'Easy')?.count || 0;
  const medium = data.stats.find((s) => s.difficulty === 'Medium')?.count || 0;
  const hard = data.stats.find((s) => s.difficulty === 'Hard')?.count || 0;

  return (
    <div className="glass-card rounded-xl p-6 neon-border hover:scale-[1.02] transition-transform">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lc-orange to-neon-orange flex items-center justify-center text-black font-bold text-lg">
            {data.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white">{data.username}</h3>
            <a
              href={`https://leetcode.com/u/${data.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-lc-orange hover:underline"
            >
              View Profile -&gt;
            </a>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
            data.solvedToday
              ? 'bg-lc-green/20 text-lc-green border border-lc-green/30'
              : 'bg-lc-red/20 text-lc-red border border-lc-red/30 animate-pulse'
          }`}
        >
          {data.solvedToday ? 'Solved Today' : 'Not Solved Today'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-lc-darker/60 rounded-lg">
          <p className="text-2xl font-bold text-lc-orange">
            {data.currentStreak}
          </p>
          <p className="text-xs text-gray-500">Streak</p>
        </div>
        <div className="text-center p-3 bg-lc-darker/60 rounded-lg">
          <p className="text-2xl font-bold text-white">{data.totalSolved}</p>
          <p className="text-xs text-gray-500">Total Solved</p>
        </div>
        <div className="text-center p-3 bg-lc-darker/60 rounded-lg">
          <p className="text-2xl font-bold text-lc-red">{hard}</p>
          <p className="text-xs text-gray-500">Hard</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span className="text-lc-green">Easy: {easy}</span>
          <span className="text-lc-yellow">Medium: {medium}</span>
          <span className="text-lc-red">Hard: {hard}</span>
        </div>
        <div className="h-2 rounded-full bg-lc-darker flex overflow-hidden">
          {data.totalSolved > 0 && (
            <>
              <div
                className="bg-lc-green h-full"
                style={{ width: `${(easy / data.totalSolved) * 100}%` }}
              />
              <div
                className="bg-lc-yellow h-full"
                style={{ width: `${(medium / data.totalSolved) * 100}%` }}
              />
              <div
                className="bg-lc-red h-full"
                style={{ width: `${(hard / data.totalSolved) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
