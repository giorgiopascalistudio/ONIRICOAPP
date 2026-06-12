/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutGrid, Calendar, Folder, FileText, Users, Bell, Target, Inbox } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { initials } from '../utils';

interface NavbarProps {
  route: string;
  profile: UserProfile | null;
  onNav: (route: string) => void;
  onOpenProfile: () => void;
  title: string;
  actionButton?: React.ReactNode;
  notificationsCount: number;
  onNotificationsClick: () => void;
  /** richieste di accesso in attesa (admin/manager) — badge sul profilo mobile */
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  route,
  profile,
  onNav,
  onOpenProfile,
  title,
  actionButton,
  notificationsCount,
  onNotificationsClick,
  pendingCount = 0
}) => {
  if (!profile) return null;

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'calendario', label: 'Agenda', icon: Calendar },
    { id: 'progetti', label: 'Progetti', icon: Folder },
    ...(profile.role === 'admin' || profile.role === 'manager'
      ? [{ id: 'crm', label: 'CRM', icon: Target }, { id: 'richieste-clienti', label: 'Richieste', icon: Inbox }]
      : []),
    { id: 'documenti', label: 'Documenti', icon: FileText },
    ...(profile.role === 'admin' ? [{ id: 'team', label: 'Team', icon: Users }] : [])
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <div className="flex md:hidden items-center justify-between gap-4 px-[18px] py-[14px] bg-white border-b border-[#ececec] sticky top-0 z-[40]">
        <div className="flex items-center gap-2">
          {/* Customized Logo with styled Onirico font */}
          <span className="font-extrabold text-[18px] tracking-tight text-[#161616] font-sans antialiased">
            Onirico<span className="text-[#8a8a8a] font-normal"> · OS</span>
          </span>
        </div>

        {/* Removed current section title: "togli i testi inerenti alla sezione dove ci troviamo" */}

        <div className="flex items-center gap-2.5 ml-auto">
          <div className="m-actions-mobile inline-flex items-center">
            {actionButton}
          </div>
          
          {/* Notification Button */}
          <button
            onClick={onNotificationsClick}
            className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all active:scale-95"
            aria-label="Notifiche"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationsCount > 0 && (
              <span className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-red-500 ring-1.5 ring-white animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenProfile}
            className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center text-white text-[11px] font-bold border-none bg-[#f1f1f1] cursor-pointer active:scale-95 transition-transform"
            aria-label="Profilo"
            style={{
              background:
                profile.role === 'admin'
                  ? '#1b1b1b'
                  : profile.role === 'manager'
                  ? '#6e6e6e'
                  : '#3d3d3d'
            }}
          >
            {initials(profile.name)}
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Bottom Navigation Tab bar (Only on Mobile) */}
      {route !== 'progetto' && (
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-[50] bg-transparent border-none p-0 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] px-5 justify-center pointer-events-none">
          <div className="flex items-center gap-1 bg-[#161616] rounded-full p-2 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)] pointer-events-auto w-full max-w-[420px] justify-between">
            {tabs.map(tab => {
              const isActive =
                route === tab.id || (tab.id === 'progetti' && route === 'progetto');
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onNav(tab.id)}
                  className={`relative flex-1 inline-flex items-center justify-center gap-1.5 border-none bg-transparent py-3 px-2 rounded-full font-bold text-[13px] sm:text-[14px] cursor-pointer transition-colors duration-300 select-none ${
                    isActive
                      ? 'text-[#161616] flex-[1.4]'
                      : 'text-[#9a9a9a] hover:text-white'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Underlay Active Pill animation using layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavActivePill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0"
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-center gap-1.5">
                    <Icon className="w-[21px] h-[21px] flex-shrink-0" />
                    <span
                      className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${
                        isActive ? 'max-w-[120px] opacity-100 font-bold' : 'max-w-0 opacity-0'
                      }`}
                    >
                      <span className="pr-1">{tab.label}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
