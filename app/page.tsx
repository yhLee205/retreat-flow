"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import defaultScheduleData from "@/schedule.json";
import { ScheduleItem } from "./types";

import Header from "./components/Header";
import DrawerMenu from "./components/DrawerMenu";
import ScheduleView from "./components/ScheduleView";
import MealView from "./components/MealView";
import ComplaintsView from "./components/ComplaintsView";
import LectureQaView from "./components/LectureQaView";
import AdminView from "./components/AdminView";

import { Calendar, Utensils, MessageSquare, HelpCircle, ShieldCheck } from "lucide-react";

export default function Home() {
  const defaultList: ScheduleItem[] = (
    (defaultScheduleData.schedules || []) as ScheduleItem[]
  ).sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const timeB = new Date(`${b.date}T${b.startTime}:00`).getTime();
    return timeA - timeB;
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(defaultList);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const scheduleRef = ref(db, "schedules");
    const unsubscribe = onValue(
      scheduleRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: ScheduleItem[] = Array.isArray(data) ? data : Object.values(data);
          setSchedules(
            list.sort((a, b) => {
              const timeA = new Date(`${a.date}T${a.startTime}:00`).getTime();
              const timeB = new Date(`${b.date}T${b.startTime}:00`).getTime();
              return timeA - timeB;
            })
          );
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firebase 일정 데이터를 가져오는 중 기본 schedule.json을 사용합니다:", error);
        setLoading(false);
      }
    );

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const renderActiveView = () => {
    switch (currentTab) {
      case "schedule":
        return <ScheduleView schedules={schedules} now={now} />;
      case "meals":
        return <MealView />;
      case "complaints":
        return <ComplaintsView isAdminLoggedIn={isAdminLoggedIn} />;
      case "lecture_qa":
        return <LectureQaView />;
      case "admin":
        return (
          <AdminView
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
          />
        );
      default:
        return <ScheduleView schedules={schedules} now={now} />;
    }
  };

  const navItems = [
    { id: "schedule", label: "일정", icon: Calendar },
    { id: "meals", label: "식단표", icon: Utensils },
    { id: "complaints", label: "임원24", icon: MessageSquare },
    { id: "lecture_qa", label: "Q&A", icon: HelpCircle },
    { id: "admin", label: "관리자", icon: ShieldCheck },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative overflow-x-hidden">
      {/* 상단 파란색 헤더 */}
      <Header
        currentTab={currentTab}
        now={now}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* 메인 콘텐츠 뷰 */}
      <div className="-mt-10 relative z-10">{renderActiveView()}</div>

      {/* 우측 슬라이드 메뉴 드로어 */}
      <DrawerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* 하단 고정 탭 바 (Mobile Bottom Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 max-w-md mx-auto px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-blue-600 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className={`text-[10px] mt-1 font-bold ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
