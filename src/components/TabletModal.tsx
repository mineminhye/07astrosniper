/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import { MathFormula } from './MathText';

interface TabletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TabletModal({ isOpen, onClose }: TabletModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal content styled like antique paper */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            className="relative w-full max-w-3xl h-[85vh] bg-[#f4edd2] text-[#2e1a05] border-8 border-double border-[#8a6d3b] rounded-xl p-6 md:p-8 shadow-2xl z-10 flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#8a6d3b] pb-4 mb-4">
              <h3 className="font-jua text-2xl md:text-3xl text-[#5c3a1a] flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-[#5c3a1a]" />
                📜 지혜의 석판: 원주각 정리의 증명
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[#5c3a1a] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable contents */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm md:text-base leading-relaxed text-justify font-sans">
              <p className="text-center font-jua italic text-[#705230] text-sm md:text-md mb-4">
                "모든 기하학적 성질은 엄밀한 수학적 증명으로 우주 공간 속에 영구히 불변합니다.<br />
                이등변삼각형의 성질과 삼각형의 외각 원리를 결합하여 3가지 경우를 논증합니다."
              </p>

              {/* Step 1 */}
              <div>
                <h4 className="font-jua text-lg md:text-xl text-[#5c3a1a] border-b border-[#8a6d3b]/40 pb-1 mb-2">
                  1단계 : 원의 중심 <MathFormula math="O" />가 원주각의 한 변 <MathFormula math="PB" /> 위에 있을 때
                </h4>
                <p>
                  원 <MathFormula math="O" />의 반지름의 길이는 모두 같으므로 삼각형 <MathFormula math="\triangle OPA" />는 선분{' '}
                  <MathFormula math="OA = OP" />인 이등변삼각형입니다.
                  <br />
                  따라서 두 밑각의 크기는 같습니다:
                  <MathFormula math="\angle APO = \angle OAP" block />
                  삼각형의 한 외각의 크기는 이웃하지 않는 두 내각의 합과 같으므로:
                  <MathFormula math="\angle AOB = \angle APO + \angle OAP = 2\angle APO = 2\angle APB" block />
                  양변을 2로 나누면 다음 비례 정리가 유도됩니다:
                  <MathFormula math="\angle APB = \frac{1}{2}\angle AOB" block />
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <h4 className="font-jua text-lg md:text-xl text-[#5c3a1a] border-b border-[#8a6d3b]/40 pb-1 mb-2">
                  2단계 : 원의 중심 <MathFormula math="O" />가 원주각 <MathFormula math="\angle APB" />의 내부에 있을 때
                </h4>
                <p>
                  원주각의 꼭짓점 <MathFormula math="P" />와 원의 중심 <MathFormula math="O" />를 지나는 보조 지름선{' '}
                  <MathFormula math="PD" />를 통과시켜 양 갈래 삼각형으로 분할합니다.
                  <br />
                  1단계에서 입증한 원리에 의하여 두 이등변삼각형{' '}
                  <MathFormula math="\triangle OPA" />와 <MathFormula math="\triangle OPB" />에 성질을 각각 적용합니다:
                  <MathFormula math="\angle AOD = 2\angle APD,\quad \angle DOB = 2\angle DPB" block />
                  양변을 더하여 결합하면 구하려 하는 중심각의 전체 합산 크기가 산출됩니다:
                  <MathFormula math="\angle AOB = \angle AOD + \angle DOB = 2\angle APD + 2\angle DPB = 2(\angle APD + \angle DPB) = 2\angle APB" block />
                  그러므로 다음의 합산 정리가 엄밀하게 입증됩니다:
                  <MathFormula math="\angle APB = \frac{1}{2}\angle AOB" block />
                </p>
              </div>

              {/* Step 3 */}
              <div>
                <h4 className="font-jua text-lg md:text-xl text-[#5c3a1a] border-b border-[#8a6d3b]/40 pb-1 mb-2">
                  3단계 : 원의 중심 <MathFormula math="O" />가 원주각 <MathFormula math="\angle APB" />의 외부에 있을 때
                </h4>
                <p>
                  원주각의 꼭짓점 <MathFormula math="P" />와 원의 중심 <MathFormula math="O" />를 관통하는 지름 보조선{' '}
                  <MathFormula math="PD" />를 작도합니다.
                  <br />
                  지름보조선 <MathFormula math="PD" />에 의해 나눠지는 두 개의 큰 영역에 1단계의 논증 정리를 대입합니다:
                  <MathFormula math="\angle AOD = 2\angle APD,\quad \angle BOD = 2\angle BPD" block />
                  구하고자 하는 목적인 중심각 <MathFormula math="\angle AOB" />는 두 각의 크기 편차와 같으므로:
                  <MathFormula math="\angle AOB = \angle AOD - \angle BOD = 2\angle APD - 2\angle BPD = 2(\angle APD - \angle BPD) = 2\angle APB" block />
                  따라서 다음 외각 감산 비례 비례식이 성립합니다:
                  <MathFormula math="\angle APB = \frac{1}{2}\angle AOB" block />
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-[#8a6d3b]/40 flex justify-center">
              <button
                onClick={onClose}
                className="font-jua text-md bg-[#5c3a1a] text-[#f4edd2] px-10 py-2.5 rounded-lg font-bold shadow-md hover:bg-[#462b13] active:scale-95 transition-all pointer-events-auto cursor-pointer"
              >
                석판 닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
