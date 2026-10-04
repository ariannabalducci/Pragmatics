import { useEffect, useMemo, useRef, useState, MouseEvent } from 'react';
import { Play, Lock, Star } from 'lucide-react';
import { Button } from './button';
import ExerciseSystem from './ExerciseSystem';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

const WAVE_CONFIG = {
  amplitude: 90,
  frequency: 0.005,
  step: 300,
  yOffset: 330,
  strokeWidth: 270,
};


export interface LevelNode {
  id: string | number;
  groupId?: string;
  status: 'locked' | 'available' | 'completed';
  group_title?: string;
  group_topic?: string;
  progress?: number;
  activeExerciseId?: string;
  firstExerciseId?: string;
}

export default function Path({ 
  levels, 
  mode = "training", 
  isSessionActive = false 
}: { 
  levels: LevelNode[], 
  mode?: "training" | "testing",
  isSessionActive?: boolean
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [selectedLevel, setSelectedLevel] = useState<LevelNode | null>(null);

  const testedExercises = useLocalStorage('testedExercises');
  const testedNodes = useMemo<string[]>(
    () => (mode === "testing" ? JSON.parse(testedExercises || '[]') : []),
    [mode, testedExercises]
  );

  const displayLevels = useMemo(() => {
    if (mode !== "testing") return levels;

    // In testing mode, evaluate sequence completely isolated from training.
    return levels.map((level, index) => {
      const firstId = level.firstExerciseId;
      const isCompleted = firstId ? testedNodes.includes(firstId) : false;
      
      const prevLevel = index > 0 ? levels[index - 1] : null;
      const isPrevCompleted = prevLevel && prevLevel.firstExerciseId ? testedNodes.includes(prevLevel.firstExerciseId) : false;
      
      let newStatus: LevelNode['status'] = 'locked';
      if (isCompleted) {
        newStatus = 'completed';
      } else if (index === 0 || isPrevCompleted) {
        newStatus = 'available';
      }
      
      return { ...level, status: newStatus };
    });
  }, [levels, mode, testedNodes]);

  const getWaveY = (x: number) => {
    return WAVE_CONFIG.yOffset + WAVE_CONFIG.amplitude * Math.sin(WAVE_CONFIG.frequency * x);
  };

  const pathData = useMemo(() => {
    const totalWidth = displayLevels.length * WAVE_CONFIG.step + 600;
    let d = `M 0 ${getWaveY(0).toFixed(2)}`;
    for (let x = 0; x <= totalWidth; x += 10) {
      d += ` L ${x} ${getWaveY(x).toFixed(2)}`;
    }
    return d;
  }, [displayLevels.length]);


  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollContainerRef.current || isSessionActive) return;

    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current || isSessionActive) return;
    e.preventDefault();

    const x = e.pageX;
    const walk = (x - startX) * 1.5;

    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (scrollContainerRef.current && !isSessionActive) {
      const currentLevelIndex = displayLevels.findIndex(l => l.status === 'available');

      const targetIndex = currentLevelIndex >= 0 ? currentLevelIndex : 0;

      const scrollPos = (targetIndex * WAVE_CONFIG.step + 200) - (window.innerWidth / 2);

      scrollContainerRef.current.scrollLeft = scrollPos;
    }
  }, [displayLevels, isSessionActive]);

  if (isSessionActive) {
    return (
      <div className="w-full h-full flex items-center justify-center p-10 overflow-auto z-10">
        {selectedLevel && (
          <ExerciseSystem
            groupTitle={selectedLevel.group_title || ""}
            topic={selectedLevel.group_topic || ""}
            exerciseId={selectedLevel.activeExerciseId || ""}
            firstExerciseId={selectedLevel.firstExerciseId}
            levelProgress={selectedLevel.progress}
            onClose={() => setSelectedLevel(null)}
            mode={mode}
          />
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-x-24 gap-y-32 max-w-6xl">
          {displayLevels.map((level) => (
            <div key={level.id} className="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
               {/* Exercise title */}
               <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl shadow-xl border-2 border-[#4d8b7d]/20 text-[#0e2a47] font-black text-lg text-center min-w-[200px]">
                  {level.group_title || "Exercise"}
               </div>

               <div className="relative group transition-transform hover:scale-110">
                  <ProgressRing progress={level.status === 'locked' ? 0 : level.status === 'completed' ? 2 : (level.progress || 0)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => setSelectedLevel(level)}
                      variant={level.status === 'locked' ? "locked" : level.status === 'completed' ? "completed" : "play"}
                      size="play"
                    >
                      {level.status === 'locked' ? (
                        <Lock />
                      ) : level.status === 'completed' ? (
                        <Star fill="currentColor" />
                      ) : (
                        <Play fill="currentColor" />
                      )}
                    </Button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen bg-transparent flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseLeave={stopDragging}
      onMouseUp={stopDragging}
      onMouseMove={handleMouseMove}
    >
      {selectedLevel && (
        <ExerciseSystem
          groupTitle={selectedLevel.group_title || ""}
          topic={selectedLevel.group_topic || ""}
          exerciseId={selectedLevel.activeExerciseId || ""}
          firstExerciseId={selectedLevel.firstExerciseId}
          levelProgress={selectedLevel.progress}
          onClose={() => setSelectedLevel(null)}
          mode={mode}
        />
      )}

      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden relative no-scrollbar" // add pointer-events-none to ensure clicks pass through to parent
      >

        <div
          className="relative h-full pointer-events-auto"
          style={{ width: `${displayLevels.length * WAVE_CONFIG.step + 600}px` }}
        >

          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">

            <path
              d={pathData}
              fill="none"
              stroke="#DBF0F0"
              strokeWidth={WAVE_CONFIG.strokeWidth / 5}
              strokeLinecap="round"
              transform="translate(0, 140)"
            />

            <path
              d={pathData}
              fill="none"
              stroke="#EDF8F8"
              strokeWidth={WAVE_CONFIG.strokeWidth}
              strokeLinecap="round"
            />

          </svg>

          {displayLevels.map((level, index) => {
            const x = index * WAVE_CONFIG.step + 200;
            const y = getWaveY(x);

            return (
              <div
                key={level.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform z-10 
                  ${level.status === 'available' ? 'hover:scale-115' : ''}`}
                style={{ left: x, top: y }}
              >

                <div className="relative group transition-transform ">

                  {/* The Progress Indicator */}
                  {mode === "testing" ? (
                    <BinaryIndicator status={level.status} />
                  ) : (
                    <ProgressRing progress={level.status === 'locked' ? 0 : level.status === 'completed' ? 2 : (level.progress || 0)} />
                  )}

                  {/* The Button*/}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onMouseDown={(e) => e.stopPropagation()}

                      onClick={() => {
                        if (level.status === 'available' || level.status === 'completed') {
                          setSelectedLevel(level);
                        }
                      }}

                      variant={level.status === 'locked' ? "locked" : level.status === 'completed' ? "completed" : "play"}
                      size="play"
                    >
                      {level.status === 'locked' ? (
                        <Lock />
                      ) : level.status === 'completed' ? (
                        <Star fill="currentColor" />
                      ) : (
                        <Play fill="currentColor" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  // Sizes
  const size = 200;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Colors
  const ringColor = '#D9D9D9'; // Grey
  const activeColor = '#FFE53B'; // Yellow

  // Math for the partial ring
  const maxProgress = 2;
  const strokeDashoffset = circumference - (progress / maxProgress) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="pointer-events-none"
    >
      {/* Background Ring (Grey) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />

      {/* Progress Ring (Yellow) */}
      {progress > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </svg>
  );
}

function BinaryIndicator({ status }: { status: "locked" | "available" | "completed" }) {
  const size = 200;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const isCompleted = status === "completed";

  return (
    <svg width={size} height={size} className="pointer-events-none">
      {/* Background Ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={isCompleted ? "#E8F5E9" : "none"} // Light green if done
        stroke={isCompleted ? "#4CAF50" : "#D9D9D9"} // Green or Grey
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}