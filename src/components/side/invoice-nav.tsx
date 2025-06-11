import React from "react";
import Link from "next/link";

const navItems = [
  { label: "所有發票", href: "/owner/invoice" },
  { label: "新增發票", href: "/owner/invoice/create" },
];

const InvoiceNav: React.FC = () => {
  return (
    <nav className="w-56 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">發票選單</h2>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default InvoiceNav;
