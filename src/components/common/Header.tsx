import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

export type NavView =
  | 'HOME'
  | 'LIVE'
  | 'CALENDAR'
  | 'CIRCUITS'
  | 'STANDINGS'
  | 'TEAMS'
  | 'RESULTS'
  | 'DRIVER'
  | 'TEAM';

interface HeaderProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

const navItems: { id: NavView; label: string }[] = [
  { id: 'HOME', label: 'Grid' },
  { id: 'CALENDAR', label: 'Calendar' },
  { id: 'CIRCUITS', label: 'Circuits' },
  { id: 'TEAMS', label: 'Teams' },
  { id: 'STANDINGS', label: 'Standings' },
];

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(105deg,rgba(13,14,18,0.84),rgba(17,19,24,0.72),rgba(10,11,14,0.86))] shadow-[0_8px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl"
    >
      <div className="relative mx-auto flex h-16 items-center justify-between px-5 sm:px-10">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleNavClick('HOME')}
          aria-label="F1 Hub home"
          className="flex h-12 items-center gap-3"
        >
          <img
            src="/assets/f1-logo.jpg"
            alt=""
            draggable={false}
            className="h-[12px] w-[72px] object-cover"
            style={{
              filter: 'grayscale(1) brightness(3) contrast(100)',
              mixBlendMode: 'screen',
            }}
          />
          <span className="font-racing text-[15px] font-bold uppercase tracking-[0.1em] text-white">
            F1 Hub
          </span>
        </motion.button>

        <nav
          aria-label="Main navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 lg:flex xl:gap-7"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-2 font-racing text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  isActive ? 'text-white' : 'text-white/65 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="header-active-link"
                    className="absolute -bottom-[1px] left-0 right-0 h-px bg-red-500"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <motion.button
            type="button"
            whileHover={{ backgroundColor: 'rgba(212,21,20,0.12)', borderColor: 'rgba(255,255,255,0.9)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleNavClick('LIVE')}
            className={`h-7 rounded-[3px] border px-3 font-racing text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeView === 'LIVE'
                ? 'border-red-500 text-red-400'
                : 'border-white/75 text-red-500'
            }`}
          >
            Watch Live
          </motion.button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="rounded border border-white/15 p-2 text-white/80 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-[#0b0c10]/95 px-5 py-3 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`py-3 text-left font-racing text-xs font-bold uppercase tracking-[0.12em] ${
                    activeView === item.id ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
