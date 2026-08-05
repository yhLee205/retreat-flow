"use client";

import { useState } from "react";
import { ComplaintItem, LectureQaItem, MealDay, MealItem } from "../types";
import GoldenTicketModal from "./GoldenTicketModal";
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
  Check,
  Clock,
  Sparkles,
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
  const [isGoldenTicketOpen, setIsGoldenTicketOpen] = useState(false);

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
    const code = adminCode.trim().toLowerCase();

    // 이스터에그 / 레크리에이션 골든티켓 코드 입력 시
    if (code === "rec2") {
      setIsGoldenTicketOpen(true);
      setErrorMsg("");
      return;
    }

    if (code === "s5jh" || code === "2026") {
      setIsAdminLoggedIn(true);
      setErrorMsg("");
    } else {
      setErrorMsg("비밀번호가 올바르지 않습니다.");
    }
  };

  // Stats calculation
  const pendingComplaintsCount = complaints.filter((c) => c.status !== "resolved").length;
  const resolvedComplaintsCount = complaints.filter((c) => c.status === "resolved").length;
  const answeredQuestionsCount = questions.filter((q) => Boolean(q.pastorAnswer)).length;

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
      { type: "점심", time: "12:00 - 13:00", menu: "식단 항목 작성", highlight: "" },
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

  // 1. 로그인 전 화면
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-5 space-y-6">
        <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-6 text-white border border-slate-800">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center border border-rose-500/30 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-black tracking-widest bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full uppercase border border-rose-500/30">
              OFFICIAL ADMIN
            </span>
            <h2 className="text-2xl font-black mt-3 text-white tracking-tight">임원진 관리자 센터</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              수련회 운영 관리를 위한 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-3.5 text-center text-lg font-mono tracking-widest bg-slate-800/90 text-white border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 bg-rose-950/60 p-3 rounded-xl border border-rose-800/60">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:from-rose-500 hover:to-rose-600 active:scale-95 transition-all cursor-pointer"
            >
              관리자 모드 접속
            </button>
          </form>
        </div>

        {/* 찰리와 초콜릿 공장 골든티켓 추첨 모달 */}
        <GoldenTicketModal
          isOpen={isGoldenTicketOpen}
          onClose={() => setIsGoldenTicketOpen(false)}
        />
      </div>
    );
  }

  // 2. 로그인 후 정식 관리자 화면
  return (
    <div className="max-w-md mx-auto px-5 space-y-6 pb-12">
      {/* 대시보드 상태 헤더 */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-md uppercase">
              ADMIN ACTIVE
            </span>
          </div>
          <button
            onClick={() => setIsAdminLoggedIn(false)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>

        <div>
          <h2 className="text-xl font-black text-white">수련회 종합 관리 대시보드</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            실시간 민원 처리, Q&A 답변 등록, 식단표 편집
          </p>
        </div>

        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-semibold">대기 중 민원</p>
            <p className="text-base font-black text-amber-400 mt-0.5">
              {pendingComplaintsCount}건
            </p>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-semibold">처리된 민원</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {resolvedComplaintsCount}건
            </p>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-semibold">답변된 Q&A</p>
            <p className="text-base font-black text-purple-400 mt-0.5">
              {answeredQuestionsCount}건
            </p>
          </div>
        </div>
      </div>

      {/* 깔끔한 메인 탭 전환 */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1 shadow-inner">
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "complaints"
              ? "bg-white text-emerald-900 shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          민원 관리 ({complaints.length})
        </button>

        <button
          onClick={() => setActiveTab("lecture_qa")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "lecture_qa"
              ? "bg-white text-purple-900 shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          Q&A 관리 ({questions.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("meals");
            setLocalMeals(mealDays);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "meals"
              ? "bg-white text-amber-900 shadow-md scale-[1.02]"
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
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              민원 목록 및 답변 등록
            </h3>
            <span className="text-xs text-slate-500 font-bold">총 {complaints.length}개</span>
          </div>

          {complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">등록된 민원이 없습니다</p>
              <p className="text-xs text-slate-400">청년들이 작성한 민원이 여기에 표시됩니다.</p>
            </div>
          ) : (
            complaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleComplaintStatus(item)}
                      className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        item.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      {item.status === "resolved" ? "✓ 처리 완료" : "⏳ 답변 대기 (클릭하여 완료)"}
                    </button>
                    {item.isPrivate && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100">
                        <Lock className="w-3 h-3" />
                        비공개 (암호: {item.passcode || "미지정"})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComplaint(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-800 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-medium whitespace-pre-wrap">
                    {item.content}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    작성자: {item.author || "익명"} |{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* 등록된 임원진 답변 리스트 */}
                {item.replies && item.replies.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      등록된 임원진 답변 ({item.replies.length})
                    </p>
                    {item.replies.map((reply, rIdx) => (
                      <div key={rIdx} className="bg-emerald-50/90 text-emerald-950 p-3 rounded-2xl text-xs font-medium border border-emerald-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-emerald-900">{reply.author || "임원진"}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 작성 폼 */}
                {replyingId === item.id ? (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="작성자명 (예: 회장, 사역팀)"
                        value={replyAuthor}
                        onChange={(e) => setReplyAuthor(e.target.value)}
                        className="w-1/3 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="답변 내용을 입력하세요..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-2/3 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setReplyingId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 font-bold bg-slate-200 rounded-xl cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleAddReply(item.id)}
                        className="px-4 py-1.5 text-xs text-white font-bold bg-emerald-600 rounded-xl flex items-center gap-1 shadow-sm cursor-pointer hover:bg-emerald-700"
                      >
                        <Send className="w-3 h-3" />
                        답변 등록
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingId(item.id)}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-emerald-100/60"
                  >
                    + 임원진 답변 등록하기
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
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              질문 목록 및 목사님 공식 답변 기록
            </h3>
            <span className="text-xs text-purple-600 font-bold">🔥 공감순 정렬</span>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">등록된 질문이 없습니다</p>
              <p className="text-xs text-slate-400">특강 질문이 등록되면 여기에 공감순으로 나열됩니다.</p>
            </div>
          ) : (
            questions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                    👍 공감 {item.likes || 0}개 | {item.lectureTitle || "특강 Q&A"}
                  </span>
                  <button
                    onClick={() => handleDeleteQa(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800">Q. {item.question}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-medium">질문자: {item.author}</p>
                </div>

                {/* 현재 등록된 목사님 답변 */}
                {item.pastorAnswer && (
                  <div className="bg-purple-50 p-3.5 rounded-2xl text-xs text-purple-950 font-medium border border-purple-100">
                    <p className="font-bold text-purple-900 flex items-center gap-1 mb-1">
                      <MessageSquareQuote className="w-4 h-4 text-purple-600" />
                      등록된 공식 답변:
                    </p>
                    <p className="whitespace-pre-wrap pl-1 leading-relaxed">{item.pastorAnswer}</p>
                  </div>
                )}

                {/* 목사님 답변 작성/수정 폼 */}
                {answeringQaId === item.id ? (
                  <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                    <textarea
                      rows={3}
                      placeholder="목사님/강사님이 집회나 특강에서 해주신 공식 답변을 작성해 주세요."
                      value={pastorAnswerText}
                      onChange={(e) => setPastorAnswerText(e.target.value)}
                      className="w-full p-3 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setAnsweringQaId(null)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-200 rounded-xl cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSavePastorAnswer(item.id)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-purple-700 rounded-xl shadow-sm cursor-pointer hover:bg-purple-800"
                      >
                        답변 저장하기
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAnsweringQaId(item.id);
                      setPastorAnswerText(item.pastorAnswer || "");
                    }}
                    className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-purple-100"
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
              className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
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
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {localMeals[selectedDayIdx].dayLabel} ({localMeals[selectedDayIdx].date}) 식단
                </h4>
                <button
                  onClick={() => handleAddMealItem(selectedDayIdx)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  식사 추가
                </button>
              </div>

              <div className="space-y-4">
                {localMeals[selectedDayIdx].items.map((meal, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 relative"
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
                        placeholder="메뉴 항목 (예: 제육볶음, 계란말이, 된장찌개)"
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

      {/* 찰리와 초콜릿 공장 골든티켓 추첨 모달 */}
      <GoldenTicketModal
        isOpen={isGoldenTicketOpen}
        onClose={() => setIsGoldenTicketOpen(false)}
      />
    </div>
  );
}
