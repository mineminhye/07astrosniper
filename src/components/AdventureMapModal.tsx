/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Map, X, Star, CheckCircle } from 'lucide-react';

interface AdventureMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: number;
  completedIdx: number;
  onSelectStage?: (stageNum: number) => void;
}

export function AdventureMapModal({ isOpen, onClose, currentStage, completedIdx, onSelectStage }: AdventureMapModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 15, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#150a2e] text-white border-2 border-yellow-400 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-3xl pointer-none" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="font-jua text-2xl text-yellow-400 flex items-center gap-2">
                <Map className="w-6 h-6 animate-pulse text-yellow-400" />
                모험의 지도 (Adventure Map)
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-indigo-200 font-jua text-center mb-2">
                💡 원하는 단계를 클릭하면 해당 단계의 최초 문제로 즉시 워프합니다!
              </p>

              {/* Stage 1 */}
              <div
                onClick={() => {
                  onSelectStage?.(1);
                  onClose();
                }}
                className={`p-4 rounded-xl border flex gap-3 items-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  completedIdx >= 10
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : currentStage === 1
                    ? 'bg-pink-500/10 border-pink-500/40'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                <span className="text-3xl">🌟</span>
                <div className="flex-1">
                  <h4 className="font-bold text-pink-400 text-base md:text-lg flex items-center gap-1">
                    1단계: 원의 중심이 한 변 위에 있을 때
                  </h4>
                  <p className="text-gray-300 text-xs md:text-sm mt-1">
                    외각 정리를 이용한 가장 기초적인 원주각 증명 마당
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {completedIdx >= 10 ? '별 10개 수집 가득 (완료)' : `진행 중 (진도: ${Math.min(completedIdx, 10)} / 10)`}
                  </p>
                </div>
                {completedIdx >= 10 ? (
                  <CheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded border border-pink-500/30 font-jua">이동하기</span>
                )}
              </div>

              {/* Stage 2 */}
              <div
                onClick={() => {
                  onSelectStage?.(2);
                  onClose();
                }}
                className={`p-4 rounded-xl border flex gap-3 items-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  completedIdx >= 20
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : currentStage === 2
                    ? 'bg-teal-500/10 border-teal-500/40 animate-pulse'
                    : 'bg-white/5 border-white/10 opacity-70'
                }`}
              >
                <span className="text-3xl">🌌</span>
                <div className="flex-1">
                  <h4 className="font-bold text-teal-400 text-base md:text-lg">
                    2단계: 원의 중심이 내부에 있을 때
                  </h4>
                  <p className="text-gray-300 text-xs md:text-sm mt-1">
                    보조선을 작도하여 두 영역의 각을 합산하는 종합 수리 연합 (합산 정리)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {completedIdx >= 20
                      ? '별 10개 수집 가득 (완료)'
                      : completedIdx < 10
                      ? '개방됨 (클릭 시 이동 가능)'
                      : `진행 중 (진도: ${Math.min(completedIdx - 10, 10)} / 10)`}
                  </p>
                </div>
                {completedIdx >= 20 ? (
                  <CheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-jua">이동하기</span>
                )}
              </div>

              {/* Stage 3 */}
              <div
                onClick={() => {
                  onSelectStage?.(3);
                  onClose();
                }}
                className={`p-4 rounded-xl border flex gap-3 items-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  completedIdx >= 30
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : currentStage === 3
                    ? 'bg-yellow-500/10 border-yellow-500/40 animate-pulse'
                    : 'bg-white/5 border-white/10 opacity-70'
                }`}
              >
                <span className="text-3xl">🪐</span>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-400 text-base md:text-lg">
                    3단계: 원의 중심이 외부에 있을 때
                  </h4>
                  <p className="text-gray-300 text-xs md:text-sm mt-1">
                    지름선에 대한 거대 원주각과 잉여 영역의 차이를 통과하는 감산 정리
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {completedIdx >= 30
                      ? '별 10개 수집 가득 (완료)'
                      : completedIdx < 20
                      ? '개방됨 (클릭 시 이동 가능)'
                      : `진행 중 (진도: ${Math.min(completedIdx - 20, 10)} / 10)`}
                  </p>
                </div>
                {completedIdx >= 30 ? (
                  <CheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30 font-jua">이동하기</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="font-jua text-sm bg-yellow-400 text-[#0b031a] px-6 py-2 rounded-lg font-bold shadow-md hover:bg-yellow-300 active:scale-95 transition-all pointer-events-auto cursor-pointer"
              >
                지도 닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
