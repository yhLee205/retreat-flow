"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set } from "firebase/database";
import defaultScheduleData from "@/schedule.json";
import defaultMealData from "@/meals.json";
import { ScheduleItem, MealDay, ComplaintItem, LectureQaItem } from "./types";

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

  const [schedules] = useState<ScheduleItem[]>(defaultList);
  const [now, setNow] = useState(new Date());

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Firebase Status ("connected" | "permission_denied" | "connecting")
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "permission_denied" | "connecting">("connecting");

  // Central States (Server-driven, no local array overrides)
  const [mealDays, setMealDays] = useState<MealDay[]>(defaultMealData.meals as MealDay[]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [questions, setQuestions] = useState<LectureQaItem[]>([]);

  // Helper to fetch server data (Single Source of Truth)
  const syncWithServerApi = () => {
    // 1. Meals
    fetch("/api/meals")
      .then((res) => res.json())
      .then((data) => {
        if (data.meals && Array.isArray(data.meals)) {
          setMealDays(data.meals);
        }
      })
      .catch((err) => console.warn("API /api/meals fetch error:", err));

    // 2. Complaints (DC Inside style board API)
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((data) => {
        if (data.complaints && Array.isArray(data.complaints)) {
          setComplaints(data.complaints);
        }
      })
      .catch((err) => console.warn("API /api/complaints fetch error:", err));

    // 3. Questions (DC Inside style board API)
    fetch("/api/lecture_qa")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      })
      .catch((err) => console.warn("API /api/lecture_qa fetch error:", err));
  };

  // 1. On Mount & 3-Second Real-Time Polling for Multi-Device Live Sync
  useEffect(() => {
    syncWithServerApi(); // Initial sync on page load

    const pollInterval = setInterval(() => {
      syncWithServerApi();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // 2. Sync with Firebase RTDB if available
  useEffect(() => {
    // Overwrite Firebase /schedules with clean schedule.json if writable
    set(ref(db, "schedules"), defaultList).catch(() => {});

    // Meals
    const mealsRef = ref(db, "meals");
    const unsubMeals = onValue(
      mealsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Array.isArray(data) ? data : Object.values(data);
          setMealDays(list as MealDay[]);
        }
        setFirebaseStatus("connected");
      },
      (error) => console.warn("Firebase Meals Permission Warning:", error)
    );

    // Complaints
    const complaintsRef = ref(db, "complaints");
    const unsubComplaints = onValue(
      complaintsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: ComplaintItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value,
          }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setComplaints(list);
        }
      },
      (error) => console.warn("Firebase Complaints Permission Warning:", error)
    );

    // Questions
    const qaRef = ref(db, "lecture_qa");
    const unsubQa = onValue(
      qaRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: LectureQaItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value,
          }));
          list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          setQuestions(list);
        }
      },
      (error) => console.warn("Firebase Q&A Permission Warning:", error)
    );

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      unsubMeals();
      unsubComplaints();
      unsubQa();
      clearInterval(timer);
    };
  }, []);

  // --- Handlers ---

  // Update Meals globally
  const handleUpdateMeals = async (newMeals: MealDay[]) => {
    setMealDays(newMeals);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: newMeals }),
      });
      const data = await res.json();
      if (data.meals) setMealDays(data.meals);
    } catch (apiErr) {
      console.warn("API POST /api/meals error:", apiErr);
    }

    try {
      await set(ref(db, "meals"), newMeals);
      setFirebaseStatus("connected");
    } catch (err: any) {
      console.warn("Firebase 식단표 저장 시도 실패 -> 서버 API 적용 완료:", err);
      setFirebaseStatus("permission_denied");
    }
  };

  // Add Complaint globally (Action: create)
  const handleAddComplaint = async (
    data: Omit<ComplaintItem, "id" | "createdAt" | "status" | "replies">
  ) => {
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: data.title,
          content: data.content,
          author: data.author,
          isPrivate: data.isPrivate,
          passcode: data.passcode,
        }),
      });
      const resData = await res.json();
      if (resData.complaints) {
        setComplaints(resData.complaints);
      }
    } catch (apiErr) {
      console.warn("API POST /api/complaints action:create error:", apiErr);
    }
  };

  // Update Complaints globally (Detect delete, reply, or status toggle)
  const handleUpdateComplaints = async (updatedList: ComplaintItem[]) => {
    // Detect deletion
    if (updatedList.length < complaints.length) {
      const currentIds = new Set(updatedList.map((c) => c.id));
      const deletedItem = complaints.find((c) => !currentIds.has(c.id));
      if (deletedItem) {
        try {
          const res = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id: deletedItem.id }),
          });
          const resData = await res.json();
          if (resData.complaints) setComplaints(resData.complaints);
          return;
        } catch (err) {
          console.warn("API action:delete error:", err);
        }
      }
    }

    // Detect reply or status change
    for (const item of updatedList) {
      const original = complaints.find((c) => c.id === item.id);
      if (!original) continue;

      // New reply added
      if ((item.replies || []).length > (original.replies || []).length) {
        const lastReply = item.replies![item.replies!.length - 1];
        try {
          const res = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reply",
              id: item.id,
              author: lastReply.author,
              content: lastReply.content,
            }),
          });
          const resData = await res.json();
          if (resData.complaints) setComplaints(resData.complaints);
          return;
        } catch (err) {
          console.warn("API action:reply error:", err);
        }
      }

      // Status toggled
      if (item.status !== original.status) {
        try {
          const res = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle_status", id: item.id }),
          });
          const resData = await res.json();
          if (resData.complaints) setComplaints(resData.complaints);
          return;
        } catch (err) {
          console.warn("API action:toggle_status error:", err);
        }
      }
    }

    setComplaints(updatedList);
  };

  // Add Question globally (Action: create)
  const handleAddQuestion = async (
    data: Omit<LectureQaItem, "id" | "likes" | "createdAt">
  ) => {
    try {
      const res = await fetch("/api/lecture_qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          question: data.question,
          author: data.author,
        }),
      });
      const resData = await res.json();
      if (resData.questions) {
        setQuestions(resData.questions);
      }
    } catch (apiErr) {
      console.warn("API POST /api/lecture_qa action:create error:", apiErr);
    }
  };

  // Like Question globally (Action: like)
  const handleLikeQuestion = async (item: LectureQaItem) => {
    try {
      const res = await fetch("/api/lecture_qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", id: item.id }),
      });
      const resData = await res.json();
      if (resData.questions) {
        setQuestions(resData.questions);
      }
    } catch (apiErr) {
      console.warn("API POST /api/lecture_qa action:like error:", apiErr);
    }
  };

  // Update Questions globally (Detect delete or pastor answer)
  const handleUpdateQuestions = async (updatedList: LectureQaItem[]) => {
    // Detect deletion
    if (updatedList.length < questions.length) {
      const currentIds = new Set(updatedList.map((q) => q.id));
      const deletedItem = questions.find((q) => !currentIds.has(q.id));
      if (deletedItem) {
        try {
          const res = await fetch("/api/lecture_qa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id: deletedItem.id }),
          });
          const resData = await res.json();
          if (resData.questions) setQuestions(resData.questions);
          return;
        } catch (err) {
          console.warn("API action:delete QA error:", err);
        }
      }
    }

    // Detect pastor answer
    for (const item of updatedList) {
      const original = questions.find((q) => q.id === item.id);
      if (!original) continue;

      if (item.pastorAnswer !== original.pastorAnswer) {
        try {
          const res = await fetch("/api/lecture_qa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "pastor_answer",
              id: item.id,
              pastorAnswer: item.pastorAnswer,
            }),
          });
          const resData = await res.json();
          if (resData.questions) setQuestions(resData.questions);
          return;
        } catch (err) {
          console.warn("API action:pastor_answer error:", err);
        }
      }
    }

    setQuestions(updatedList);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case "schedule":
        return <ScheduleView schedules={schedules} now={now} />;
      case "meals":
        return <MealView mealDays={mealDays} />;
      case "complaints":
        return (
          <ComplaintsView
            complaints={complaints}
            onAddComplaint={handleAddComplaint}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        );
      case "lecture_qa":
        return (
          <LectureQaView
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onLikeQuestion={handleLikeQuestion}
          />
        );
      case "admin":
        return (
          <AdminView
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
            complaints={complaints}
            questions={questions}
            mealDays={mealDays}
            firebaseStatus={firebaseStatus}
            onUpdateComplaints={handleUpdateComplaints}
            onUpdateQuestions={handleUpdateQuestions}
            onUpdateMeals={handleUpdateMeals}
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
      {/* 상단 헤더 */}
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
