"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Path, {LevelNode} from "@/components/ui/Path";
import CoinCounter from "@/components/ui/CoinCounter";
import LogoutButton from "@/components/ui/LogoutButton";
import CollectionSystem, {CollectionItem} from "@/components/ui/CollectionSystem";
import ParrotPopUp from "@/components/ui/ParrotPopUp";



const PathPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [coins, setCoins] = useState(0);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [levels, setLevels] = useState<LevelNode[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [mode, setMode] = useState<"training" | "testing">("training");

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

        const [studentRes, collectionRes] = await Promise.all([
            fetch(`/api/student/${user.id}`, {
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
        
        const storedMode = localStorage.getItem("pragmatics_mode");
        if (storedMode === "testing" || storedMode === "training") {
            setMode(storedMode);
        }

        setCoins(studentData.coins || 0);

        const completedNodes: LevelNode[] = Array.from(
            { length: studentData.nr_completed }, 
            (_, i) => ({ id: `completed-${i}`, status: 'completed' })
        );

        const activeNodes: LevelNode[] = studentData.levels || [];
        
        setActiveTasks(activeNodes);

        const blockedNodes: LevelNode[] = Array.from(
            { length: studentData.nr_blocked }, 
            (_, i) => ({ id: `blocked-${i}`, status: 'locked' })
        );

        if (storedMode === "testing") {
            setLevels(studentData.all_levels || []);
        } else {
            setLevels([...completedNodes, ...activeNodes, ...blockedNodes]);
        }

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

  if (loading) {
    return (
        <main className={`relative w-full h-screen overflow-hidden flex items-center justify-center ${mode === "testing" ? "bg-slate-200" : "bg-[#A6DADA]"}`}>
            <div className={`${mode === "testing" ? "text-slate-500" : "text-white"} text-2xl font-bold font-['Mochiy_Pop_One']`}>Caricamento avventura...</div>
        </main>
    );
  }

    return (
        <main className={`relative w-full h-screen overflow-hidden ${mode === "testing" ? "bg-slate-100" : "bg-[#A6DADA]"}`}>

          <div className="absolute top-4 left-4 z-20">
            <LogoutButton />
          </div>

          <CoinCounter amount={coins} />

          {mode !== "testing" && (
            <Image
              src="/lbush.png"
              alt="Left bush"
              width={400}
              height={400}
              className="absolute top-0 left-0 z-0"
            />
          )}

          <Path levels={levels} mode={mode} />

          {mode !== "testing" && (
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

          <ParrotPopUp nodes={activeTasks} />
         
      </main>
    );
};

export default PathPage;