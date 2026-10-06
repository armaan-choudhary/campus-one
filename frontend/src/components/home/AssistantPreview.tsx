'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles } from 'lucide-react';
import { HandwrittenNote } from './HandwrittenElements';

const DOMAIN_INDICATORS = [
  { id: 'academic', label: 'Academic', example: 'I missed my midterm after being hospitalised. What can I do?' },
  { id: 'finance', label: 'Finance', example: 'Can I get a refund for my hostel fee?' },
  { id: 'it', label: 'IT Helpdesk', example: "Wi-Fi isn't working in my hostel." },
  { id: 'facilities', label: 'Facilities', example: 'The AC unit in lecture hall 3 is leaking water.' },
  { id: 'admin', label: 'Administration', example: 'I lost my ID card, how do I get a new one?' },
];

export const AssistantPreview: React.FC = () => {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState('academic');
  const [question, setQuestion] = useState(
    'I missed my midterm after being hospitalised. What can I do?'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = question.trim() || 'I missed my midterm after being hospitalised. What can I do?';
    router.push(`/workspace?role=student&q=${encodeURIComponent(query)}`);
  };

  const handleSelectDomain = (domainId: string, exampleText: string) => {
    setSelectedDomain(domainId);
    setQuestion(exampleText);
  };

  return (
    <div className="relative z-30 -mt-10 sm:-mt-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Main Dark Floating Assistant Widget */}
      <div className="relative w-full bg-[#121316] border border-[#23242A] rounded-2xl shadow-2xl p-4 sm:p-5 text-white font-sans">
        {/* Top Header Label */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#8E8F94]" />
          <span className="text-xs font-medium text-[#8E8F94] tracking-tight">
            Ask CampusOne
          </span>
        </div>

        {/* Input Row with Send Button */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-[#1A1C22] border border-[#2A2B33] focus-within:border-[#4B5563] rounded-xl px-4 py-2.5 transition-colors">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything across academic, finance, IT, facilities..."
              className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-[#666666] focus:outline-hidden pr-2 leading-relaxed"
            />
            <button
              type="submit"
              aria-label="Send question"
              className="w-8 h-8 rounded-lg bg-[#272932] hover:bg-[#343743] active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Pills Row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {DOMAIN_INDICATORS.map((domain) => {
              const isActive = selectedDomain === domain.id;
              return (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => handleSelectDomain(domain.id, domain.example)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#1C1E26] text-white border-[#3F4350]'
                      : 'bg-[#16171D] text-[#A1A1AA] border-[#252730] hover:text-white hover:border-[#353844]'
                  }`}
                >
                  <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
                  <span>{domain.label}</span>
                </button>
              );
            })}
          </div>
        </form>
      </div>

      {/* Handwritten Annotation below at the bottom right pointing to send button */}
      <div className="flex justify-end pr-2 sm:pr-4 pt-1 pointer-events-none">
        <HandwrittenNote
          text={"Try a\nreal question."}
          arrowDirection="curve-up"
          color="#D4D4D8"
          textSize="text-xs sm:text-sm"
        />
      </div>
    </div>
  );
};
