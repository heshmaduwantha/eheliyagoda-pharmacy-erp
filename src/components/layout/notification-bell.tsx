"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import type { AlertCounts } from "@/modules/dashboard/dashboard.service";

export function NotificationBell({ alerts }: { alerts: AlertCounts }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalAlerts = alerts.lowStockCount + alerts.nearExpiryCount + alerts.expiredCount + alerts.overdueCount;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative grid size-9 place-items-center rounded-full border transition-colors ${
          isOpen 
            ? "border-teal-500 bg-teal-50 text-teal-600" 
            : "border-slate-200 text-slate-400 hover:border-teal-200 hover:text-teal-600"
        }`}
      >
        <Bell className="size-4" />
        {totalAlerts > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {totalAlerts > 9 ? "9+" : totalAlerts}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg focus:outline-none z-50">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto py-2">
            {totalAlerts === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-slate-50">
                  <Bell className="size-5 text-slate-400" />
                </div>
                You&apos;re all caught up!
              </div>
            ) : (
              <div className="flex flex-col">
                {alerts.lowStockCount > 0 && (
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Low stock alert</p>
                      <p className="text-xs font-medium text-slate-500">
                        {alerts.lowStockCount} product{alerts.lowStockCount === 1 ? "" : "s"} at or below reorder level.
                      </p>
                    </div>
                  </Link>
                )}

                {alerts.nearExpiryCount > 0 && (
                  <Link
                    href="/stock/batches"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Near expiry alert</p>
                      <p className="text-xs font-medium text-slate-500">
                        {alerts.nearExpiryCount} batch{alerts.nearExpiryCount === 1 ? "" : "es"} expiring within 30 days.
                      </p>
                    </div>
                  </Link>
                )}

                {alerts.expiredCount > 0 && (
                  <Link
                    href="/stock/batches"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Expired stock alert</p>
                      <p className="text-xs font-medium text-slate-500">
                        {alerts.expiredCount} batch{alerts.expiredCount === 1 ? "" : "es"} already expired.
                      </p>
                    </div>
                  </Link>
                )}

                {alerts.overdueCount > 0 && (
                  <Link
                    href="/suppliers/payments"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Overdue payables</p>
                      <p className="text-xs font-medium text-slate-500">
                        {alerts.overdueCount} supplier invoice{alerts.overdueCount === 1 ? "" : "s"} overdue.
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
