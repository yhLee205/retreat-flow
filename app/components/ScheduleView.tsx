"use client";

import { ScheduleItem } from "../types";

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  now: Date;
}

export default function ScheduleView({ schedules, now }: ScheduleViewProps) {
  const nowMs = now.getTime();

  // 현재 / 다음 일정 찾기
  const currentItem = schedules.find((item) => {
    const start = new Date(`${item.date}T${item.startTime}:00`).getTime();
    const end = new Date(`${item.date}T${item.endTime}:00`).getTime();
    return nowMs >= start && nowMs < end;
  });

  const nextItem = schedules.find((item) => {
    const start = new Date(`${item.date}T${item.startTime}:00`).getTime();
    return start > nowMs;
  });

  // 진행도(%)
  const getProgress = (item: ScheduleItem) => {
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
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <div className="space-y-6">
      {/* 대시보드 */}
      <section className="max-w-md mx-auto px-5 space-y-4">
        {/* 현재 진행 중 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm tracking-wider animate-pulse">
              ON AIR
            </span>
            {currentItem && (
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                {currentItem.startTime} - {currentItem.endTime}
              </span>
            )}
          </div>

          {currentItem ? (
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{currentItem.title}</h3>
              {currentItem.note && (
                <p className="text-xs text-slate-500 mt-1 font-medium">{currentItem.note}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {Math.floor(getProgress(currentItem))}% 진행됨
                </span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 py-2">
              <h3 className="text-lg font-bold text-slate-400">현재 진행 중인 일정이 없습니다</h3>
              <p className="text-xs text-slate-400 mt-1">다음 일정을 확인해주세요</p>
            </div>
          )}

          {/* 진행도 배경 바 */}
          {currentItem && (
            <div
              className="absolute left-0 top-0 h-full bg-blue-50/90 -z-0 transition-all duration-1000 ease-linear"
              style={{ width: `${getProgress(currentItem)}%` }}
            />
          )}
        </div>

        {/* 다음 일정 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-md text-slate-500">
              NEXT
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {getNextRemaining()}
            </span>
          </div>
          {nextItem ? (
            <>
              <h4 className="text-lg font-bold text-slate-700">{nextItem.title}</h4>
              <p className="text-xs font-bold text-slate-400 mt-1">
                {nextItem.startTime} - {nextItem.endTime}
              </p>
            </>
          ) : (
            <h4 className="text-base font-bold text-slate-400 py-1">다음 일정이 없습니다</h4>
          )}
        </div>
      </section>

      {/* 전체 시간표 리스트 */}
      <section className="max-w-md mx-auto px-5 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Full Schedule
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{schedules.length}개 일정</span>
        </div>

        {Object.entries(groupedSchedules).map(([date, items]) => {
          const dateTitle = `${date.split("-")[1]}월 ${date.split("-")[2]}일`;

          return (
            <div key={date} className="space-y-3">
              <h2 className="text-base font-black text-slate-800 px-1 pt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                {dateTitle}
              </h2>

              <div className="space-y-3">
                {(items as ScheduleItem[]).map((item, idx) => {
                  const isNow = currentItem === item;
                  const isPast = new Date(`${item.date}T${item.endTime}:00`).getTime() <= nowMs;

                  return (
                    <div
                      key={idx}
                      className={`relative bg-white rounded-2xl p-5 border overflow-hidden transition-all duration-300
                        ${isNow ? "border-blue-500 shadow-md ring-2 ring-blue-100" : "border-slate-100 shadow-sm"}
                        ${isPast && !isNow ? "opacity-55 bg-slate-50/70" : "opacity-100"}`}
                    >
                      <div className="flex justify-between items-center relative z-10 mb-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                            isNow ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isNow ? "ON AIR" : `${date.split("-")[2]}일`}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <h4
                        className={`text-base font-bold relative z-10 ${
                          isNow ? "text-blue-900" : "text-slate-700"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.note && (
                        <p className="text-xs text-slate-400 mt-1 relative z-10">{item.note}</p>
                      )}

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
    </div>
  );
}
