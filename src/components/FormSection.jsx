/**
 * FormSection — contenedor de sección reutilizable para Profile y Settings.
 * Props:
 *  title    — texto del encabezado
 *  icon     — componente Lucide (opcional)
 *  danger   — boolean, activa estilo rojo de zona peligrosa
 *  children — contenido interno
 */
export default function FormSection({ title, icon: Icon, danger = false, children }) {
  return (
    <section
      className={`rounded-xl border p-5 sm:p-6 ${
        danger
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-gray-800 bg-gray-900'
      }`}
    >
      <div className={`flex items-center gap-2.5 mb-5 pb-4 border-b ${danger ? 'border-red-500/20' : 'border-gray-800'}`}>
        {Icon && (
          <Icon
            className={`w-4.5 h-4.5 shrink-0 ${danger ? 'text-red-400' : 'text-green-400'}`}
            size={18}
          />
        )}
        <h2 className={`text-base font-semibold ${danger ? 'text-red-300' : 'text-white'}`}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
