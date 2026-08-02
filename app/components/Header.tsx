"use client";

import { useEffect, useState } from "react";
import { Menu, Sparkles } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  now: Date;
  onOpenMenu: () => void;
}

export default function Header({ currentTab, now, onOpenMenu }: HeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTitle = () => {
    switch (currentTab) {
      case "schedule":
        return "청년부 수련회";
      case "meals":
        return "수련회 식단표";
      case "complaints":
        return "임원 24 (민원함)";
      case "lecture_qa":
        return "특강 Q&A";
      case "admin":
        return "관리자 센터";
      default:
        return "2026 RETREAT";
    }
  };

  const getSubtitle = () => {
    switch (currentTab) {
      case "schedule":
        return "실시간 타임라인 가이드";
      case "meals":
        return "맛있는 식사 & 간식 안내";
      case "complaints":
        return "불편사항 & 칭찬 건의하기";
      case "lecture_qa":
        return "특강 & 집회 질문 등록하기";
      case "admin":
        return "임원진 / 사역자 전용 관리";
      default:
        return "Retreat Flow";
    }
  };

  const timeString = mounted
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 pt-7 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative text-white">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>2026 RETREAT</span>
          </div>
          <h1 className="text-2.5xl font-black tracking-tight text-white">{getTitle()}</h1>
          <p className="text-xs text-blue-100/90 font-medium mt-0.5">{getSubtitle()}</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            suppressHydrationWarning
            className="text-xs font-mono font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-inner tracking-wider"
          >
            {timeString}
          </div>
          <button
            onClick={onOpenMenu}
            aria-label="메뉴 열기"
            className="p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl border border-white/25 shadow-md flex items-center justify-center cursor-pointer"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
