"use client";

import { useState } from "react";
import { Sparkles, Trophy, Gift, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface GoldenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoldenTicketModal({ isOpen, onClose }: GoldenTicketModalProps) {
  const [step, setStep] = useState<"wrapper" | "opening" | "revealed">("wrapper");
  const [isWinner, setIsWinner] = useState(false);
  const [serverTimeDigit, setServerTimeDigit] = useState<number>(0);
  const [serverTimestamp, setServerTimestamp] = useState<number>(0);

  if (!isOpen) return null;

  const handleOpenChocolate = () => {
    setStep("opening");

    // 10명 중 1명 꼴 추첨: 서버시간(Date.now()) 맨 뒷자리 10으로 나눠 0인 경우 당첨!
    const nowMs = Date.now();
    const digit = nowMs % 10;
    setServerTimestamp(nowMs);
    setServerTimeDigit(digit);

    // 10% 확률 (digit === 0 일 때 당첨)
    const won = digit === 0;

    setTimeout(() => {
      setIsWinner(won);
      setStep("revealed");
    }, 1200);
  };

  const handleReset = () => {
    setStep("wrapper");
    setIsWinner(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center text-white overflow-hidden space-y-5">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1단계: 포장된 초콜릿 카드 */}
        {step === "wrapper" && (
          <div className="space-y-5 py-4 animate-fade-in">
            <div className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              RECREATION SPECIAL
            </div>

            <div className="w-48 h-32 mx-auto bg-gradient-to-br from-amber-900 via-amber-950 to-red-950 rounded-2xl border-4 border-amber-600/80 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                 onClick={handleOpenChocolate}>
              <div className="absolute inset-0 bg-yellow-500/10 opacity-30 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:8px_8px]" />
              <div className="w-full bg-amber-600/90 text-amber-950 py-1 font-black text-xs tracking-widest uppercase shadow-md">
                WONKA RETREAT
              </div>
              <p className="text-2xl mt-2 font-black tracking-wider text-amber-200 drop-shadow-md">
                🍫 CHOCOLATE
              </p>
              <p className="text-[10px] text-amber-300 font-bold mt-0.5">터치해서 포장지 까기</p>
            </div>

            <div>
              <h3 className="text-xl font-black text-amber-300">강화랜드 레크 초콜릿</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                초콜릿 속에 hidden 황금 티켓(골든 티켓)이 들어있을까요?
              </p>
            </div>

            <button
              onClick={handleOpenChocolate}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-amber-950 font-black text-sm rounded-2xl shadow-lg hover:from-amber-400 hover:to-yellow-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              초콜릿 까기 (10/1 확률 추첨)
            </button>
          </div>
        )}

        {/* 2단계: 까는 중 애니메이션 */}
        {step === "opening" && (
          <div className="py-12 space-y-4 animate-pulse">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full mx-auto flex items-center justify-center border border-amber-500/40">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h4 className="text-lg font-black text-amber-300">초콜릿 포장지를 까는 중...</h4>
            <p className="text-xs text-slate-400 font-mono">
              서버시간 10 모듈로 추첨 진행 중
            </p>
          </div>
        )}

        {/* 3단계: 결과 공개 */}
        {step === "revealed" && (
          <div className="space-y-5 py-2 animate-fade-in">
            {/* 추첨 서버시간 디버그 로직 안내 */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[11px] font-mono text-slate-400 flex justify-between items-center">
              <span>서버시간: {serverTimestamp}</span>
              <span className="font-bold text-amber-400">
                Modulo 10 = <span className="text-white bg-slate-700 px-1.5 py-0.5 rounded font-black">{serverTimeDigit}</span>
              </span>
            </div>

            {/* 당첨 vs 일반 티켓 */}
            {isWinner ? (
              <div className="space-y-4">
                {/* 🏆 GOLDEN TICKET CARD */}
                <div className="animate-gold-shimmer animate-pulse-glow text-amber-950 p-6 rounded-3xl border-4 border-yellow-300 shadow-2xl relative overflow-hidden text-center space-y-3">
                  <div className="flex justify-center items-center gap-1.5 text-xs font-black tracking-widest uppercase bg-amber-950/20 py-1 px-3 rounded-full w-fit mx-auto">
                    <Sparkles className="w-4 h-4 text-amber-900" />
                    GOLDEN TICKET
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-900 tracking-wider">찰리와 초콜릿 공장</p>
                    <h3 className="text-2xl font-black tracking-tight text-amber-950 drop-shadow-sm">
                      강화랜드로의 초대장
                    </h3>
                  </div>

                  <div className="bg-amber-950/10 p-3 rounded-2xl border border-amber-950/20 text-xs font-bold leading-relaxed text-amber-950">
                    <p className="text-sm font-black text-amber-900 mb-1">🎉 VIP 골든티켓 당첨! 🎉</p>
                    <p>수련회 레크리에이션 시작 시 이 골든티켓 화면을 임원진에게 보여주시면 <span className="underline decoration-2">추가 포인트 혜택</span>이 부여됩니다!</p>
                  </div>

                  <p className="text-[10px] font-mono font-bold text-amber-900/80 tracking-widest pt-1">
                    TICKET NO. GT-2026-REG-WIN
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-2xl text-xs font-bold">
                  ✨ 10명 중 1명의 확률을 뚫었습니다! 캡처하거나 화면을 보여주세요.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🥈 일반 초대장 CARD */}
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

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300 leading-relaxed font-medium">
                    아쉽게도 은빛 일반 초대장입니다! (서버시간 뒷자리: {serverTimeDigit})<br />
                    레크리에이션에 적극 참여하여 즐거운 시간을 보내세요! 🍫
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 cursor-pointer transition-colors"
                >
                  다시 뽑아보기 🔄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
