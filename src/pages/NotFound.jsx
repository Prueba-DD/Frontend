import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-extrabold text-green-500 select-none">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Página no encontrada</h1>
      <p className="mt-2 text-gray-400 text-sm max-w-xs">
        La ruta que buscas no existe o fue movida.
      </p>
      <Link to="/" className="mt-8 btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
