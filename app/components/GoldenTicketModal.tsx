"use client";

import { useState, useRef } from "react";
import { Sparkles, X, ChevronRight, RotateCcw } from "lucide-react";

interface GoldenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoldenTicketModal({ isOpen, onClose }: GoldenTicketModalProps) {
  const [step, setStep] = useState<"tear" | "revealing" | "revealed">("tear");
  const [isWinner, setIsWinner] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 0 ~ 100
  const isDragging = useRef(false);
  const startX = useRef(0);

  if (!isOpen) return null;

  // Touch / Mouse Drag handlers for Blue Archive Tear Effect
  const handleStart = (clientX: number) => {
    if (step !== "tear") return;
    isDragging.current = true;
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current || step !== "tear") return;
    const diff = clientX - startX.current;
    const maxDistance = 200; // 200px drag to open
    const progress = Math.min(100, Math.max(0, (diff / maxDistance) * 100));
    setDragProgress(progress);

    if (progress >= 85) {
      isDragging.current = false;
      triggerReveal();
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragProgress < 85) {
      setDragProgress(0); // reset if not dragged enough
    }
  };

  const triggerReveal = () => {
    setStep("revealing");

    // 비밀 계산: 서버시간 Date.now() % 10 === 0 일 때 당첨 (UI에는 노출 X)
    const nowMs = Date.now();
    const won = nowMs % 10 === 0;

    setTimeout(() => {
      setIsWinner(won);
      setStep("revealed");
    }, 1000);
  };

  const handleReset = () => {
    setStep("tear");
    setIsWinner(false);
    setDragProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center text-white overflow-hidden space-y-6">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1단계: 블루아카이브 스타일 손으로 슬라이드/찢기 연출 */}
        {step === "tear" && (
          <div
            className="space-y-6 py-4 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
          >
            <div>
              <span className="text-[10px] font-black tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
                RECREATION GACHA
              </span>
              <h3 className="text-xl font-black text-white mt-2">찰리의 초콜릿 공장</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                손가락으로 슥- 밀어서 초콜릿 봉투를 개봉하세요!
              </p>
            </div>

            {/* 블루아카이브 스타일 봉투 & 찢어지는 연출 용기 */}
            <div className="relative w-64 h-40 mx-auto overflow-hidden rounded-2xl border-2 border-amber-600/80 shadow-2xl bg-amber-950 flex items-center justify-center">
              {/* 빛줄기 배경 (드래그 할수록 밝아짐) */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 transition-opacity duration-150"
                style={{ opacity: dragProgress / 100 }}
              />

              {/* 좌측 봉투 조각 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-br from-amber-900 via-red-950 to-amber-950 border-r-2 border-dashed border-amber-400 flex flex-col justify-center items-end pr-3 transition-transform duration-75 shadow-md"
                style={{
                  transform: `translateX(-${dragProgress * 0.7}%) rotate(-${dragProgress * 0.15}deg)`,
                }}
              >
                <span className="text-lg font-black text-amber-200 tracking-wider">CHARLIE</span>
              </div>

              {/* 우측 봉투 조각 */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-bl from-amber-900 via-red-950 to-amber-950 border-l-2 border-dashed border-amber-400 flex flex-col justify-center items-start pl-3 transition-transform duration-75 shadow-md"
                style={{
                  transform: `translateX(${dragProgress * 0.7}%) rotate(${dragProgress * 0.15}deg)`,
                }}
              >
                <span className="text-lg font-black text-amber-200 tracking-wider">CHOCO</span>
              </div>

              {/* 중앙 슬라이드 가이드선 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-amber-400/90 text-amber-950 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg animate-pulse">
                  <span>우측으로 슬라이드</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 슬라이드 진행 바 */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-75 shadow-md"
                style={{ width: `${dragProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-amber-300 font-bold animate-pulse">
              👉 화면을 오른쪽으로 길게 당기면 갈라지면서 개봉됩니다
            </p>
          </div>
        )}

        {/* 2단계: 블루아카이브 스타일 갈라지는 빛 이펙트 */}
        {step === "revealing" && (
          <div className="py-16 space-y-4 animate-fade-in flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-ping opacity-75 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-amber-950" />
            </div>
            <h4 className="text-lg font-black text-amber-300 tracking-wider">
              초콜릿 봉투 개봉 중...
            </h4>
          </div>
        )}

        {/* 3단계: 티켓 결과 공개 */}
        {step === "revealed" && (
          <div className="space-y-5 py-2 animate-fade-in">
            {isWinner ? (
              <div className="space-y-4">
                {/* 🏆 GOLDEN TICKET CARD */}
                <div className="animate-gold-shimmer animate-pulse-glow text-amber-950 p-6 rounded-3xl border-4 border-yellow-300 shadow-2xl relative overflow-hidden text-center space-y-3">
                  <div className="flex justify-center items-center gap-1.5 text-xs font-black tracking-widest uppercase bg-amber-950/20 py-1 px-3.5 rounded-full w-fit mx-auto">
                    <Sparkles className="w-4 h-4 text-amber-900" />
                    GOLDEN TICKET
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-900 tracking-wider">찰리와 초콜릿 공장</p>
                    <h3 className="text-2xl font-black tracking-tight text-amber-950 drop-shadow-sm">
                      강화랜드로의 초대장
                    </h3>
                  </div>

                  <div className="bg-amber-950/10 p-3.5 rounded-2xl border border-amber-950/20 text-xs font-bold leading-relaxed text-amber-950">
                    <p className="text-sm font-black text-amber-900 mb-1">🎉 VIP 골든티켓 당첨! 🎉</p>
                    <p>
                      수련회 레크리에이션 시작 시 이 골든티켓 화면을 임원진에게 보여주시면{" "}
                      <span className="underline decoration-2">추가 포인트 혜택</span>이 부여됩니다!
                    </p>
                  </div>

                  <p className="text-[10px] font-mono font-bold text-amber-900/80 tracking-widest pt-1">
                    OFFICIAL INVITATION: GT-2026-VIP
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ✉️ 일반 초대장 CARD */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="flex justify-center items-center gap-1.5 text-[11px] font-black tracking-widest uppercase bg-slate-700/60 px-3 py-0.5 rounded-full w-fit mx-auto text-slate-300">
                    STANDARD INVITATION
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400">찰리와 초콜릿 공장</p>
                    <h3 className="text-xl font-black text-white">
                      강화랜드로의 초대장
                    </h3>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs text-slate-300 leading-relaxed font-medium">
                    찰리와 초콜릿 공장의 은빛 일반 초대장입니다! ✉️<br />
                    레크리에이션에 참여하여 즐거운 시간을 보내세요! 🍫
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  다시 개봉하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
