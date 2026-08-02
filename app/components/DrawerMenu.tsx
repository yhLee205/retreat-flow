"use client";

import { X, Calendar, Utensils, MessageSquare, HelpCircle, ShieldCheck, ChevronRight, Check } from "lucide-react";

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
}

export default function DrawerMenu({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  isAdminLoggedIn,
}: DrawerMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: "schedule",
      label: "수련회 일정표",
      subtitle: "실시간 타임라인 & 프로그램",
      icon: Calendar,
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "meals",
      label: "식단표",
      subtitle: "날짜별 아침/점심/저녁/야식",
      icon: Utensils,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "complaints",
      label: "임원 24 (민원함)",
      subtitle: "공개/비공개 불편사항 & 건의",
      icon: MessageSquare,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "lecture_qa",
      label: "특강 Q&A",
      subtitle: "특강 & 집회 질문 등록",
      icon: HelpCircle,
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      id: "admin",
      label: "관리자 페이지",
      subtitle: isAdminLoggedIn ? "인증됨 (관리자 모드)" : "민원 처리 & 질문 답변 등록",
      icon: ShieldCheck,
      badgeColor: isAdminLoggedIn ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-in Menu Panel */}
      <div className="relative z-10 w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">수련회 메뉴</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Retreat Navigation</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.01]"
                      : "hover:bg-slate-100/80 text-slate-700 active:scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isSelected ? "bg-white/20 text-white" : item.badgeColor
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{item.label}</span>
                        {item.id === "admin" && isAdminLoggedIn && (
                          <span className="text-[10px] bg-emerald-400 text-white px-1.5 py-0.5 rounded font-black">
                            ON
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 font-medium ${
                          isSelected ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-xs font-semibold text-slate-400">2026 Youth Retreat Flow App</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Realtime Firebase Connected</p>
        </div>
      </div>
    </div>
  );
}
