"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/sleeptrack", label: "Sleep" },
  { href: "/mindtrack", label: "Mind" },
  { href: "/skintrack", label: "Skin" },
  { href: "/gastro", label: "Gastro" },
  { href: "/remedies", label: "Remedies" },
  { href: "/integrations", label: "Integrations" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Health Helper
            </Link>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
} 