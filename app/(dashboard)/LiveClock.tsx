'use client';
import { useEffect, useState } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-slate-500 font-medium font-mono text-sm" suppressHydrationWarning>{time}</span>;
}
