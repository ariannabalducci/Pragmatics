"use client";
import { useState } from "react";
import { Send, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleClear = () => {
    setMessage("");
  };

  return (
    <div className="relative w-full gap-3">
      <div
        className={`
          flex items-center border border-black/10 p-3 m-4   rounded-3xl
          bg-white 
          shadow-md transition-all duration-200 
        
        `}
      >
        <div className="relative flex-1 mx-2">
          <textarea
            className="text-black w-full px-3 py-2 bg-transparent border-none focus:outline-none"
            placeholder="Write your answer here..."
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
          />

          {/* Clear button - only show when text is present */}
          {message && (
            <button
              className="absolute right-0 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 "
              onClick={handleClear}
              aria-label="Clear input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center">

          {/* Send button */}
          <button
            className={`
              p-2 rounded-full transition-all
              ${
                message.trim()
                  ? "bg-[#62B4A5] text-white hover:bg-[#62B4A5]"
                  : "bg-gray-200 text-gray-400  cursor-not-allowed"
              }
            `}
            onClick={handleSend}
            disabled={!message.trim()}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
