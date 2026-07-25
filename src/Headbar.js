import { Home, User } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: User },
];

export default function Headbar({ page, setPage }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="px-6 h-14 flex items-center gap-1 relative">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors ${
              page === id
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-stone-800 pointer-events-none">
          AI Interview Assistant
        </span>
      </nav>
    </header>
  );
}