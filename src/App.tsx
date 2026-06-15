/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Map,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Play,
  PlayIcon,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

import { QUESTIONS } from './data';
import { Star } from './types';
import { SpaceBackground } from './components/SpaceBackground';
import { GeometryCanvas } from './components/GeometryCanvas';
import { RichText, MathFormula } from './components/MathText';
import { AdventureMapModal } from './components/AdventureMapModal';
import { TabletModal } from './components/TabletModal';
import { Roadmap } from './components/Roadmap';

export default function App() {
  // 1. Core State Persistence - "첫 화면은 일단 삭제해"에 따라 게임('game') 화면이 디폴트로 로드됩니다.
  const [screen, setScreen] = useState<'roadmap' | 'game'>('game');

  const [qIdx, setQIdx] = useState<number>(() => {
    const saved = localStorage.getItem('one_the_world_progress');
    return saved ? Math.min(parseInt(saved), QUESTIONS.length) : 0;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('one_the_world_sound');
    return saved !== 'false';
  });

  // User input and animations
  const [selectedAngle, setSelectedAngle] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [animType, setAnimType] = useState<'fire' | 'collect' | 'none'>('none');
  const [stars, setStars] = useState<Star[]>([]);
  const [globalTime, setGlobalTime] = useState<number>(0);
  
  // Feedback Banners
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Overlays and Modals
  const [showStageOverlay, setShowStageOverlay] = useState<boolean>(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isTabletModalOpen, setIsTabletModalOpen] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // 수동 단계 워프 이동기: 언제든 원하는 단계를 부활시키고 마음껏 다시 연습합니다.
  const handleSelectStage = (stageNum: number) => {
    let idx = 0;
    if (stageNum === 1) idx = 0;
    else if (stageNum === 2) idx = 10;
    else if (stageNum === 3) idx = 20;
    
    setQIdx(idx);
    localStorage.setItem('one_the_world_progress', idx.toString());
    setShowStageOverlay(true);
    setFeedback(null);
  };

  const currentQuestion = qIdx < QUESTIONS.length ? QUESTIONS[qIdx] : null;
  const currentStage = currentQuestion ? currentQuestion.stage : 3;
  const stepSize = currentQuestion && (currentQuestion.centerAngle / 2) % 5 === 0 ? 5 : 1;

  // 2. Synthesize audio bells and clicks
  const playSound = (type: 'tick' | 'success' | 'fail') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (type === 'tick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        const playNote = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.035, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(start);
          osc.stop(start + duration + 0.05);
        };
        playNote(523.25, now, 0.15); // C5
        playNote(659.25, now + 0.08, 0.15); // E5
        playNote(783.99, now + 0.16, 0.15); // G5
        playNote(1046.50, now + 0.24, 0.35); // C6
      } else if (type === 'fail') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const handleAngleChange = (val: number) => {
    if (isAnimating) return;
    const clamped = Math.max(0, Math.min(175, val));
    setSelectedAngle(clamped);
    playSound('tick');
  };

  const handleFire = () => {
    if (isAnimating || !currentQuestion) return;

    const correctAnswer = currentQuestion.centerAngle / 2;
    if (selectedAngle === correctAnswer) {
      playSound('success');
      setFeedback({
        message: `완벽합니다! 원주각(${selectedAngle}°)은 중심각(${currentQuestion.centerAngle}°)의 절반(1/2)입니다.`,
        type: 'success',
      });
      setIsAnimating(true);
      setAnimType('fire');
      setAnimProgress(0);
    } else {
      playSound('fail');
      setFeedback({
        message: `계산 결과가 왜곡 역장의 오차 범위에 수렴하지 않습니다. (힌트: 원주각 = 중심각 ÷ 2)`,
        type: 'error',
      });
    }
  };

  // 3. Question/Star lifecycle
  const generateStars = (idx: number) => {
    if (idx >= QUESTIONS.length) return [];
    const q = QUESTIONS[idx];

    let pAngle = Math.PI;
    let aAngle = 0, bAngle = 0;
    const centerRad = (q.centerAngle * Math.PI) / 180;

    if (q.stage === 1) {
      pAngle = Math.PI * 0.95;
      bAngle = pAngle - Math.PI;
      aAngle = bAngle - centerRad;
    } else if (q.stage === 2) {
      // Stage 2 is Inside (O is inside the angle)
      pAngle = Math.PI * 0.12;
      aAngle = pAngle + Math.PI * 0.85;
      bAngle = aAngle + centerRad;
    } else {
      // Stage 3 is Outside (O is outside the angle)
      // Symmetrical layout with P at 180 (left) and A/B in the bottom half centered around 90 (down)
      pAngle = Math.PI;
      aAngle = Math.PI * 0.5 + centerRad / 2;
      bAngle = Math.PI * 0.5 - centerRad / 2;
    }

    let arcStart = q.stage === 3 ? bAngle : aAngle;
    let arcEnd = q.stage === 3 ? aAngle : bAngle;
    if (arcStart > arcEnd) {
      arcEnd += Math.PI * 2;
    }

    const starList: Star[] = [];
    for (let i = 0; i < 5; i++) {
      const ratio = 0.15 + 0.7 * (i / 4);
      const cAng = arcStart + (arcEnd - arcStart) * ratio;
      starList.push({ angle: cAng, visible: true, x: 0, y: 0 });
    }
    // Anchor endpoints
    starList.push({ angle: arcStart, visible: true, x: 0, y: 0 });
    starList.push({ angle: arcEnd, visible: true, x: 0, y: 0 });
    return starList;
  };

  useEffect(() => {
    if (qIdx < QUESTIONS.length) {
      setStars(generateStars(qIdx));
      setSelectedAngle(0);
      setFeedback(null);
      localStorage.setItem('one_the_world_progress', qIdx.toString());
    }
  }, [qIdx]);

  // Stage overlay auto-trigger logic using ref tracking
  const lastStateStage = useRef<number>(currentStage);
  useEffect(() => {
    if (qIdx >= QUESTIONS.length) {
      setShowStageOverlay(false);
      return;
    }
    if (qIdx === 0) {
      setShowStageOverlay(true);
      lastStateStage.current = currentStage;
      return;
    }
    if (currentStage !== lastStateStage.current) {
      setShowStageOverlay(true);
      lastStateStage.current = currentStage;
    }
  }, [qIdx, currentStage]);

  // 4. Global Animation tick
  useEffect(() => {
    let animId: number;
    const renderClock = () => {
      setGlobalTime((t) => t + 1);
      animId = requestAnimationFrame(renderClock);
    };
    animId = requestAnimationFrame(renderClock);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Complex multi-phase animation controller
  useEffect(() => {
    if (!isAnimating) return;
    let frameId: number;
    const runAnimation = () => {
      setAnimProgress((prev) => {
        const next = prev + 0.024;
        if (next >= 1) {
          if (animType === 'fire') {
            setAnimType('collect');
            return 0; // Reset for collection gravity phase
          } else if (animType === 'collect') {
            setStars((prev) => prev.map((s) => ({ ...s, visible: false })));
            setIsAnimating(false);
            setAnimType('none');
            // Slight delay before fading in the next screen as per best practices
            setTimeout(() => {
              setQIdx((current) => current + 1);
            }, 100);
            return 0;
          }
        }
        return next;
      });
      frameId = requestAnimationFrame(runAnimation);
    };
    frameId = requestAnimationFrame(runAnimation);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating, animType]);

  // 5. Keyboard shortcut listeners to enrich interface
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating || qIdx >= QUESTIONS.length || showStageOverlay || isMapModalOpen || isTabletModalOpen) return;
      if (e.key === 'ArrowLeft' || e.key === '[') {
        handleAngleChange(selectedAngle - stepSize);
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        handleAngleChange(selectedAngle + stepSize);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFire();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAngle, isAnimating, qIdx, showStageOverlay, isMapModalOpen, isTabletModalOpen, stepSize]);

  const soundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('one_the_world_sound', next.toString());
  };

  const handleResetProgress = () => {
    setQIdx(0);
    localStorage.setItem('one_the_world_progress', '0');
    setShowStageOverlay(true);
    setFeedback(null);
  };

  return (
    <div className="relative min-h-screen w-full select-none text-white font-sans overflow-x-hidden flex items-center justify-center p-2 md:p-6 lg:p-8 z-10 bg-[#03010b]">
      {/* Background Star Canvas */}
      <SpaceBackground />

      {/* Main 16:9 Aspect Ratio Arcade Cabinet Wrapper for Desktop/Tablet */}
      <div id="game-cabinet-frame" className="relative w-full max-w-7xl mx-auto flex flex-col flex-grow md:flex-initial md:aspect-[16/9] bg-[#070314]/85 border-2 border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] backdrop-blur-md p-4 min-h-[500px]">
        {screen === 'roadmap' ? (
          <Roadmap
            onStartGame={() => setScreen('game')}
            onResetProgress={handleResetProgress}
            completedIdx={qIdx}
            soundEnabled={soundEnabled}
            onToggleSound={soundToggle}
          />
        ) : (
          <div className="w-full h-full flex flex-col min-h-0">
            {/* Main Header navigation */}
            <header className="h-[64px] bg-[#1a0f3d]/70 backdrop-blur-md border border-white/10 rounded-2xl px-5 flex items-center justify-between gap-4 shadow-lg mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen('roadmap')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-jua text-xs hover:bg-indigo-500/30 hover:text-white active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_8px_rgba(99,102,241,0.2)]"
                  title="우주 보물 지도가 있는 로드맵 첫 화면으로 돌아가기"
                >
                  <Map className="w-4 h-4 text-indigo-300" />
                  <span>🗺️ 첫 화면 (로드맵)</span>
                </button>
                <h1 className="font-jua text-xl md:text-2xl text-yellow-300 tracking-wide drop-shadow-[0_0_10px_rgba(253,224,71,0.3)]">
                  원:더 월드 <span className="text-white/60 text-base font-normal align-middle hidden sm:inline-block ml-1">Won the World — 별의 도시</span>
                </h1>
                <button
                  onClick={soundToggle}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 transition-all text-gray-300 hover:text-white cursor-pointer"
                  title={soundEnabled ? '사운드 켜짐' : '사운드 꺼짐'}
                >
                  {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Progress bar container */}
              {qIdx < QUESTIONS.length && (
                <div className="flex-1 max-w-[280px] md:max-w-md flex items-center gap-4">
                  <span className="text-xs text-gray-400 font-medium hidden sm:block">수집 진도</span>
                  <div className="flex-grow h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/5 relative p-[1px]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(qIdx / QUESTIONS.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 rounded-full"
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="font-jua bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-3.5 py-0.5 rounded-full text-sm shadow-[0_2px_10px_rgba(219,39,119,0.3)]">
                    {qIdx + 1} / {QUESTIONS.length}
                  </div>
                </div>
              )}

              {/* Action center menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-400/30 font-jua text-sm text-orange-300 hover:bg-orange-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Map className="w-4.5 h-4.5" />
                  <span className="hidden md:inline">모험 지도</span>
                </button>
                <button
                  onClick={() => setIsTabletModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-400/30 font-jua text-sm text-yellow-300 hover:bg-yellow-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-4.5 h-4.5" />
                  <span className="hidden md:inline">지혜 석판</span>
                </button>
              </div>
            </header>

            {/* Main Grid Container: adapts beautifully in 16:9 layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden min-h-0 mb-1">
              
              {/* Left Side Section: Interactive Circle Workspace */}
              {qIdx < QUESTIONS.length ? (
                <main className="md:col-span-7 bg-[#0b031a]/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-inner h-full min-h-[300px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 flex-shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  COSMIC GEOMETRY LAB
                </span>
                
                {/* 1, 2, 3단계 워프 퀵 버튼 탭 */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => handleSelectStage(1)}
                    className={`px-2 py-0.5 rounded text-[10px] font-jua active:scale-95 transition-all cursor-pointer ${
                      currentStage === 1
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title="1단계로 워프 이동"
                  >
                    1단계 🌟
                  </button>
                  <button
                    onClick={() => handleSelectStage(2)}
                    className={`px-2 py-0.5 rounded text-[10px] font-jua active:scale-95 transition-all cursor-pointer ${
                      currentStage === 2
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title="2단계로 워프 이동"
                  >
                    2단계 🌌
                  </button>
                  <button
                    onClick={() => handleSelectStage(3)}
                    className={`px-2 py-0.5 rounded text-[10px] font-jua active:scale-95 transition-all cursor-pointer ${
                      currentStage === 3
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-[#0c031c] font-bold shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title="3단계로 워프 이동"
                  >
                    3단계 🪐
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer flex items-center gap-0.5"
                  title="힌트 보기"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-[11px] font-medium hidden sm:inline">정답 공식</span>
                </button>
                <button
                  onClick={handleResetProgress}
                  className="p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/15 text-xs transition-all cursor-pointer"
                  title="모험 리셋"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Geometry Display board */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#10072b]/25 rounded-xl border border-white/5">
              
              {/* Floating Equation Hints */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 right-4 bg-purple-950/95 border border-purple-500/30 p-3 rounded-lg text-xs md:text-sm shadow-xl z-20"
                  >
                    <p className="font-bold text-yellow-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      원주각과 중심각 성질 공식 힌트
                    </p>
                    <div className="p-2 border border-white/5 bg-[#0b031a]/40 rounded leading-relaxed text-gray-200">
                      원의 홀수형 호에 대해 다음 불변 비례가 완벽히 적용됩니다:
                      <div className="text-center my-1">
                        <MathFormula math="\angle APB = \frac{1}{2} \angle AOB" block />
                      </div>
                      즉, <span className="font-semibold text-pink-400">원주각 (선택할 각도)</span>은 항상 <span className="font-semibold text-yellow-400">중심각 (달님의 기준 각도: {currentQuestion?.centerAngle}°)</span>의 절반인 <span className="font-bold text-teal-400">{currentQuestion?.centerAngle ? currentQuestion.centerAngle / 2 : 0}°</span>가 되어야 정답 그물망에 수집됩니다!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentQuestion && (
                <GeometryCanvas
                  centerAngle={currentQuestion.centerAngle}
                  stage={currentStage}
                  selectedAngle={selectedAngle}
                  isAnimating={isAnimating}
                  animProgress={animProgress}
                  animType={animType}
                  stars={stars}
                  globalTime={globalTime}
                />
              )}
            </div>

            <div className="mt-2 text-center text-gray-500 text-[11px] font-mono flex-shrink-0">
              * 기하학 캔버스 상의 점 O는 원의 중심, 점 P는 스나이퍼 각의 꼭짓점, 호 AB가 호의 지평선을 의미합니다.
            </div>
          </main>
        ) : (
          <main className="md:col-span-12 bg-[#0b031a]/40 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center h-full overflow-hidden">
            {/* Completion fireworks mockup using purely native styled vectors */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl flex flex-col items-center justify-center h-full py-2"
            >
              <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-300/40 mb-4 relative">
                <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 border border-yellow-400/20 rounded-full"
                />
              </div>

              <h2 className="font-jua text-3xl md:text-4xl text-yellow-300 mb-2.5 tracking-wide">
                별 수집 완전 정복!
              </h2>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-4 font-jua max-w-lg">
                달의 도시 왜곡장을 무사히 복원하고 우주의 기하학적 수리를 밝혀냈습니다!<br />
                총 {QUESTIONS.length}가지 차원의 은빛 아기 별들을 모두 수집하는 위대한 구조를 마쳤습니다.
              </p>

              <div className="p-3 border border-teal-500/20 bg-teal-500/10 rounded-xl mb-6 text-xs md:text-sm text-teal-300 font-jua">
                ⭐ 모험 영예 등급: <strong>유클리드 기하학 대수호성</strong> 등극 완료!
              </div>

              {noticeMessage && (
                <div className="mb-5 text-xs text-yellow-300 font-jua bg-yellow-500/10 border border-yellow-400/25 px-4 py-2.5 rounded-xl max-w-md shadow-inner md:text-sm">
                  {noticeMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setNoticeMessage('📖 지혜의 석판 해설 영상 지령은 현재 준비 중입니다. 조만간 공개될 예정입니다!')}
                  className="font-jua flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 md:py-3.5 rounded-xl font-bold active:scale-95 transition-all text-xs md:text-sm cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(239,68,68,0.25)] text-center whitespace-nowrap"
                >
                  📖 지혜의 석판 읽기 (영상)
                </button>
                <a
                  href="https://wontheworld.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-jua flex-1 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-3 md:py-3.5 rounded-xl font-bold active:scale-95 transition-all text-xs md:text-sm cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)] flex items-center justify-center gap-1.5 whitespace-nowrap text-center"
                >
                  🗺️ 모험의 지도 펼치기
                </a>
                <button
                  onClick={() => {
                    setQIdx(0);
                    localStorage.setItem('one_the_world_progress', '0');
                    setFeedback(null);
                    setNoticeMessage(null);
                    setScreen('roadmap');
                  }}
                  className="font-jua flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 py-3 md:py-3.5 rounded-xl font-bold active:scale-95 transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap"
                >
                  🔄 게임 다시 시작하기
                </button>
              </div>
            </motion.div>
          </main>
        )}

        {/* Right Side Section: Narrative and input controls */}
        {currentQuestion ? (
          <aside className="md:col-span-5 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden pr-1">
            {/* Mission display panel */}
            <div className="bg-[#241347]/90 border-l-4 border-yellow-400 rounded-2xl p-3 shadow-md flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-1.5 left-3 px-2 py-0.5 bg-yellow-400/20 rounded text-[9px] text-yellow-300 border border-yellow-400/20 uppercase font-mono">
                수리적 전술 지령
              </div>
              <div className="text-white text-xs md:text-sm leading-relaxed mt-2.5 font-sans font-medium text-justify">
                <RichText text={currentQuestion.quest} />
              </div>
            </div>

            {/* Interactive controller panel */}
            <div className="bg-[#190c30]/90 border border-white/10 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between gap-3 overflow-hidden">
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase mb-2 tracking-wider">
                  수동 정밀 조준 장치 (Controls)
                </span>
                
                {/* Numeric Display value */}
                <div className="text-center mb-3">
                  <div className="text-[10px] text-purple-400 font-medium tracking-widest font-mono uppercase">
                    조준 각도
                  </div>
                  <motion.div
                    key={selectedAngle}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="font-jua text-3xl md:text-4xl text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.4)] my-0.5"
                  >
                    {selectedAngle}°
                  </motion.div>
                </div>

                {/* Range adjustments slider */}
                <div className="flex items-center gap-2.5 w-full mb-2">
                  <button
                    onClick={() => handleAngleChange(selectedAngle - stepSize)}
                    disabled={isAnimating}
                    className="w-9 h-9 rounded-md bg-[#44eebb] text-[#0b031a] hover:bg-[#3ce2b2] disabled:opacity-30 active:scale-90 transition-all font-bold text-lg flex items-center justify-center border-none shadow-[0_2px_8px_rgba(68,238,235,0.25)] select-none pointer-events-auto cursor-pointer"
                  >
                    −
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="175"
                    step={stepSize}
                    value={selectedAngle}
                    onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                    disabled={isAnimating}
                    className="flex-grow h-2 rounded-lg bg-white/10 outline-none appearance-none cursor-pointer focus:outline-none focus:ring-0 select-none slider-thumb-premium"
                    style={{
                      WebkitAppearance: 'none',
                    }}
                  />

                  <button
                    onClick={() => handleAngleChange(selectedAngle + stepSize)}
                    disabled={isAnimating}
                    className="w-9 h-9 rounded-md bg-[#44eebb] text-[#0b031a] hover:bg-[#3ce2b2] disabled:opacity-30 active:scale-90 transition-all font-bold text-lg flex items-center justify-center border-none shadow-[0_2px_8px_rgba(68,238,235,0.25)] select-none pointer-events-auto cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Mobile helper feedback */}
                <div className="text-center text-[9px] text-gray-500 font-sans tracking-wide">
                  키보드 단축키: <kbd className="bg-white/10 px-1 rounded">◀</kbd> / <kbd className="bg-white/10 px-1 rounded">▶</kbd> 조절, <kbd className="bg-white/10 px-1.5 rounded">Space</kbd> / <kbd className="bg-white/10 px-1.5 rounded">Enter</kbd> 발사
                </div>
              </div>

              {/* Fire triggers */}
              <div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFire}
                  disabled={isAnimating}
                  className="w-full py-2.5 md:py-3.5 rounded-xl font-jua text-xl tracking-widest text-white font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-[#9433ff] hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_4px_25px_rgba(219,39,119,0.3)] flex items-center justify-center gap-2 pointer-events-auto cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
                  그물 발사! (Launch)
                </motion.button>
              </div>
            </div>

            {/* Banner feedbacks */}
            <div className="h-[44px] flex-shrink-0 relative overflow-hidden rounded-xl">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div
                    key={feedback.message}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className={`w-full h-full flex items-center justify-center px-4 py-1.5 border text-xs sm:text-xs font-semibold rounded-xl gap-2 font-jua ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400'
                        : 'bg-pink-500/10 border-pink-400/30 text-pink-400'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-pink-400" />
                    )}
                    <span className="leading-tight text-center">{feedback.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        ) : null}
      </div>

      {/* Dynamic Slide-in Stage Intro Overlays */}
      <AnimatePresence>
        {showStageOverlay && currentQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/92 backdrop-blur-md"
            />

            {/* Glass panel content card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-[#1d123c]/95 border-2 border-pink-500 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(244,63,94,0.3)] z-10 overflow-hidden flex flex-col pointer-events-auto text-center"
            >
              <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl shadow-inner" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl shadow-inner" />

              <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4 text-3xl">
                {currentStage === 1 && '🌟'}
                {currentStage === 2 && '🌌'}
                {currentStage === 3 && '🪐'}
              </div>

              {/* Stage intro header decoration */}
              <div className="mb-6">
                <h2 className="font-jua text-3xl md:text-4xl text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.2)]">
                  {currentStage}단계 별 수집 시작!
                </h2>
                <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
                  Ready to Mission {currentStage}
                </p>
              </div>

              {/* Simple description */}
              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 bg-[#0b031a]/45 p-4 rounded-xl border border-white/5 font-jua">
                {currentStage === 1 && "달님의 중심각을 조준해 정확한 원주각 그물을 발사해 보세요!"}
                {currentStage === 2 && "중심 O가 내부에 있어도 원주각은 항상 중심각의 절반(1/2)입니다!"}
                {currentStage === 3 && "중심 O가 외부에 있어도 원주각은 항상 중심각의 절반(1/2)입니다!"}
              </p>

              {/* Start exploration button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowStageOverlay(false)}
                  className="font-jua text-lg bg-[#44eebb] text-[#0b031a] hover:bg-[#3be2b2] px-12 py-3.5 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all shadow-[0_4px_15px_rgba(68,238,235,0.3)] pointer-events-auto cursor-pointer"
                >
                  <PlayIcon className="w-5 h-5 fill-current" />
                  별 모으기 시작!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </div>
        )}
      </div>

      {/* Map modal overlay */}
      <AdventureMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        currentStage={currentStage}
        completedIdx={qIdx}
        onSelectStage={handleSelectStage}
      />

      {/* Tablet proof list modal overlay */}
      <TabletModal
        isOpen={isTabletModalOpen}
        onClose={() => setIsTabletModalOpen(false)}
      />
    </div>
  );
}
