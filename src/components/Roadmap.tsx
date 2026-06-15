/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Map, Lock, Info, Play, RotateCcw, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

interface RoadmapNode {
  id: number;
  name: string;
  englishName: string;
  color: string;
  emoji: string;
  isPlayable: boolean;
  desc: string;
}

const NODES: RoadmapNode[] = [
  {
    id: 1,
    name: "시작의 광장",
    englishName: "Starters Square",
    color: "from-pink-500 to-rose-600",
    emoji: "❤️",
    isPlayable: false,
    desc: "모험의 첫 걸음이 시작되는 평화롭고 따스한 하트형 광장입니다."
  },
  {
    id: 2,
    name: "물의 도시",
    englishName: "Water City",
    color: "from-blue-400 to-cyan-600",
    emoji: "⛵",
    isPlayable: false,
    desc: "끝없는 푸른 물결과 은빛 곤돌라들이 노니는 투명하고 아름다운 수채의 도시입니다."
  },
  {
    id: 3,
    name: "얼음의 도시",
    englishName: "Ice City",
    color: "from-sky-300 to-indigo-500",
    emoji: "❄️",
    isPlayable: false,
    desc: "서리가 피어나는 단단한 얼음 수정 궁전과 냉각 광장이 놓인 빙하의 고해입니다."
  },
  {
    id: 4,
    name: "불의 도시",
    englishName: "Fire City",
    color: "from-orange-500 to-red-600",
    emoji: "🔥",
    isPlayable: false,
    desc: "뜨겁게 요동치는 용암 지평선과 정열적인 불꽃 벌집 타워들이 자리 잡은 도시입니다."
  },
  {
    id: 5,
    name: "바람의 도시",
    englishName: "Wind City",
    color: "from-teal-400 to-emerald-600",
    emoji: "🌀",
    isPlayable: false,
    desc: "천천히 돌아가는 갈색 목조 풍차들과 부드러운 바람이 숨 쉬는 녹색의 능선입니다."
  },
  {
    id: 6,
    name: "비눗방울 마을",
    englishName: "Bubble Village",
    color: "from-emerald-300 to-sky-400",
    emoji: "🫧",
    isPlayable: false,
    desc: "하늘 높이 몽실몽실 떠다니는 무지갯빛 비눗방울 주택들이 모인 평화로운 마을입니다."
  },
  {
    id: 7,
    name: "별의 도시",
    englishName: "Star City",
    color: "from-yellow-400 to-amber-500",
    emoji: "⭐",
    isPlayable: true,
    desc: "[활성화됨 - 아기 별 저격수] 달님과 함께 숨겨진 아기 별들을 저격하는 기하학적 모험 마당입니다!"
  },
  {
    id: 8,
    name: "빛의 도시",
    englishName: "Light City",
    color: "from-amber-300 to-yellow-600",
    emoji: "🏛️",
    isPlayable: false,
    desc: "찬란하게 빛나는 금빛 돔 사원과 무한한 성스러운 빛줄기가 솟구치는 찬란한 대성당입니다."
  },
  {
    id: 9,
    name: "보석의 도시",
    englishName: "Gem City",
    color: "from-purple-500 to-fuchsia-600",
    emoji: "💎",
    isPlayable: false,
    desc: "형형색색 영롱하고 신비로운 결정체 보석 광장과 에메랄드 타워들이 빛나는 밀실입니다."
  },
  {
    id: 10,
    name: "봉인해제의 관문",
    englishName: "Gateway of Unsealing",
    color: "from-violet-600 to-purple-900",
    emoji: "🔮",
    isPlayable: false,
    desc: "세계의 경계를 연결하며 차원 왜곡을 해제하여 마지막 보물을 탐지하게 만드는 관문입니다."
  },
];

interface RoadmapProps {
  onStartGame: () => void;
  onResetProgress: () => void;
  completedIdx: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function Roadmap({ onStartGame, onResetProgress, completedIdx, soundEnabled, onToggleSound }: RoadmapProps) {
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  // Helper to place 10 nodes in a circle/ellipse layout
  const getNodeCoordinates = (index: number) => {
    // 1 is at top (offset of -Math.PI / 2). The rest follow clockwise.
    const numNodes = NODES.length;
    // We can shift indices so node 1 is at -90 degrees, node 2 is clockwise, etc.
    const angle = (index / numNodes) * Math.PI * 2 - Math.PI / 2;
    // Stretch to fit widescreen beautifully
    const rx = 38; // percentage of horizontal radius
    const ry = 30; // percentage of vertical radius
    return {
      left: `${50 + rx * Math.cos(angle)}%`,
      top: `${48 + ry * Math.sin(angle)}%`,
    };
  };

  return (
    <div className="absolute inset-0 bg-[#060212] overflow-hidden flex flex-col items-center justify-between p-4 z-40 select-none">
      {/* Space Background Grid & Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#130733] via-[#060214] to-[#020108] opacity-90 z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-overlay opacity-40 z-0 pointer-events-none" />

      {/* Floating Sparkles decorative */}
      <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl z-0 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-44 h-44 rounded-full bg-fuchsia-500/10 blur-2xl z-0 pointer-events-none" />

      {/* Upper Control Bar */}
      <header className="w-full max-w-6xl flex flex-wrap justify-between items-center z-10 py-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-jua text-2xl text-yellow-400 flex items-center gap-2">
            🚀 원, 더 월드: 로드맵
          </span>
          <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            v1.2.0
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onStartGame}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-jua text-sm font-bold shadow-[0_3px_10px_rgba(219,39,119,0.35)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="별 저격 본 게임 실행"
          >
            <Play className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>🎮 게임으로 들어 가기</span>
          </button>

          {completedIdx > 0 && (
            <button
              onClick={() => {
                onResetProgress();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-jua hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              진도 초기화
            </button>
          )}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </header>

      {/* Giant Elliptical Track Map */}
      <main className="flex-1 w-full max-w-5xl relative min-h-[360px] md:min-h-[450px] flex items-center justify-center z-10">
        
        {/* Orbital Ellipse Ring */}
        <div className="absolute w-[76%] h-[60%] border-4 border-dashed border-indigo-400/20 rounded-[50%] pointer-events-none z-0 transform -rotate-12 blur-[1px]">
          {/* Neon running pulse on the track */}
          <div className="absolute inset-0 rounded-[50%] border-2 border-indigo-400/5 shadow-[0_0_20px_rgba(129,140,248,0.15)]" />
        </div>

        {/* Central Map Scroll Layout */}
        <div className="absolute text-center flex flex-col items-center bg-[#180e3b]/85 border-2 border-yellow-400/60 rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-md max-w-xs md:max-w-md z-1 pointer-events-auto">
          <div className="text-pink-400 text-xl font-bold font-jua mb-1 flex items-center gap-1.5">
            <Map className="w-5 h-5 text-yellow-400 animate-bounce" />
            원, 더 월드: 로드맵
          </div>
          <p className="text-[11px] text-yellow-300 font-mono tracking-wide mb-2 uppercase">
            Won, the World: Roadmap
          </p>
          <div className="h-[2px] w-12 bg-yellow-400/40 my-1" />
          <p className="text-gray-300 text-xs leading-relaxed max-w-sm mt-1">
            원의 성질을 입증하여 차원의 봉인을 풀어나가는 대서사시형 기하 모험입니다. 별들의 도시에 진입해 아기 별 구조 대원이 되어주세요!
          </p>
          <p className="text-[11px] text-pink-400 mt-2 font-jua animate-pulse">
            {completedIdx > 0 
              ? `현재 진행 중 (별 ${completedIdx}개 수집 완료)` 
              : '👉 아래 [7. 별의 도시]를 눌러 탐사를 시작하세요!'}
          </p>
        </div>

        {/* 10 Floating Celestial Islands Nodes */}
        {NODES.map((node, index) => {
          const coords = getNodeCoordinates(index);
          const isCompleted = node.isPlayable && completedIdx >= 30;
          const isStarted = node.isPlayable && completedIdx > 0;

          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: coords.left,
                top: coords.top,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Node wrapper with beautiful interactive scaling */}
              <div
                onClick={() => setSelectedNode(node)}
                className={`group flex flex-col items-center justify-center cursor-pointer relative ${
                  node.isPlayable ? 'pointer-events-auto' : 'pointer-events-auto'
                }`}
              >
                {/* Node Orb with customized outline glow based on level progress */}
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    node.isPlayable
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.5)] md:hover:scale-115 border-2 border-yellow-300 ring-4 ring-yellow-400/20'
                      : 'bg-white/5 border border-white/10 md:hover:bg-white/15 md:hover:scale-105'
                  }`}
                >
                  {/* Floating Number circle */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#1b0a3c] text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                    {node.id}
                  </span>

                  {/* Island Main Emoji Icon */}
                  <span className="text-2xl md:text-3xl transition-transform duration-300 group-hover:scale-110">
                    {node.emoji}
                  </span>

                  {/* Inner Play overlay for the playable node */}
                  {node.isPlayable && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="absolute inset-0 border-2 border-yellow-300 rounded-full pointer-events-none"
                    />
                  )}

                  {/* Locked padlock symbol for other locations */}
                  {!node.isPlayable && (
                    <div className="absolute bottom-[-4px] right-[-2px] bg-black/70 p-0.5 rounded-full border border-white/15">
                      <Lock className="w-3 h-3 text-gray-400" />
                    </div>
                  )}

                  {/* Completed star representation */}
                  {isCompleted && (
                    <div className="absolute top-[-4px] right-[-4px] bg-yellow-400 text-[#0c031c] rounded-full p-0.5 border border-black animate-bounce">
                      👑
                    </div>
                  )}
                  {isStarted && !isCompleted && (
                    <div className="absolute top-[-4px] right-[-4px] bg-indigo-500 text-white rounded-full p-0.5 text-[8px] font-bold border border-black">
                      ING
                    </div>
                  )}
                </div>

                {/* Level Title label under node */}
                <div className="mt-2 text-center">
                  <span
                    className={`font-jua text-xs md:text-sm tracking-wide block transition-colors ${
                      node.isPlayable
                        ? 'text-yellow-300 group-hover:text-yellow-200 font-bold'
                        : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                  >
                    {node.name}
                  </span>
                  {node.isPlayable && (
                    <span className="text-[9px] text-[#44eebb] font-bold uppercase tracking-wider block">
                      {isCompleted ? '👑 완료' : '🔥 탐사대 파견!'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Selected Node Details Draw-up Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-sm bg-[#1e0e3f] border-2 border-yellow-300 rounded-2xl p-5 shadow-2xl relative z-10"
            >
              {/* Title with Emoji */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-jua text-xl text-yellow-300 flex items-center gap-1.5">
                    <span className="text-2xl">{selectedNode.emoji}</span>
                    {selectedNode.id}. {selectedNode.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono tracking-wider">
                    {selectedNode.englishName}
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNode.isPlayable
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-pulse'
                      : 'bg-white/5 border border-white/10 text-gray-400'
                  }`}
                >
                  {selectedNode.isPlayable ? '개방됨' : '잠금 봉인'}
                </div>
              </div>

              {/* Description body */}
              <p className="text-gray-200 text-sm leading-relaxed mb-5 bg-[#0e0622] p-3 rounded-lg border border-white/5 font-sans">
                {selectedNode.desc}
              </p>

              {/* Action play button or closed notices */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl font-jua text-sm flex-1 hover:bg-white/15 active:scale-95 transition-all cursor-pointer text-center"
                >
                  닫기
                </button>
                {selectedNode.isPlayable ? (
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onStartGame();
                    }}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-[#0b031a] rounded-xl font-jua font-bold text-sm flex-1 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-[0_3px_10px_rgba(234,179,8,0.3)]"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" />
                    모험 떠나기
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-[#0c031c] text-orange-400 border border-orange-500/20 rounded-xl font-jua text-xs flex-1 text-center flex items-center justify-center gap-1 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    추후 개방 예정
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer credits and tip */}
      <footer className="w-full text-center py-2 text-gray-500 text-[11px] font-mono z-10 flex flex-col md:flex-row items-center justify-between max-w-6xl border-t border-white/5">
        <span>© 2026 원, 더 월드 프로젝트. All Rights Reserved.</span>
        <span className="text-yellow-400/60 font-semibold mt-1 md:mt-0 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" /> 7. 별의 도시는 실제로 탐사 및 게임 진행이 가능한 핵심 마당입니다.
        </span>
      </footer>
    </div>
  );
}
