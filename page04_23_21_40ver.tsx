"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function Home() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // 1. 데이터 가져오기
    const scheduleRef = ref(db, "schedules");
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // 혹시 데이터가 객체면 배열로 변환, 배열이면 그대로 사용
        const list = Array.isArray(data) ? data : Object.values(data);
        setSchedules(list);
      }
      setLoading(false);
    });

    // 2. 현재 시간 실시간 업데이트 (HH:mm 형식)
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setCurrentTime(timeString);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // 진행 상태 판단 함수
  const getStatus = (startTime: string, endTime: string) => {
    if (!currentTime) return "waiting";
    if (currentTime >= startTime && currentTime < endTime) return "now";
    if (currentTime >= endTime) return "past";
    return "waiting";
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-bold">일정 동기화 중...</div>;

  return (
    <main className="min-h-screen bg-gray-100 font-sans pb-10">
      {/* 상단 헤더 */}
      <div className="bg-blue-600 p-8 text-white rounded-b-[2rem] shadow-xl mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">RETREAT 2026</h1>
            <p className="text-blue-100 mt-1 font-medium">실시간 수련회 가이드</p>
          </div>
          <div className="text-right">
            <span className="text-sm opacity-80 block mb-1">현재 시간</span>
            <span className="text-2xl font-mono font-bold bg-blue-700 px-3 py-1 rounded-lg">
              {currentTime}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 space-y-5">
        {schedules.map((item, index) => {
          const status = getStatus(item.startTime, item.endTime);
          
          return (
            <div 
              key={index} 
              className={`transition-all duration-500 rounded-2xl p-5 shadow-sm border-2 
                ${status === 'now' 
                  ? 'bg-white border-blue-500 ring-4 ring-blue-100 scale-105 z-10' 
                  : 'bg-white/70 border-transparent opacity-60'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-md 
                  ${status === 'now' ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                  {status === 'now' ? 'NOW' : item.date.split('-')[2] + '일'}
                </span>
                <span className="text-sm font-semibold text-gray-400">
                  {item.startTime} - {item.endTime}
                </span>
              </div>
              
              <h2 className={`text-xl font-extrabold ${status === 'now' ? 'text-blue-900' : 'text-gray-700'}`}>
                {item.title}
              </h2>
              
              {status === 'now' && (
                <div className="mt-4 py-2 border-t border-blue-50">
                  <p className="text-blue-600 text-sm font-bold">✨ 지금 진행 중인 프로그램입니다</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}