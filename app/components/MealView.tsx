"use client";

import { useState } from "react";
import { MealDay, MealItem } from "../types";
import { Utensils, Coffee, Moon, Sun, Flame, Sparkles } from "lucide-react";

interface MealViewProps {
  mealDays: MealDay[];
}

export default function MealView({ mealDays }: MealViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const activeDay = mealDays[selectedDayIndex] || mealDays[0] || { dayLabel: "", date: "", items: [] };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "아침":
        return <Sun className="w-5 h-5 text-amber-500" />;
      case "점심":
        return <Utensils className="w-5 h-5 text-blue-500" />;
      case "저녁":
        return <Flame className="w-5 h-5 text-rose-500" />;
      case "야식":
        return <Moon className="w-5 h-5 text-indigo-500" />;
      default:
        return <Coffee className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getMealBadgeColor = (type: string) => {
    switch (type) {
      case "아침":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "점심":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "저녁":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "야식":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 space-y-6">
      {/* 날짜 선택 탭 */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1.5 shadow-inner">
        {mealDays.map((day, idx) => (
          <button
            key={day.date || idx}
            onClick={() => setSelectedDayIndex(idx)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
              selectedDayIndex === idx
                ? "bg-white text-blue-900 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {day.dayLabel}
          </button>
        ))}
      </div>

      {/* 날짜 타이틀 */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-black text-slate-800">{activeDay.dayLabel} 식단</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{activeDay.date}</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
          맛있는 밥상 🍱
        </span>
      </div>

      {/* 식단 카드 리스트 */}
      <div className="space-y-4">
        {activeDay.items && activeDay.items.length > 0 ? (
          activeDay.items.map((meal: MealItem, idx: number) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    {getMealIcon(meal.type)}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${getMealBadgeColor(
                        meal.type
                      )}`}
                    >
                      {meal.type}
                    </span>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">{meal.time}</p>
                  </div>
                </div>

                {meal.highlight && (
                  <div className="flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{meal.highlight}</span>
                  </div>
                )}
              </div>

              {/* 메뉴 내용 */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/80">
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  {meal.menu}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 font-bold border border-slate-100">
            등록된 식단이 없습니다.
          </div>
        )}
      </div>

      {/* 원산지 / 안내 카드 */}
      <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 text-center space-y-1">
        <p className="text-xs text-blue-800 font-bold">💡 식사 관련 안내</p>
        <p className="text-[11px] text-blue-600 font-medium leading-normal">
          식단 변경이나 식단표 수정은 <strong>[관리자 센터 &gt; 식단표 수정]</strong>에서 가능합니다.
        </p>
      </div>
    </div>
  );
}
