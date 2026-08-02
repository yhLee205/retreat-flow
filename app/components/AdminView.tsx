"use client";

import { useState, useEffect } from "react";
import { ComplaintItem, LectureQaItem } from "../types";
import { db } from "@/lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import {
  Shield,
  Key,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Lock,
  Trash2,
  Send,
  LogOut,
  AlertCircle,
  MessageSquareQuote,
} from "lucide-react";

interface AdminViewProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

export default function AdminView({ isAdminLoggedIn, setIsAdminLoggedIn }: AdminViewProps) {
  const [adminCode, setAdminCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState<"complaints" | "lecture_qa">("complaints");

  // Data
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [questions, setQuestions] = useState<LectureQaItem[]>([]);

  // Reply state for complaints
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("임원진");

  // Answer state for Q&A
  const [answeringQaId, setAnsweringQaId] = useState<string | null>(null);
  const [pastorAnswerText, setPastorAnswerText] = useState("");

  useEffect(() => {
    // Listen to Firebase RTDB for Admin management
    const complaintsRef = ref(db, "complaints");
    const unsubscribeComplaints = onValue(complaintsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: ComplaintItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComplaints(list);
      } else {
        setComplaints([]);
      }
    });

    const qaRef = ref(db, "lecture_qa");
    const unsubscribeQa = onValue(qaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: LectureQaItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        setQuestions(list);
      } else {
        setQuestions([]);
      }
    });

    return () => {
      unsubscribeComplaints();
      unsubscribeQa();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin passcode "2026"
    if (adminCode === "2026" || adminCode === "admin1234") {
      setIsAdminLoggedIn(true);
      setErrorMsg("");
    } else {
      setErrorMsg("관리자 코드가 일치하지 않습니다. (기본코드: 2026)");
    }
  };

  // 민원 처리 상태 변경
  const handleToggleComplaintStatus = async (item: ComplaintItem) => {
    const nextStatus = item.status === "resolved" ? "pending" : "resolved";
    try {
      await update(ref(db, `complaints/${item.id}`), { status: nextStatus });
    } catch (err) {
      console.error("상태 변경 오류:", err);
    }
  };

  // 민원 댓글/답변 작성
  const handleAddReply = async (complaintId: string) => {
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

    try {
      await update(ref(db, `complaints/${complaintId}`), {
        replies: updatedReplies,
        status: "resolved", // 답변 작성 시 자동으로 처리 완료 변경
      });
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      console.error("답변 작성 오류:", err);
    }
  };

  // 민원 삭제
  const handleDeleteComplaint = async (id: string) => {
    if (!confirm("이 민원을 정말 삭제하시겠습니까?")) return;
    try {
      await remove(ref(db, `complaints/${id}`));
    } catch (err) {
      console.error("삭제 오류:", err);
    }
  };

  // 목사님 특강 Q&A 답변 기록
  const handleSavePastorAnswer = async (qaId: string) => {
    if (!pastorAnswerText.trim()) return;
    try {
      await update(ref(db, `lecture_qa/${qaId}`), {
        pastorAnswer: pastorAnswerText.trim(),
        answeredAt: new Date().toISOString(),
      });
      setAnsweringQaId(null);
      setPastorAnswerText("");
    } catch (err) {
      console.error("Q&A 답변 저장 오류:", err);
    }
  };

  // 특강 Q&A 삭제
  const handleDeleteQa = async (id: string) => {
    if (!confirm("이 질문을 삭제하시겠습니까?")) return;
    try {
      await remove(ref(db, `lecture_qa/${id}`));
    } catch (err) {
      console.error("삭제 오류:", err);
    }
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
          <p className="text-xs text-slate-400 font-medium">실시간 민원 답변 & 특강 질문 정리</p>
        </div>
        <button
          onClick={() => setIsAdminLoggedIn(false)}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {/* 탭 버튼 (임원24 민원 vs 특강Q&A) */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1.5">
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "complaints"
              ? "bg-white text-emerald-900 shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          임원24 민원 ({complaints.length})
        </button>

        <button
          onClick={() => setActiveTab("lecture_qa")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "lecture_qa"
              ? "bg-white text-purple-900 shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 text-purple-600" />
          특강 Q&A ({questions.length})
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
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
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
                        className="px-3 py-1 text-xs text-slate-500 font-bold bg-slate-200 rounded-lg"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleAddReply(item.id)}
                        className="px-3 py-1 text-xs text-white font-bold bg-emerald-600 rounded-lg flex items-center gap-1 shadow-sm"
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
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
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
                        className="px-3 py-1 text-xs font-bold text-slate-500 bg-slate-200 rounded-lg"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSavePastorAnswer(item.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-purple-700 rounded-lg shadow-sm"
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
    </div>
  );
}
