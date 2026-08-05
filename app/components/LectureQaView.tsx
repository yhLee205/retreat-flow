"use client";

import { useState } from "react";
import { LectureQaItem } from "../types";
import { HelpCircle, ThumbsUp, Plus, X, CheckCircle, MessageSquareQuote, Sparkles } from "lucide-react";

interface LectureQaViewProps {
  questions: LectureQaItem[];
  onAddQuestion: (newQa: Omit<LectureQaItem, "id" | "likes" | "createdAt">) => void;
  onLikeQuestion: (item: LectureQaItem) => void;
}

export default function LectureQaView({
  questions,
  onAddQuestion,
  onLikeQuestion,
}: LectureQaViewProps) {
  // 작성 Modal State
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [author, setAuthor] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    onAddQuestion({
      question: question.trim(),
      author: author.trim() || "익명 청년",
      lectureTitle: lectureTitle.trim() || "특강 / 집회",
    });

    setQuestion("");
    setAuthor("");
    setLectureTitle("");
    setIsWriteOpen(false);
  };

  const handleLike = (item: LectureQaItem) => {
    if (likedIds[item.id]) return;
    setLikedIds((prev) => ({ ...prev, [item.id]: true }));
    onLikeQuestion(item);
  };

  return (
    <div className="max-w-md mx-auto px-5 space-y-5 pb-10">
      {/* 상단 파플/헤더 카드 */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black tracking-wider bg-white/20 px-2.5 py-1 rounded-md uppercase flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            말씀 & 특강 Q&A
          </span>
          <h2 className="text-xl font-black mt-2">강의 질문함</h2>
          <p className="text-xs text-purple-200 mt-1 font-medium">
            수련회 특강시간 궁금한 점을 질문해보세요!
          </p>
        </div>
        <button
          onClick={() => setIsWriteOpen(true)}
          className="p-3 bg-white text-purple-900 rounded-2xl font-bold shadow-md hover:bg-purple-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 목록 헤더 */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          등록된 질문 ({questions.length})
        </h3>
        <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-lg">
          🔥 공감순 정렬
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">아직 질문이 없습니다</p>
          <p className="text-xs text-slate-400">목사님/강사님께 궁금한 점을 질문해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((item) => {
            const hasAnswer = Boolean(item.pastorAnswer);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* 상단 태그 & 상태 */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {item.lectureTitle || "특강 Q&A"}
                    </span>
                    {hasAnswer ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        답변 완료
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        답변 대기
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* 질문 내용 */}
                <div>
                  <h4 className="text-base font-bold text-slate-800 leading-relaxed">
                    Q. {item.question}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-medium">질문자: {item.author}</p>
                </div>

                {/* 공감(좋아요) 버튼 */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleLike(item)}
                    disabled={likedIds[item.id]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      likedIds[item.id]
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>공감해요 ({item.likes || 0})</span>
                  </button>
                </div>

                {/* 목사님/강사님 공식 답변 카드가 존재할 경우 */}
                {hasAnswer && (
                  <div className="bg-purple-50/90 rounded-2xl p-4 border border-purple-100 space-y-1.5 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
                      <MessageSquareQuote className="w-4 h-4 text-purple-600" />
                      <span>목사님 / 강사님의 답변</span>
                      {item.answeredAt && (
                        <span className="text-[10px] text-purple-400 font-normal ml-auto">
                          {new Date(item.answeredAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-purple-950 leading-relaxed whitespace-pre-wrap pl-1">
                      {item.pastorAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 질문 작성 Modal */}
      {isWriteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">특강 질문 남기기</h3>
              <button
                onClick={() => setIsWriteOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">특강 / 강사명 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 저녁 집회, 2일차 특강"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">작성자 닉네임</label>
                <input
                  type="text"
                  placeholder="익명 청년 또는 이름"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">질문 내용 *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="강의/설교 시 궁금한 점이나 나누고 싶은 고민을 적어주세요."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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
                  className="flex-1 py-3 text-sm font-bold text-white bg-purple-700 rounded-2xl hover:bg-purple-800 shadow-md cursor-pointer"
                >
                  질문 제출
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
