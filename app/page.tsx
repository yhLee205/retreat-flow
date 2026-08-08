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

  const [schedules, setSchedules] = useState<ScheduleItem[]>(defaultList);
  const [now, setNow] = useState(new Date());

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Firebase Status ("connected" | "permission_denied" | "connecting")
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "permission_denied" | "connecting">("connecting");

  // Central States
  const [mealDays, setMealDays] = useState<MealDay[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("retreat_meals");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultMealData.meals as MealDay[];
  });

  const [complaints, setComplaints] = useState<ComplaintItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("retreat_complaints");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [questions, setQuestions] = useState<LectureQaItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("retreat_lecture_qa");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  // Fetch latest global meals, complaints, questions from API routes on mount
  useEffect(() => {
    // Meals
    fetch("/api/meals")
      .then((res) => res.json())
      .then((data) => {
        if (data.meals && Array.isArray(data.meals)) {
          if (typeof window !== "undefined") {
            const localSaved = localStorage.getItem("retreat_meals");
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  fetch("/api/meals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meals: parsed }),
                  }).catch(() => {});
                  setMealDays(parsed);
                  return;
                }
              } catch (e) {}
            }
          }
          setMealDays(data.meals);
        }
      })
      .catch((err) => console.warn("API /api/meals fetch failed:", err));

    // Complaints
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((data) => {
        if (data.complaints && Array.isArray(data.complaints)) {
          if (typeof window !== "undefined") {
            const localSaved = localStorage.getItem("retreat_complaints");
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  fetch("/api/complaints", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ complaints: parsed }),
                  }).catch(() => {});
                  setComplaints(parsed);
                  return;
                }
              } catch (e) {}
            }
          }
          setComplaints(data.complaints);
        }
      })
      .catch((err) => console.warn("API /api/complaints fetch failed:", err));

    // Questions
    fetch("/api/lecture_qa")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && Array.isArray(data.questions)) {
          if (typeof window !== "undefined") {
            const localSaved = localStorage.getItem("retreat_lecture_qa");
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  fetch("/api/lecture_qa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questions: parsed }),
                  }).catch(() => {});
                  setQuestions(parsed);
                  return;
                }
              } catch (e) {}
            }
          }
          setQuestions(data.questions);
        }
      })
      .catch((err) => console.warn("API /api/lecture_qa fetch failed:", err));
  }, []);

  // Sync with Firebase RTDB
  useEffect(() => {
    // 1. Schedules
    const scheduleRef = ref(db, "schedules");
    const unsubSchedule = onValue(
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
        setFirebaseStatus("connected");
      },
      (error: any) => {
        console.warn("Firebase Schedules Permission Warning:", error);
        if (error?.message?.includes("permission_denied") || error?.code?.includes("PERMISSION_DENIED")) {
          setFirebaseStatus("permission_denied");
        }
      }
    );

    // 2. Meals
    const mealsRef = ref(db, "meals");
    const unsubMeals = onValue(
      mealsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Array.isArray(data) ? data : Object.values(data);
          setMealDays(list as MealDay[]);
          if (typeof window !== "undefined") {
            localStorage.setItem("retreat_meals", JSON.stringify(list));
          }
        }
        setFirebaseStatus("connected");
      },
      (error) => {
        console.warn("Firebase Meals Permission Warning:", error);
        setFirebaseStatus("permission_denied");
      }
    );

    // 3. Complaints
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
          if (typeof window !== "undefined") {
            localStorage.setItem("retreat_complaints", JSON.stringify(list));
          }
        }
      },
      (error) => console.warn("Firebase Complaints Permission Warning:", error)
    );

    // 4. Questions
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
          if (typeof window !== "undefined") {
            localStorage.setItem("retreat_lecture_qa", JSON.stringify(list));
          }
        }
      },
      (error) => console.warn("Firebase Q&A Permission Warning:", error)
    );

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      unsubSchedule();
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
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_meals", JSON.stringify(newMeals));
    }

    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: newMeals }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/meals error:", apiErr);
    }

    try {
      await set(ref(db, "meals"), newMeals);
      setFirebaseStatus("connected");
    } catch (err: any) {
      console.warn("Firebase 식단표 저장 시도 실패 -> 서버 API 및 로컬 저장소 적용:", err);
      setFirebaseStatus("permission_denied");
    }
  };

  // Add Complaint globally
  const handleAddComplaint = async (
    data: Omit<ComplaintItem, "id" | "createdAt" | "status" | "replies">
  ) => {
    const newItem: ComplaintItem = {
      id: "cp_" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      status: "pending",
      replies: [],
    };

    const updatedList = [newItem, ...complaints];
    setComplaints(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_complaints", JSON.stringify(updatedList));
    }

    // 1. Post to Server API Route
    try {
      await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: newItem }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/complaints error:", apiErr);
    }

    // 2. Post to Firebase RTDB
    try {
      const complaintsRef = ref(db, "complaints");
      const pushRef = push(complaintsRef);
      await set(pushRef, {
        title: newItem.title,
        content: newItem.content,
        author: newItem.author,
        isPrivate: newItem.isPrivate,
        passcode: newItem.passcode,
        createdAt: newItem.createdAt,
        status: newItem.status,
        replies: [],
      });
      setFirebaseStatus("connected");
    } catch (err) {
      console.warn("Firebase 민원 등록 실패 -> 서버 API 및 로컬 저장 완료:", err);
    }
  };

  // Update Complaints globally (Admin replies, status change, delete)
  const handleUpdateComplaints = async (updatedList: ComplaintItem[]) => {
    setComplaints(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_complaints", JSON.stringify(updatedList));
    }

    // 1. Post to Server API Route
    try {
      await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints: updatedList }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/complaints error:", apiErr);
    }

    // 2. Post to Firebase RTDB
    const firebaseObj: Record<string, any> = {};
    updatedList.forEach((item) => {
      firebaseObj[item.id] = {
        title: item.title,
        content: item.content,
        author: item.author || "익명",
        isPrivate: item.isPrivate,
        passcode: item.passcode || "",
        createdAt: item.createdAt,
        status: item.status,
        replies: item.replies || [],
      };
    });

    try {
      await set(ref(db, "complaints"), firebaseObj);
    } catch (err) {
      console.warn("Firebase 민원 업데이트 실패 -> 서버 API 적용 완료:", err);
    }
  };

  // Add Question globally
  const handleAddQuestion = async (
    data: Omit<LectureQaItem, "id" | "likes" | "createdAt">
  ) => {
    const newItem: LectureQaItem = {
      id: "qa_" + Date.now(),
      ...data,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newItem, ...questions];
    setQuestions(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_lecture_qa", JSON.stringify(updatedList));
    }

    // 1. Post to Server API Route
    try {
      await fetch("/api/lecture_qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newItem }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/lecture_qa error:", apiErr);
    }

    // 2. Post to Firebase RTDB
    try {
      const qaRef = ref(db, "lecture_qa");
      const pushRef = push(qaRef);
      await set(pushRef, {
        question: newItem.question,
        author: newItem.author,
        lectureTitle: newItem.lectureTitle,
        likes: newItem.likes,
        createdAt: newItem.createdAt,
      });
    } catch (err) {
      console.warn("Firebase 질문 등록 실패 -> 서버 API 및 로컬 저장 완료:", err);
    }
  };

  // Like Question globally
  const handleLikeQuestion = async (item: LectureQaItem) => {
    const updatedList = questions.map((q) =>
      q.id === item.id ? { ...q, likes: (q.likes || 0) + 1 } : q
    );
    setQuestions(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_lecture_qa", JSON.stringify(updatedList));
    }

    // 1. Post to Server API Route
    try {
      await fetch("/api/lecture_qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedList }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/lecture_qa error:", apiErr);
    }

    // 2. Post to Firebase RTDB
    try {
      const firebaseObj: Record<string, any> = {};
      updatedList.forEach((q) => {
        firebaseObj[q.id] = q;
      });
      await set(ref(db, "lecture_qa"), firebaseObj);
    } catch (err) {
      console.warn("Firebase 좋아요 저장 실패 -> 서버 API 및 로컬 저장 완료:", err);
    }
  };

  // Update Questions globally (Admin Pastor Answer, Delete)
  const handleUpdateQuestions = async (updatedList: LectureQaItem[]) => {
    setQuestions(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("retreat_lecture_qa", JSON.stringify(updatedList));
    }

    // 1. Post to Server API Route
    try {
      await fetch("/api/lecture_qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedList }),
      });
    } catch (apiErr) {
      console.warn("API POST /api/lecture_qa error:", apiErr);
    }

    // 2. Post to Firebase RTDB
    const firebaseObj: Record<string, any> = {};
    updatedList.forEach((q) => {
      firebaseObj[q.id] = q;
    });

    try {
      await set(ref(db, "lecture_qa"), firebaseObj);
    } catch (err) {
      console.warn("Firebase 질문 목록 업데이트 실패 -> 서버 API 적용 완료:", err);
    }
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
