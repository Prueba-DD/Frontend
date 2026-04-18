/**
 * PasswordStrengthIndicator — barra de fortaleza + popover flotante de requisitos.
 * Props:
 *  password — string a evaluar
 *  focused  — boolean, muestra el popover con los requisitos (sin afectar el layout)
 */
const checks = [
  { label: 'Mínimo 8 caracteres',          test: (p) => p.length >= 8 },
  { label: 'Al menos una mayúscula',        test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una minúscula',        test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número',            test: (p) => /\d/.test(p) },
  { label: 'Al menos un carácter especial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  if (!password) return 0;
  return checks.filter((c) => c.test(password)).length;
}

const strengthConfig = [
  { label: '',          color: 'bg-gray-700' },
  { label: 'Muy débil', color: 'bg-red-500' },
  { label: 'Débil',     color: 'bg-red-400' },
  { label: 'Regular',   color: 'bg-orange-400' },
  { label: 'Buena',     color: 'bg-yellow-400' },
  { label: 'Fuerte',    color: 'bg-green-500' },
];

export default function PasswordStrengthIndicator({ password, focused = false }) {
  const strength    = getStrength(password);
  const config      = strengthConfig[strength];
  const showPopover = focused && password.length > 0;

  return (
    <div className="relative mt-2">
      {/* Barra de segmentos — siempre inline, no empuja el layout */}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              seg <= strength ? config.color : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Etiqueta de nivel */}
      {password.length > 0 && (
        <p className={`text-xs mt-1 font-medium ${
          strength <= 2 ? 'text-red-400' :
          strength === 3 ? 'text-orange-400' :
          strength === 4 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {config.label}
        </p>
      )}

      {/* Popover flotante — absolute, no empuja campos */}
      {showPopover && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-gray-900 border border-gray-700/80 rounded-xl p-3.5 shadow-2xl shadow-black/50 pointer-events-none">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2.5">Requisitos</p>
          <ul className="space-y-1.5">
            {checks.map(({ label, test }) => {
              const ok = test(password);
              return (
                <li key={label} className={`flex items-center gap-2 text-xs ${ ok ? 'text-green-400' : 'text-gray-500' }`}>
                  <span className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${ ok ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/80 text-gray-600' }`}>
                    {ok ? '✓' : '○'}
                  </span>
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

