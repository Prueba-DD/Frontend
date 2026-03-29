import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <span className="text-green-500 font-semibold">GreenAlert</span> © {new Date().getFullYear()} — Monitoreo Ambiental Ciudadano
      </footer>
    </div>
  );
}
