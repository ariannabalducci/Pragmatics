"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Path, {LevelNode} from "@/components/ui/Path";
import CoinCounter from "@/components/ui/CoinCounter";
import LogoutButton from "@/components/ui/LogoutButton";
import CollectionSystem, {CollectionItem} from "@/components/ui/CollectionSystem";
import ParrotPopUp from "@/components/ui/ParrotPopUp";
import { ArrowLeft } from "lucide-react";



const PathPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [coins, setCoins] = useState(0);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [levels, setLevels] = useState<LevelNode[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [mode, setMode] = useState<"training" | "testing">("training");
  const [dailyLimit, setDailyLimit] = useState<{ 
    training: number; 
    testing: number; 
    prescribed: string[]; 
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        
        if (!token || !userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== "CHILD") {
          router.push("/login");
          return;
        }

        const storedMode = (localStorage.getItem("pragmatics_mode") === "testing" ? "testing" : "training") as "training" | "testing";

        // Today's appointment decides the mode (training or testing).
        const todayRes = await fetch(`/api/appointments/today`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        let forcedMode = storedMode;
        if (todayRes.ok) {
            const todayData = await todayRes.json();
            if (todayData.hasAppointment) {
                setDailyLimit({
                    training: todayData.trainingExercises ?? 0,
                    testing: todayData.testingExercises ?? 0,
                    prescribed: todayData.prescribedExercises || [],
                    isActive: todayData.isActive || false
                });

                if (todayData.sessionMode) {
                    forcedMode = todayData.sessionMode as "training" | "testing";
                    localStorage.setItem("pragmatics_mode", forcedMode);
                }
            }
        }

        const [studentRes, collectionRes] = await Promise.all([
            fetch(`/api/student/${user.id}?mode=${forcedMode}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`/api/student/${user.id}/collection`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        if (!studentRes.ok || !collectionRes.ok) {
            if (studentRes.status === 401 || collectionRes.status === 401) {
                router.push("/login");
                return;
            }
            throw new Error("Failed to fetch data");
        }

        const studentData = await studentRes.json();
        const collectionData = await collectionRes.json();
        
        setMode(forcedMode);

        setCoins(studentData.coins || 0);

        const allLevels: LevelNode[] = (studentData.all_levels || []).map((l: any) => ({
            ...l
        }));

        setLevels(allLevels);
        setActiveTasks(studentData.levels || []);

        const formattedItems: CollectionItem[] = collectionData.map((item: any) => ({
            id: item.parrot_id,
            name: item.name,
            status: item.unlocked ? 'unlocked' : 'locked',
            price: item.price,
            image: item.image_id
        }));

        setCollectionItems(formattedItems);
        setLoading(false);

      } catch (error) {
        console.error("Error loading path data:", error);
        setLoading(false);
      }
    };

    fetchChildData();
  }, [router]);

  const handleUnlock = async (itemId: string | number) => {
    const item = collectionItems.find((i) => i.id === itemId);
    if (!item || item.status === 'unlocked') return;

    if (item.price && coins < item.price) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) return;
        const user = JSON.parse(userStr);

        const res = await fetch(`/api/student/${user.id}/collection`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ parrot_id: itemId })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to unlock");
        }

        setCoins(data.nr_coins);
        setCollectionItems((prev) => prev.map((i) => 
            i.id === itemId ? { ...i, status: 'unlocked' } : i
        ));

    } catch (error: any) {
        console.error("Buy Item Error:", error);
        alert(error.message || "Something went wrong");
    }
  };

  // Apply the session prescription or the daily limit.
  const limitedLevels = (() => {
    if (!dailyLimit || !dailyLimit.isActive) return levels;

    // With a specific prescription, show only the prescribed groups.
    if (dailyLimit.prescribed.length > 0) {
      return levels.filter((level: any) => {
        return dailyLimit.prescribed.includes(level.groupId);
      }).map((level: any) => {
        return { ...level };
      });
    }

    // Otherwise fall back to the numeric daily limit.
    const limit = mode === "testing" ? dailyLimit.testing : dailyLimit.training;
    if (limit === 0) return levels; 
    
    let availableCount = 0;
    return levels.map((level) => {
      if (level.status === 'available') {
        availableCount++;
        if (availableCount > limit) {
          return { ...level, status: 'locked' as const };
        }
      }
      return level;
    });
  })();

  const availableToday = limitedLevels.filter(l => l.status === 'available').length;

  if (loading) {
    return (
        <main className={`relative w-full h-screen overflow-hidden flex items-center justify-center ${mode === "testing" ? "bg-slate-200" : "bg-[#A6DADA]"}`}>
            <div className={`${mode === "testing" ? "text-slate-500" : "text-white"} text-2xl font-bold font-['Mochiy_Pop_One']`}>Loading your adventure...</div>
        </main>
    );
  }

    return (
        <main className={`relative w-full h-screen overflow-hidden ${mode === "testing" ? "bg-slate-100" : "bg-[#A6DADA]"}`}>

          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <button 
              onClick={() => router.push("/select-mode")}
              className="bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-2xl shadow-sm text-slate-700 font-bold text-sm hover:bg-white hover:shadow transition-all"
            >
              <ArrowLeft size={16} strokeWidth={3} /> Mode
            </button>
            <LogoutButton />
          </div>

          <CoinCounter amount={coins} />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none space-y-2 flex flex-col items-center">
            
            {dailyLimit && (
              (mode === "training" ? dailyLimit.training > 0 : dailyLimit.testing > 0) || 
              (dailyLimit.prescribed.length > 0 && dailyLimit.isActive)
            ) && (
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-lg font-bold text-sm ${
                mode === "testing"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-[#3a7a6e]"
              }`}>
                <span className="text-lg">🎯</span>
                <span>
                  {dailyLimit.prescribed.length > 0 && dailyLimit.isActive
                    ? `${availableToday} prescribed exercises left`
                    : `${availableToday} exercises to do today`
                  }
                </span>
              </div>
            )}
            
            {dailyLimit?.isActive && (
              <div className="bg-[#FFE53B] text-[#8B7D00] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm animate-bounce">
                Session in progress ✨
              </div>
            )}
            
          </div>

          {mode !== "testing" && !dailyLimit?.isActive && (
            <Image
              src="/lbush.png"
              alt="Left bush"
              width={400}
              height={400}
              className="absolute top-0 left-0 z-0"
            />
          )}

          <Path 
            levels={limitedLevels} 
            mode={mode} 
            isSessionActive={dailyLimit?.isActive && dailyLimit?.prescribed.length > 0} 
          />

          {dailyLimit?.isActive && dailyLimit?.prescribed.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#A6DADA]/80 backdrop-blur-sm z-40">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md border-4 border-[#4d8b7d]/20 animate-in zoom-in duration-300">
                <div className="text-6xl mb-6">🤫</div>
                <h3 className="text-2xl font-black text-[#0e2a47] mb-4">Session ready!</h3>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Your therapist is getting the exercises ready for you. <br/>
                  Wait a moment or ask them what to do!
                </p>
              </div>
            </div>
          )}

          {mode !== "testing" && !dailyLimit?.isActive && (
            <Image
              src="/rbush.png"
              alt="Right bush"
              width={600}
              height={600}
              className="absolute bottom-0 right-0 z-10"
            />
          )}

          <CollectionSystem 
            collectionItems={collectionItems} 
            onUnlock={handleUnlock}
            coins={coins}
          />

          {(!dailyLimit?.isActive || dailyLimit?.prescribed.length === 0) && (
            <ParrotPopUp nodes={activeTasks} />
          )}
         
      </main>
    );
};

export default PathPage;