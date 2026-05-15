// FE-28 · Burbuja individual del chat.
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import AurelAvatar from './AurelAvatar';
import ChatCard from './ChatCard';

export default function ChatBubble({ role, content, sugerencias = [], cards = [], fuente, onPrompt, estadoAmbiental = 'optimo' }) {
  const navigate = useNavigate();
  const isUser = role === 'user';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <AurelAvatar size="xs" estado={estadoAmbiental} showDot={false} />
      )}

      <div className={`max-w-[78%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-green-600 text-white rounded-br-sm'
              : 'bg-gray-800/90 text-gray-100 border border-gray-700 rounded-bl-sm'
          }`}
        >
          {content}
        </div>

        {!isUser && Array.isArray(cards) && cards.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {cards.map((card, i) => (
              <ChatCard key={i} {...card} />
            ))}
          </div>
        )}

        {!isUser && Array.isArray(sugerencias) && sugerencias.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (s.to) navigate(s.to);
                  else if (s.prompt && typeof onPrompt === 'function') onPrompt(s.prompt);
                }}
                className="text-xs px-2 py-1 rounded-full bg-green-600/15 hover:bg-green-600/25 text-green-300 border border-green-600/30 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {!isUser && fuente && fuente !== 'offline' && fuente !== 'error' && (
          <div className="mt-1 text-[10px] text-gray-500">
            vía {fuente}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 order-2">
          <User size={14} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}
