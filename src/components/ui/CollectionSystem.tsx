"use client";

import { useState } from "react";
import { X, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CollectionItem {
  id: string | number;
  name: string;
  status: 'locked' | 'unlocked';
  price?: number;
  image?: string;
  color?: string;
}

export default function CollectionSystem({ 
    collectionItems, 
    onUnlock,
    coins = 0 
}: { 
    collectionItems: CollectionItem[], 
    onUnlock?: (id: string | number) => void,
    coins: number
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

  const handleCardClick = (item: CollectionItem) => {
    if (item.status === 'locked') {
        setSelectedItem(item);
    }
  };

  const confirmPurchase = () => {
    if (selectedItem && onUnlock) {
        onUnlock(selectedItem.id);
        setSelectedItem(null);
    }
  };

  return (
    <>
      <div className="absolute bottom-10 left-15 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex flex-col items-center justify-end w-40 h-40 focus:outline-none"
        >
          <div className="absolute bottom-5 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-125">
             <img 
                src="/path/book.png" 
                alt="Collection"
                className="w-40 drop-shadow-lg transition-opacity duration-300 group-hover:opacity-0 cursor-pointer" 
             />
             <img 
                src="/path/book-hover.png" 
                alt="Collection Hover"
                className="absolute top-0 left-0 w-40 drop-shadow-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 cursor-pointer" 
             />
          </div>

          <div className="bg-[#62B4A5] text-white font-black tracking-widest text-sm py-2 px-6 rounded-full border-b-4 border-[#4a8f82] shadow-lg group-active:border-b-0 group-active:translate-y-1 transition-all">
              COLLECTION
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            <div className="relative z-10 max-w-5xl w-full aspect-16/10 bg-[#FDE047] rounded-[30px] shadow-2xl flex p-3 md:p-5 border-b-[12px] border-r-[12px] border-[#EAB308]">
                
                <button 
                    onClick={() => setIsOpen(false)}
                    className="bg-[#62B4A5] absolute -top-4 -left-4 z-50 w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                    <X size={28} strokeWidth={3} />
                </button>

                <div className="absolute left-1/2 -top-1 -bottom-3 w-12 -translate-x-1/2 z-30 pointer-events-none filter drop-shadow-md">
                    <div className="w-full h-full bg-[#E87D57] relative">
                        <div className="absolute -bottom-4 left-0 w-0 h-0 border-l-24 border-l-transparent border-r-24 border-r-transparent border-t-20 border-t-[#E87D57]" />
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-l-2xl shadow-inner relative overflow-hidden flex flex-col border-r border-gray-200">
                    <div className="absolute top-0 right-0 w-16 h-full bg-linear-to-l from-black/10 to-transparent pointer-events-none z-10" />
                    <div className="flex-1 p-4 md:p-8">
                        <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
                            {collectionItems.slice(0, 6).map((item) => (
                                <CollectionCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
                            ))}
                        </div>
                    </div>
                    <div className="h-12 flex items-center justify-between px-8 text-gray-400 font-bold border-t border-dashed border-gray-200">
                         <span>1</span>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-r-2xl shadow-inner relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-16 h-full bg-linear-to-r from-black/10 to-transparent pointer-events-none z-10" />
                    <div className="flex-1 p-4 md:p-8">
                         <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
                            {collectionItems.slice(6, 12).map((item) => (
                                <CollectionCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
                            ))}
                        </div>
                    </div>
                    <div className="h-12 flex items-center justify-end px-8 text-gray-400 font-bold border-t border-dashed border-gray-200">
                         <span>2</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute inset-0" onClick={() => setSelectedItem(null)} />
            
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 flex flex-col items-center gap-6 border-b-8 border-slate-200 shadow-2xl relative animate-in slide-in-from-bottom-5">
                
                <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={32} strokeWidth={3} />
                </button>
                
                <h2 className="text-2xl font-black text-slate-700 uppercase tracking-wide mt-2">
                    {selectedItem.price && coins >= selectedItem.price ? "Unlock Parrot?" : "Oh no!"}
                </h2>

                <div className="relative w-48 h-48 bg-[#E0F2F1] rounded-full flex items-center justify-center border-4 border-[#B2DFDB]">
                    <img 
                        src={`/collection/${selectedItem.image}.png`} 
                        alt={selectedItem.name}
                        className="w-40 h-40 object-contain drop-shadow-md z-10"
                    />
                    {coins < (selectedItem.price || 0) && (
                        <div className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full border-4 border-white shadow-lg">
                            <Lock size={20} />
                        </div>
                    )}
                </div>

                <div className="text-center space-y-3 w-full">
                     <p className="text-xl font-bold text-slate-600">{selectedItem.name}</p>
                     
                     <div className="flex flex-col items-center justify-center gap-2">
                         <div className="flex items-center justify-center gap-2 bg-[#FFF9C4] px-6 py-2 rounded-full border border-[#FBC02D] shadow-sm">
                            <span className={`font-black text-2xl ${coins >= (selectedItem.price || 0) ? "text-[#F57F17]" : "text-red-500"}`}>
                                {selectedItem.price}
                            </span>
                            <Star fill="#FBC02D" className="text-[#FBC02D] w-6 h-6" />
                         </div>
                         
                         {coins < (selectedItem.price || 0) && (
                             <p className="text-sm font-bold text-red-400 mt-1">
                                You need <span className="text-red-500 text-lg">{selectedItem.price! - coins}</span> more coins!
                             </p>
                         )}
                     </div>
                </div>

                <div className="flex gap-3 w-full mt-2">
                    {coins >= (selectedItem.price || 0) ? (
                        <>
                            <Button 
                                variant="back" 
                                onClick={() => setSelectedItem(null)} 
                                className="flex-1 h-14 text-lg"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={confirmPurchase} 
                                className="flex-1 h-14 text-lg"
                            >
                                Buy
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="back" 
                            onClick={() => setSelectedItem(null)} 
                            className="w-full h-14 text-lg"
                        >
                            Okay
                        </Button>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
}

function CollectionCard({ item, onClick }: { item: any, onClick?: () => void }) {
    const isLocked = item.status === 'locked';
    return (
        <div 
            onClick={onClick}
            className={`flex flex-col items-center justify-center bg-white border-2 border-slate-100 rounded-xl shadow-sm p-2 hover:shadow-md transition-shadow h-full ${isLocked ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
        >
            <div className="flex-1 w-full flex items-center justify-center relative">
                {isLocked ? (
                    <div className="text-gray-200">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mask-image">
                             <Lock size={24} className="text-gray-400" />
                        </div>
                    </div>
                ) : (
                    <div className="w-32 h-32">
                        <img
                            src={`/collection/${item.image}.png`}
                            alt={item.name}
                            width={"full"}
                            className="object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    </div>
                )}
            </div>
            {isLocked ? (
                <div className="flex flex-row gap-1 justify-center items-center mt-1">
                    <span className="mb-1 h-4 font-bold text-[#D9D9D9] text-sm">{item.price}</span>
                    <div className="flex items-center justify-center w-4 h-4 bg-[#FFE53B] rounded-full border border-[#FFCC00] shadow-md ">
                    <Star fill="white" className="text-white w-2 h-2" />
        </div>
                </div>
            ) : (
                 <span className="mt-2 font-bold text-slate-700 text-sm">{item.name}</span>
            )}
        </div>
    );
}