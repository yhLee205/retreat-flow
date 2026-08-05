"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, ChevronRight, RotateCcw } from "lucide-react";

interface GoldenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoldenTicketModal({ isOpen, onClose }: GoldenTicketModalProps) {
  const [step, setStep] = useState<"peel" | "revealing" | "revealed">("peel");
  const [isWinner, setIsWinner] = useState(false);
  const [peelProgress, setPeelProgress] = useState(0); // 0 ~ 100
  const isDragging = useRef(false);
  const startX = useRef(0);

  // 모달이 처음 띄워질 때(Mount 시점)의 시간을 바탕으로 초콜릿 속 당첨 여부를 미리 정함!
  useEffect(() => {
    if (isOpen) {
      const initialMountTime = Date.now();
      // 10명 중 1명 꼴 (10% 확률): 모달 뜬 순간의 timestamp % 10 === 0
      const preDeterminedWon = initialMountTime % 10 === 0;
      setIsWinner(preDeterminedWon);
      setStep("peel");
      setPeelProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Touch / Mouse Drag handlers for Horizontal Strip Peeling (왼쪽에서 띠지 벗기기)
  const handleStart = (clientX: number) => {
    if (step !== "peel") return;
    isDragging.current = true;
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current || step !== "peel") return;
    const diff = clientX - startX.current;
    const maxDistance = 220; // 220px drag to peel strip off
    const progress = Math.min(100, Math.max(0, (diff / maxDistance) * 100));
    setPeelProgress(progress);

    if (progress >= 85) {
      isDragging.current = false;
      triggerReveal();
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (peelProgress < 85) {
      setPeelProgress(0);
    }
  };

  const triggerReveal = () => {
    setStep("revealing");
    setTimeout(() => {
      setStep("revealed");
    }, 800);
  };

  const handleReset = () => {
    // 새로운 모달 열기처럼 다시 뜰 때의 시간으로 당첨 재설정
    const resetTime = Date.now();
    setIsWinner(resetTime % 10 === 0);
    setStep("peel");
    setPeelProgress(0);
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

        {/* 1단계: 왼쪽에서 띠지 벗기듯이 쭉 가로로 개봉하는 연출 */}
        {step === "peel" && (
          <div
            className="space-y-6 py-3 cursor-grab active:cursor-grabbing"
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
                RECREATION SPECIAL
              </span>
              <h3 className="text-xl font-black text-white mt-2">강화랜드 초콜릿</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                왼쪽에서 띠지를 쭉- 벗겨 초콜릿 속 초대장을 확인하세요!
              </p>
            </div>

            {/* 초콜릿 가로 띠지 벗기기 비주얼 카드 */}
            <div className="relative w-64 h-44 mx-auto rounded-2xl border-4 border-amber-700/80 shadow-2xl bg-amber-950 overflow-hidden flex flex-col justify-between">
              {/* 속지 (띠지 벗겨졌을 때 살짝 보이는 내부 황금/은빛 카드) */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 flex items-center justify-center">
                <span className="text-xs font-black text-amber-950 tracking-widest animate-pulse">
                  ✨ INVITATION INSIDE ✨
                </span>
              </div>

              {/* 상단 초콜릿 덮개 */}
              <div className="relative z-10 w-full h-[38%] bg-gradient-to-r from-amber-900 via-amber-950 to-red-950 border-b border-amber-800/80 flex items-center justify-center">
                <span className="text-sm font-black text-amber-200 tracking-wider">
                  GANGHWA LAND
                </span>
              </div>

              {/* 중앙 가로 띠지 (왼쪽에서 오른쪽으로 쭉 벗겨짐) */}
              <div className="relative z-20 w-full h-[24%] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 border-y-2 border-yellow-200 flex items-center overflow-hidden shadow-lg">
                <div
                  className="w-full h-full bg-red-800 text-amber-100 flex items-center justify-between px-3 text-xs font-black tracking-wider transition-all duration-75"
                  style={{
                    transform: `translateX(${peelProgress}%)`,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span>👈 띠지 당기기</span>
                  </span>
                  <ChevronRight className="w-4 h-4 animate-ping" />
                </div>
              </div>

              {/* 하단 초콜릿 덮개 */}
              <div className="relative z-10 w-full h-[38%] bg-gradient-to-r from-amber-900 via-amber-950 to-red-950 border-t border-amber-800/80 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-300/80">
                  SWEET RETREAT 2026
                </span>
              </div>
            </div>

            {/* 벗기기 게이지 바 */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-75 shadow-md"
                style={{ width: `${peelProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-amber-300 font-bold animate-pulse">
              👉 왼쪽에서 오른쪽으로 띠지를 가로로 쭉 당기세요!
            </p>
          </div>
        )}

        {/* 2단계: 개봉 연출 이펙트 */}
        {step === "revealing" && (
          <div className="py-16 space-y-4 animate-fade-in flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-ping opacity-80 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-amber-950" />
            </div>
            <h4 className="text-lg font-black text-amber-300 tracking-wider">
              초대장을 확인하는 중...
            </h4>
          </div>
        )}

        {/* 3단계: 미리 결정된 결과 공개 */}
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
                    <h3 className="text-2xl font-black tracking-tight text-amber-950 drop-shadow-sm">
                      강화랜드로의 초대장
                    </h3>
                  </div>

                  <div className="bg-amber-950/10 p-3.5 rounded-2xl border border-amber-950/20 text-xs font-bold leading-relaxed text-amber-950">
                    <p className="text-sm font-black text-amber-900 mb-1">🎉 VIP 골든티켓 당첨! 🎉</p>
                    <p>
                      강화랜드 VIP 골든티켓에 당첨되셨습니다!<br />
                      수련회 레크리에이션 시작 시 이 골든티켓 화면을 임원진에게 보여주시면{" "}
                      <span className="underline decoration-2 font-black">추가 포인트 혜택</span>이 부여됩니다!
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
                    <h3 className="text-xl font-black text-white">
                      강화랜드로의 초대장
                    </h3>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs text-slate-300 leading-relaxed font-medium">
                    강화랜드로의 일반 초대장입니다! ✉️<br />
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
