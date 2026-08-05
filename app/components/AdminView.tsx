"use client";

import { useState } from "react";
import { ComplaintItem, LectureQaItem, MealDay, MealItem } from "../types";
import {
  Shield,
  Key,
  MessageSquare,
  HelpCircle,
  Utensils,
  CheckCircle2,
  Lock,
  Trash2,
  Send,
  LogOut,
  AlertCircle,
  MessageSquareQuote,
  Plus,
  Save,
} from "lucide-react";

interface AdminViewProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  complaints: ComplaintItem[];
  questions: LectureQaItem[];
  mealDays: MealDay[];
  onUpdateComplaints: (updated: ComplaintItem[]) => void;
  onUpdateQuestions: (updated: LectureQaItem[]) => void;
  onUpdateMeals: (updated: MealDay[]) => void;
}

export default function AdminView({
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  complaints,
  questions,
  mealDays,
  onUpdateComplaints,
  onUpdateQuestions,
  onUpdateMeals,
}: AdminViewProps) {
  const [adminCode, setAdminCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState<"complaints" | "lecture_qa" | "meals">("complaints");

  // Reply state for complaints
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("임원진");

  // Answer state for Q&A
  const [answeringQaId, setAnsweringQaId] = useState<string | null>(null);
  const [pastorAnswerText, setPastorAnswerText] = useState("");

  // Meal edit local working state
  const [localMeals, setLocalMeals] = useState<MealDay[]>(mealDays);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [mealSaveSuccess, setMealSaveSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === "2026" || adminCode === "admin1234") {
      setIsAdminLoggedIn(true);
      setErrorMsg("");
    } else {
      setErrorMsg("관리자 코드가 일치하지 않습니다. (기본코드: 2026)");
    }
  };

  // 민원 처리 상태 변경
  const handleToggleComplaintStatus = (item: ComplaintItem) => {
    const nextStatus: "pending" | "resolved" = item.status === "resolved" ? "pending" : "resolved";
    const updatedList = complaints.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c));
    onUpdateComplaints(updatedList);
  };

  // 민원 댓글/답변 작성
  const handleAddReply = (complaintId: string) => {
    if (!replyText.trim()) return;

    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return;

    const newReply = {
      id: Date.now().toString(),
      author: replyAuthor.trim() || "임원진",
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReplies = [...(target.replies || []), newReply];
    const updatedList = complaints.map((c) =>
      c.id === complaintId ? { ...c, replies: updatedReplies, status: "resolved" as const } : c
    );

    onUpdateComplaints(updatedList);
    setReplyingId(null);
    setReplyText("");
  };

  // 민원 삭제
  const handleDeleteComplaint = (id: string) => {
    if (!confirm("이 민원을 정말 삭제하시겠습니까?")) return;
    const updatedList = complaints.filter((c) => c.id !== id);
    onUpdateComplaints(updatedList);
  };

  // 목사님 특강 Q&A 답변 기록
  const handleSavePastorAnswer = (qaId: string) => {
    if (!pastorAnswerText.trim()) return;

    const updatedQuestions = questions.map((q) =>
      q.id === qaId
        ? { ...q, pastorAnswer: pastorAnswerText.trim(), answeredAt: new Date().toISOString() }
        : q
    );

    onUpdateQuestions(updatedQuestions);
    setAnsweringQaId(null);
    setPastorAnswerText("");
  };

  // 특강 Q&A 삭제
  const handleDeleteQa = (id: string) => {
    if (!confirm("이 질문을 삭제하시겠습니까?")) return;
    const updatedList = questions.filter((q) => q.id !== id);
    onUpdateQuestions(updatedList);
  };

  // 식단표 편집 핸들러
  const handleUpdateMealItem = (dayIdx: number, itemIdx: number, field: keyof MealItem, value: string) => {
    const newMealDays = [...localMeals];
    const newItems = [...newMealDays[dayIdx].items];
    newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
    newMealDays[dayIdx] = { ...newMealDays[dayIdx], items: newItems };
    setLocalMeals(newMealDays);
  };

  const handleAddMealItem = (dayIdx: number) => {
    const newMealDays = [...localMeals];
    const newItems = [
      ...newMealDays[dayIdx].items,
      { type: "점심", time: "12:00 - 13:00", menu: "새로운 식단 메뉴", highlight: "" },
    ];
    newMealDays[dayIdx] = { ...newMealDays[dayIdx], items: newItems };
    setLocalMeals(newMealDays);
  };

  const handleDeleteMealItem = (dayIdx: number, itemIdx: number) => {
    const newMealDays = [...localMeals];
    const newItems = newMealDays[dayIdx].items.filter((_, idx) => idx !== itemIdx);
    newMealDays[dayIdx] = { ...newMealDays[dayIdx], items: newItems };
    setLocalMeals(newMealDays);
  };

  const handleSaveMeals = () => {
    onUpdateMeals(localMeals);
    setMealSaveSuccess(true);
    setTimeout(() => setMealSaveSuccess(false), 3000);
  };

  // 1. 관리자 로그인 페이지
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-5 space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800">관리자 센터 로그인</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              임원진 및 사역자 전용 코드 인증이 필요합니다.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 text-left">
                관리자 인증 코드
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="관리자 코드 입력 (예: 2026)"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <Key className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              관리자 모드 접속
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            * 기본 설정 비밀번호는 <span className="font-mono font-bold text-rose-600">2026</span> 입니다.
          </p>
        </div>
      </div>
    );
  }

  // 2. 관리자 인증 완료 화면
  return (
    <div className="max-w-md mx-auto px-5 space-y-6 pb-12">
      {/* 관리자 상태 헤더 */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-md uppercase">
            ADMIN MODE
          </span>
          <h2 className="text-xl font-black mt-1">수련회 운영/관리</h2>
          <p className="text-xs text-slate-400 font-medium">민원 처리 & Q&A & 식단표 수정</p>
        </div>
        <button
          onClick={() => setIsAdminLoggedIn(false)}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {/* 탭 버튼 (민원 / Q&A / 식단표) */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "complaints"
              ? "bg-white text-emerald-900 shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          민원 ({complaints.length})
        </button>

        <button
          onClick={() => setActiveTab("lecture_qa")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "lecture_qa"
              ? "bg-white text-purple-900 shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          Q&A ({questions.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("meals");
            setLocalMeals(mealDays);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "meals"
              ? "bg-white text-amber-900 shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-600" />
          식단표 수정
        </button>
      </div>

      {/* 탭 1: 민원 관리 */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
            민원 및 건의사항 처리
          </h3>

          {complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-slate-400 font-bold text-sm">
              처리할 민원이 없습니다.
            </div>
          ) : (
            complaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleComplaintStatus(item)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-md cursor-pointer ${
                        item.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "resolved" ? "✓ 처리 완료" : "⏳ 답변 대기 (클릭시 변경)"}
                    </button>
                    {item.isPrivate && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        암호: {item.passcode || "미지정"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComplaint(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {item.content}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    작성자: {item.author || "익명"} |{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* 댓글 목록 */}
                {item.replies && item.replies.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500">등록된 답변 목록:</p>
                    {item.replies.map((reply, rIdx) => (
                      <div key={rIdx} className="bg-emerald-50 text-emerald-950 p-2.5 rounded-xl text-xs font-medium">
                        <span className="font-bold text-emerald-900">{reply.author}: </span>
                        {reply.content}
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 작성 폼 */}
                {replyingId === item.id ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="작성자명 (예: 회장, 임원진)"
                        value={replyAuthor}
                        onChange={(e) => setReplyAuthor(e.target.value)}
                        className="w-1/3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="답변 내용을 입력하세요..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-2/3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setReplyingId(null)}
                        className="px-3 py-1 text-xs text-slate-500 font-bold bg-slate-200 rounded-lg cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleAddReply(item.id)}
                        className="px-3 py-1 text-xs text-white font-bold bg-emerald-600 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        답변 등록
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingId(item.id)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    + 임원진 답변/댓글 추가하기
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 탭 2: 특강 Q&A 관리 */}
      {activeTab === "lecture_qa" && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
            특강 질문 관리 및 목사님 답변 등록
          </h3>

          {questions.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-slate-400 font-bold text-sm">
              등록된 특강 질문이 없습니다.
            </div>
          ) : (
            questions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                    👍 공감 {item.likes || 0}개 | {item.lectureTitle || "특강 Q&A"}
                  </span>
                  <button
                    onClick={() => handleDeleteQa(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800">Q. {item.question}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">질문자: {item.author}</p>
                </div>

                {/* 현재 등록된 답변 */}
                {item.pastorAnswer && (
                  <div className="bg-purple-50 p-3 rounded-2xl text-xs text-purple-950 font-medium">
                    <p className="font-bold text-purple-900 flex items-center gap-1 mb-1">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      등록된 공식 답변:
                    </p>
                    <p className="whitespace-pre-wrap">{item.pastorAnswer}</p>
                  </div>
                )}

                {/* 목사님 답변 작성/수정 폼 */}
                {answeringQaId === item.id ? (
                  <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200 space-y-2">
                    <textarea
                      rows={3}
                      placeholder="목사님/강사님이 해주신 공식 답변을 입력해 기록해주세요."
                      value={pastorAnswerText}
                      onChange={(e) => setPastorAnswerText(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setAnsweringQaId(null)}
                        className="px-3 py-1 text-xs font-bold text-slate-500 bg-slate-200 rounded-lg cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSavePastorAnswer(item.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-purple-700 rounded-lg shadow-sm cursor-pointer"
                      >
                        답변 저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAnsweringQaId(item.id);
                      setPastorAnswerText(item.pastorAnswer || "");
                    }}
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {item.pastorAnswer ? "✏️ 목사님 답변 수정하기" : "+ 목사님 답변 기록하기"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 탭 3: 식단표 관리 */}
      {activeTab === "meals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              수련회 식단표 편집기
            </h3>
            <button
              onClick={handleSaveMeals}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              식단표 저장
            </button>
          </div>

          {mealSaveSuccess && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              식단표가 성공적으로 저장되었습니다!
            </div>
          )}

          {/* 일자 선택 탭 */}
          <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
            {localMeals.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedDayIdx === idx ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
                }`}
              >
                {day.dayLabel}
              </button>
            ))}
          </div>

          {/* 선택된 날짜 식단 수정 폼 */}
          {localMeals[selectedDayIdx] && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {localMeals[selectedDayIdx].dayLabel} ({localMeals[selectedDayIdx].date}) 식단 항목
                </h4>
                <button
                  onClick={() => handleAddMealItem(selectedDayIdx)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  식사 항목 추가
                </button>
              </div>

              <div className="space-y-4">
                {localMeals[selectedDayIdx].items.map((meal, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 w-full max-w-[240px]">
                        <select
                          value={meal.type}
                          onChange={(e) =>
                            handleUpdateMealItem(selectedDayIdx, itemIdx, "type", e.target.value)
                          }
                          className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-xl"
                        >
                          <option value="아침">아침</option>
                          <option value="점심">점심</option>
                          <option value="저녁">저녁</option>
                          <option value="야식">야식</option>
                          <option value="간식">간식</option>
                        </select>
                        <input
                          type="text"
                          placeholder="시간 (예: 08:00 - 09:00)"
                          value={meal.time}
                          onChange={(e) =>
                            handleUpdateMealItem(selectedDayIdx, itemIdx, "time", e.target.value)
                          }
                          className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-xl font-bold flex-1"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteMealItem(selectedDayIdx, itemIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        식단 메뉴 목록
                      </label>
                      <input
                        type="text"
                        placeholder="메뉴 항목 (쉼표로 구분)"
                        value={meal.menu}
                        onChange={(e) =>
                          handleUpdateMealItem(selectedDayIdx, itemIdx, "menu", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-600 mb-0.5">
                        특식 / 하이라이트 태그 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="예: 웰컴 바비큐 정식, 🔥 BBQ 파티"
                        value={meal.highlight || ""}
                        onChange={(e) =>
                          handleUpdateMealItem(selectedDayIdx, itemIdx, "highlight", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-indigo-700 font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
