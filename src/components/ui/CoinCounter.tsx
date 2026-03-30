import { Star } from "lucide-react";

export default function CoinCounter({ amount = 0 }: { amount?: number }) {
  return (
    <div className="absolute top-6 right-6 z-50 pointer-events-none">
      <div className="relative flex items-center">
        
        <div className="absolute -left-6 z-20 flex items-center justify-center w-14 h-14 bg-[#FFE53B] rounded-full border-4 border-[#FFCC00] shadow-md">
          <Star fill="white" className="text-white w-8 h-8" />
        </div>

        <div className="bg-white h-10 pl-10 pr-6 flex items-center rounded-full shadow-sm border border-slate-100">
          <span className="text-slate-600 font-black text-xl tracking-wide">
            {amount}
          </span>
        </div>

      </div>
    </div>
  );
}