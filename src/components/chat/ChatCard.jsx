// FE-28 · Tarjeta compacta de reporte o alerta en el chat.
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const BADGE_STYLES = {
  green:  'bg-green-100  text-green-700',
  teal:   'bg-teal-100   text-teal-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100    text-red-700',
  default:'bg-gray-100   text-gray-600',
};

/**
 * @param {{
 *   titulo: string,
 *   descripcion?: string,
 *   badge?: string,
 *   badgeColor?: 'green'|'teal'|'yellow'|'red',
 *   link?: string
 * }} props
 */
export default function ChatCard({ titulo, descripcion, badge, badgeColor = 'default', link }) {
  const navigate = useNavigate();
  const badgeStyle = BADGE_STYLES[badgeColor] ?? BADGE_STYLES.default;

  function handleClick() {
    if (link) navigate(link);
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-3 shadow-sm${link ? ' cursor-pointer hover:border-green-400 hover:shadow-md transition-all' : ''}`}
      onClick={handleClick}
      role={link ? 'button' : undefined}
      tabIndex={link ? 0 : undefined}
      onKeyDown={link ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{titulo}</p>
        {descripcion && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{descripcion}</p>
        )}
        {badge && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
            {badge}
          </span>
        )}
      </div>
      {link && (
        <ArrowRight size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      )}
    </div>
  );
}
