/**
 * PasswordStrengthIndicator — barra de fortaleza de contraseña.
 * Props:
 *  password         — string a evaluar
 *  showRequirements — boolean, muestra la lista de requisitos
 */
const checks = [
  { label: 'Mínimo 8 caracteres',              test: (p) => p.length >= 8 },
  { label: 'Al menos una letra mayúscula',     test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una letra minúscula',     test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número',               test: (p) => /\d/.test(p) },
  { label: 'Al menos un carácter especial',    test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  if (!password) return 0;
  return checks.filter((c) => c.test(password)).length;
}

const strengthConfig = [
  { label: '',        color: 'bg-gray-700' },
  { label: 'Muy débil', color: 'bg-red-500' },
  { label: 'Débil',    color: 'bg-red-400' },
  { label: 'Regular',  color: 'bg-orange-400' },
  { label: 'Buena',    color: 'bg-yellow-400' },
  { label: 'Fuerte',   color: 'bg-green-500' },
];

export default function PasswordStrengthIndicator({ password, showRequirements = true }) {
  const strength = getStrength(password);
  const config   = strengthConfig[strength];

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de segmentos */}
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

      {/* Etiqueta */}
      {password.length > 0 && (
        <p className={`text-xs font-medium ${
          strength <= 2 ? 'text-red-400' :
          strength === 3 ? 'text-orange-400' :
          strength === 4 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {config.label}
        </p>
      )}

      {/* Lista de requisitos */}
      {showRequirements && password.length > 0 && (
        <ul className="space-y-1 mt-1">
          {checks.map(({ label, test }) => {
            const ok = test(password);
            return (
              <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{ok ? '✓' : '○'}</span>
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
