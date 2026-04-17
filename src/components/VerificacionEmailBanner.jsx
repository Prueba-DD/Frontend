import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerificacionEmailBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.email_verificado || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-sm">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-amber-200">
          Tu correo aún no está verificado.{' '}
          <Link
            to="/verificar-email"
            className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            Verificar ahora
          </Link>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
        aria-label="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
