"use client";

import { useState } from "react";
import { ComplaintItem } from "../types";
import { Lock, Unlock, Plus, X, MessageSquare, CheckCircle2, ShieldCheck, Key, AlertCircle } from "lucide-react";

interface ComplaintsViewProps {
  complaints: ComplaintItem[];
  onAddComplaint: (newComplaint: Omit<ComplaintItem, "id" | "createdAt" | "status" | "replies">) => void;
  isAdminLoggedIn: boolean;
}

export default function ComplaintsView({
  complaints,
  onAddComplaint,
  isAdminLoggedIn,
}: ComplaintsViewProps) {
  // 작성 모달 State
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");

  // 비공개 해제 비밀번호 인증 Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [inputPasscode, setInputPasscode] = useState("");
  const [unlockedIds, setUnlockedIds] = useState<Record<string, boolean>>({});
  const [passcodeError, setPasscodeError] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (isPrivate && (!passcode || passcode.length < 4)) {
      alert("비공개글은 4자리 이상 숫자 비밀번호를 설정해주세요.");
      return;
    }

    onAddComplaint({
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || "익명",
      isPrivate,
      passcode: isPrivate ? passcode.trim() : "",
    });

    // Reset Form
    setTitle("");
    setContent("");
    setAuthor("");
    setIsPrivate(false);
    setPasscode("");
    setIsWriteOpen(false);
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (inputPasscode === selectedComplaint.passcode || isAdminLoggedIn) {
      setUnlockedIds((prev) => ({ ...prev, [selectedComplaint.id]: true }));
      setSelectedComplaint(null);
      setInputPasscode("");
      setPasscodeError("");
    } else {
      setPasscodeError("비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 space-y-5 pb-10">
      {/* 상단 안내 & 등록 버튼 */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black tracking-wider bg-white/20 px-2.5 py-1 rounded-md uppercase">
            임원 24시간 소통창구
          </span>
          <h2 className="text-xl font-black mt-2">민원 & 건의함</h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            수련회 중 발생한 문제나 의견을 전달해주세요.
          </p>
        </div>
        <button
          onClick={() => setIsWriteOpen(true)}
          className="p-3 bg-white text-emerald-800 rounded-2xl font-bold shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 리스트 헤더 */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          등록된 민원 ({complaints.length})
        </h3>
        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
          🔒 비공개 암호 지원
        </span>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">아직 등록된 민원이 없습니다</p>
          <p className="text-xs text-slate-400">우측 상단 + 버튼을 눌러 첫 의견을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => {
            const isUnlocked = unlockedIds[item.id] || !item.isPrivate || isAdminLoggedIn;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* 헤더: 상태 & 공개 여부 & 시간 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === "resolved" ? (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        처리 완료
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md">
                        답변 대기
                      </span>
                    )}

                    {item.isPrivate ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100">
                        <Lock className="w-3 h-3" />
                        비공개
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Unlock className="w-3 h-3 text-slate-400" />
                        공개
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* 제목 (항상 공개) */}
                <div>
                  <h4 className="text-base font-black text-slate-800 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">작성자: {item.author || "익명"}</p>
                </div>

                {/* 내용 섹션 (비공개 처리) */}
                {isUnlocked ? (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm font-medium text-slate-700 whitespace-pre-wrap">
                    {item.content}
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setSelectedComplaint(item);
                      setPasscodeError("");
                    }}
                    className="bg-slate-100/80 hover:bg-slate-200/60 transition-colors rounded-2xl p-4 border border-dashed border-slate-300 text-center cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    <Lock className="w-5 h-5 text-rose-500" />
                    <p className="text-xs font-bold text-slate-700">비공개 민원글입니다</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      내용을 보려면 여기를 눌러 4자리 암호를 입력하세요 🔑
                    </p>
                  </div>
                )}

                {/* 관리자 댓글/답변 영역 */}
                {item.replies && item.replies.length > 0 && isUnlocked && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      임원진/관리자 답변
                    </p>
                    {item.replies.map((reply, rIdx) => (
                      <div
                        key={rIdx}
                        className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-100/80 text-xs text-slate-800"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-emerald-900">{reply.author || "임원진"}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="font-medium leading-relaxed">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 민원 작성 Modal */}
      {isWriteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">민원 작성하기</h3>
              <button
                onClick={() => setIsWriteOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">작성자 닉네임</label>
                <input
                  type="text"
                  placeholder="익명 또는 이름 입력"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="민원/건의 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">내용 *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="불편한 점이나 요청사항을 상세히 적어주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 공개/비공개 토글 */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-500" />
                    비공개 민원으로 등록
                  </span>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {isPrivate && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      4자리 숫자 비밀번호 설정 *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required={isPrivate}
                      placeholder="숫자 4자리 이상"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono tracking-widest text-center"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      * 본인 및 임원진만 이 비밀번호로 내용을 조회할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비공개글 해제 암호 입력 Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800">비공개 암호 입력</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                "{selectedComplaint.title}"
              </p>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-3">
              <input
                type="password"
                autoFocus
                placeholder="숫자 암호 입력"
                value={inputPasscode}
                onChange={(e) => setInputPasscode(e.target.value)}
                className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              {passcodeError && (
                <p className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passcodeError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl shadow-md cursor-pointer"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
