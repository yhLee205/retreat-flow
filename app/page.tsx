"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, remove, update, get } from "firebase/database";
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

// ─── Firebase RTDB Helper: parse snapshot to sorted array ───
function parseComplaints(data: any): ComplaintItem[] {
  if (!data) return [];
  const list: ComplaintItem[] = Object.entries(data).map(([id, val]: [string, any]) => ({
    id,
    ...val,
    replies: val.replies ? (Array.isArray(val.replies) ? val.replies : Object.values(val.replies)) : [],
  }));
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

function parseQuestions(data: any): LectureQaItem[] {
  if (!data) return [];
  const list: LectureQaItem[] = Object.entries(data).map(([id, val]: [string, any]) => ({
    id,
    ...val,
  }));
  list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  return list;
}

// ─── Main Page Component ───
export default function Home() {
  // Schedule (from schedule.json only – single source of truth)
  const [schedules] = useState<ScheduleItem[]>(() =>
    ((defaultScheduleData.schedules || []) as ScheduleItem[]).sort((a, b) => {
      const tA = new Date(`${a.date}T${a.startTime}:00`).getTime();
      const tB = new Date(`${b.date}T${b.startTime}:00`).getTime();
      return tA - tB;
    })
  );

  const [now, setNow] = useState(new Date());
  const [currentTab, setCurrentTab] = useState<string>("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "permission_denied" | "connecting">("connecting");

  // ─── State ───
  const [mealDays, setMealDays] = useState<MealDay[]>(defaultMealData.meals as MealDay[]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [questions, setQuestions] = useState<LectureQaItem[]>([]);

  // ─── Firebase Realtime DB: THE ONLY data source ───
  useEffect(() => {
    // 1. Meals
    const mealsRef = ref(db, "meals");
    const unsubMeals = onValue(
      mealsRef,
      (snap) => {
        const data = snap.val();
        if (data) {
          setMealDays(Array.isArray(data) ? data : Object.values(data));
        }
        setFirebaseStatus("connected");
      },
      () => setFirebaseStatus("permission_denied")
    );

    // 2. Complaints
    const complaintsRef = ref(db, "complaints");
    const unsubComplaints = onValue(
      complaintsRef,
      (snap) => {
        setComplaints(parseComplaints(snap.val()));
        setFirebaseStatus("connected");
      },
      () => setFirebaseStatus("permission_denied")
    );

    // 3. Questions
    const qaRef = ref(db, "lecture_qa");
    const unsubQa = onValue(
      qaRef,
      (snap) => {
        setQuestions(parseQuestions(snap.val()));
        setFirebaseStatus("connected");
      },
      () => setFirebaseStatus("permission_denied")
    );

    // Timer
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      unsubMeals();
      unsubComplaints();
      unsubQa();
      clearInterval(timer);
    };
  }, []);

  // ─── Meals Handler ───
  const handleUpdateMeals = useCallback(async (newMeals: MealDay[]) => {
    setMealDays(newMeals); // optimistic
    try {
      await set(ref(db, "meals"), newMeals);
    } catch (err) {
      console.warn("Firebase meals write failed:", err);
    }
  }, []);

  // ─── Complaints Handlers (enterprise CRUD – individual operations) ───
  const handleAddComplaint = useCallback(
    async (data: Omit<ComplaintItem, "id" | "createdAt" | "status" | "replies">) => {
      const newRef = push(ref(db, "complaints"));
      const newPost = {
        title: data.title,
        content: data.content,
        author: data.author || "익명",
        isPrivate: data.isPrivate,
        passcode: data.passcode || "",
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      try {
        await set(newRef, newPost);
      } catch (err) {
        console.warn("Firebase complaint create failed:", err);
      }
    },
    []
  );

  const handleUpdateComplaints = useCallback(
    async (updatedList: ComplaintItem[]) => {
      // Detect DELETE: find items in current state that are missing from updatedList
      const updatedIds = new Set(updatedList.map((c) => c.id));
      for (const c of complaints) {
        if (!updatedIds.has(c.id)) {
          // DELETE this specific post
          try {
            await remove(ref(db, `complaints/${c.id}`));
          } catch (err) {
            console.warn("Firebase complaint delete failed:", err);
          }
          return; // Firebase listener will auto-update state
        }
      }

      // Detect REPLY or STATUS CHANGE on a specific post
      for (const item of updatedList) {
        const original = complaints.find((c) => c.id === item.id);
        if (!original) continue;

        const changes: Record<string, any> = {};

        // Status changed
        if (item.status !== original.status) {
          changes.status = item.status;
        }

        // New reply added
        const oldReplies = original.replies || [];
        const newReplies = item.replies || [];
        if (newReplies.length > oldReplies.length) {
          changes.replies = newReplies;
          changes.status = "resolved"; // auto-resolve on reply
        }

        if (Object.keys(changes).length > 0) {
          try {
            await update(ref(db, `complaints/${item.id}`), changes);
          } catch (err) {
            console.warn("Firebase complaint update failed:", err);
          }
          return; // Firebase listener will auto-update state
        }
      }
    },
    [complaints]
  );

  // ─── Q&A Handlers (enterprise CRUD – individual operations) ───
  const handleAddQuestion = useCallback(
    async (data: Omit<LectureQaItem, "id" | "likes" | "createdAt">) => {
      const newRef = push(ref(db, "lecture_qa"));
      const newQa = {
        question: data.question,
        author: data.author || "익명 청년",
        likes: 0,
        createdAt: new Date().toISOString(),
      };
      try {
        await set(newRef, newQa);
      } catch (err) {
        console.warn("Firebase question create failed:", err);
      }
    },
    []
  );

  const handleLikeQuestion = useCallback(async (item: LectureQaItem) => {
    try {
      // Atomic increment: read current value, increment, write back
      const qaItemRef = ref(db, `lecture_qa/${item.id}/likes`);
      const snap = await get(qaItemRef);
      const currentLikes = snap.val() || 0;
      await set(qaItemRef, currentLikes + 1);
    } catch (err) {
      console.warn("Firebase like failed:", err);
    }
  }, []);

  const handleUpdateQuestions = useCallback(
    async (updatedList: LectureQaItem[]) => {
      // Detect DELETE
      const updatedIds = new Set(updatedList.map((q) => q.id));
      for (const q of questions) {
        if (!updatedIds.has(q.id)) {
          try {
            await remove(ref(db, `lecture_qa/${q.id}`));
          } catch (err) {
            console.warn("Firebase question delete failed:", err);
          }
          return;
        }
      }

      // Detect pastor answer change
      for (const item of updatedList) {
        const original = questions.find((q) => q.id === item.id);
        if (!original) continue;

        if (item.pastorAnswer !== original.pastorAnswer) {
          try {
            await update(ref(db, `lecture_qa/${item.id}`), {
              pastorAnswer: item.pastorAnswer || "",
              answeredAt: new Date().toISOString(),
            });
          } catch (err) {
            console.warn("Firebase pastor answer failed:", err);
          }
          return;
        }
      }
    },
    [questions]
  );

  // ─── Render ───
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
      <Header currentTab={currentTab} now={now} onOpenMenu={() => setIsMenuOpen(true)} />
      <div className="-mt-10 relative z-10">{renderActiveView()}</div>
      <DrawerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isAdminLoggedIn={isAdminLoggedIn}
      />
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
