"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

import defaultScheduleData from "@/schedule.json";

export default function Home() {
  const defaultList = (defaultScheduleData.schedules || []).sort((a: any, b: any) => {
    const timeA = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const timeB = new Date(`${b.date}T${b.startTime}:00`).getTime();
    return timeA - timeB;
  });

  const [schedules, setSchedules] = useState<any[]>(defaultList);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const scheduleRef = ref(db, "schedules");
    const unsubscribe = onValue(
      scheduleRef,
      (snapshot) => {
        clearTimeout(fallbackTimeout);
        const data = snapshot.val();
        if (data) {
          const list = Array.isArray(data) ? data : Object.values(data);
          setSchedules(
            list.sort((a: any, b: any) => {
              const timeA = new Date(`${a.date}T${a.startTime}:00`).getTime();
              const timeB = new Date(`${b.date}T${b.startTime}:00`).getTime();
              return timeA - timeB;
            })
          );
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firebase 데이터 로드 오류, 기본 schedule.json을 사용합니다:", error);
        clearTimeout(fallbackTimeout);
        setLoading(false);
      }
    );
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const nowMs = now.getTime();

  // 현재 / 다음 일정 찾기
  const currentItem = schedules.find(item => {
    const start = new Date(`${item.date}T${item.startTime}:00`).getTime();
    const end = new Date(`${item.date}T${item.endTime}:00`).getTime();
    return nowMs >= start && nowMs < end;
  });

  const nextItem = schedules.find(item => {
    const start = new Date(`${item.date}T${item.startTime}:00`).getTime();
    return start > nowMs;
  });

  // 진행도(%)
  const getProgress = (item: any) => {
    if (!item) return 0;
    const start = new Date(`${item.date}T${item.startTime}:00`).getTime();
    const end = new Date(`${item.date}T${item.endTime}:00`).getTime();
    return Math.min(100, Math.max(0, ((nowMs - start) / (end - start)) * 100));
  };

  // 다음 일정 남은 시간
  const getNextRemaining = () => {
    if (!nextItem) return "";
    const start = new Date(`${nextItem.date}T${nextItem.startTime}:00`).getTime();
    const diffMs = start - nowMs;
    if (diffMs <= 0) return "곧 시작";
    
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diffMs / (1000 * 60)) % 60);
    
    if (d > 0) return `D-${d} ${h}시간 후`;
    if (h > 0) return `${h}시간 ${m}분 후`;
    return `${m}분 후`;
  };

  const groupedSchedules = schedules.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading && schedules.length === 0) return <div className="p-10 text-center font-bold text-slate-500">로딩 중...</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 상단 파란색 헤더 */}
      <section className="bg-blue-600 pt-8 pb-20 px-6 rounded-b-[2rem] shadow-sm relative">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-xs font-bold text-blue-200 tracking-widest uppercase">2026 Retreat</h1>
            <h2 className="text-2xl font-black text-white mt-1">청년부 수련회</h2>
          </div>
          <div className="text-sm font-mono font-bold text-white bg-black/10 px-3 py-1.5 rounded-lg tracking-widest">
            {now.toLocaleTimeString('en-GB')}
          </div>
        </div>
      </section>

      {/* 대시보드 (하얀색 카드로 롤백) */}
      <section className="max-w-md mx-auto px-5 -mt-12 space-y-4 relative z-10">
        
        {/* 현재 진행 중 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
              ON AIR
            </span>
            {currentItem && (
              <span className="text-xs font-bold text-slate-400">
                {currentItem.startTime} - {currentItem.endTime}
              </span>
            )}
          </div>
          
          {currentItem ? (
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{currentItem.title}</h3>
              <p className="text-xs font-bold text-blue-500 mt-2">{Math.floor(getProgress(currentItem))}% 진행됨</p>
            </div>
          ) : (
            <h3 className="text-lg font-bold text-slate-400 py-2">현재 진행 중인 일정이 없습니다</h3>
          )}

          {/* 진행도 배경 바 */}
          {currentItem && (
            <div 
              className="absolute left-0 top-0 h-full bg-blue-50 -z-0 transition-all duration-1000 ease-linear"
              style={{ width: `${getProgress(currentItem)}%` }}
            />
          )}
        </div>

        {/* 다음 일정 카드 (까만색 삭제 -> 하얀색 깔끔한 디자인으로 복구) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-md text-slate-500">NEXT</span>
            <span className="text-xs font-bold text-blue-600">{getNextRemaining()}</span>
          </div>
          {nextItem ? (
            <>
              <h4 className="text-lg font-bold text-slate-700">{nextItem.title}</h4>
              <p className="text-xs font-bold text-slate-400 mt-1">{nextItem.startTime} - {nextItem.endTime}</p>
            </>
          ) : (
            <h4 className="text-base font-bold text-slate-400 py-1">다음 일정이 없습니다</h4>
          )}
        </div>
      </section>

      {/* 전체 시간표 리스트 */}
      <section className="max-w-md mx-auto px-5 mt-10 space-y-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
          Full Schedule
        </h3>
        
        {Object.entries(groupedSchedules).map(([date, items]) => {
          const dateTitle = `${date.split('-')[1]}월 ${date.split('-')[2]}일`;
          
          return (
            <div key={date} className="space-y-3">
              <h2 className="text-base font-black text-slate-700 px-1 pt-2">
                {dateTitle}
              </h2>
              
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const isNow = currentItem === item;
                  const isPast = new Date(`${item.date}T${item.endTime}:00`).getTime() <= nowMs;

                  return (
                    <div 
                      key={idx} 
                      className={`relative bg-white rounded-2xl p-5 border overflow-hidden transition-all duration-300
                        ${isNow ? 'border-blue-400 shadow-md' : 'border-slate-100 shadow-sm'}
                        ${isPast && !isNow ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <div className="flex justify-between items-center relative z-10 mb-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md 
                          ${isNow ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {isNow ? 'ON AIR' : `${date.split('-')[2]}일`}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{item.startTime} - {item.endTime}</span>
                      </div>
                      <h4 className={`text-base font-bold relative z-10 ${isNow ? 'text-blue-900' : 'text-slate-600'}`}>
                        {item.title}
                      </h4>

                      {isNow && (
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-50/80 -z-0 transition-all duration-1000 ease-linear"
                          style={{ width: `${getProgress(item)}%` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}