import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '../brand/Wordmark';
import { useAuth } from '../../lib/auth/AuthContext';
import { SAMPLE_DESCRIPTORS } from '../../mocks/samples';
import { ChevronDown, Command, Menu, X, User as UserIcon } from 'lucide-react';

export function FloatingNav({ onOpenCommandPalette }: { onOpenCommandPalette: () => void }) {
  const location = useLocation();
  const { user, status, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSamplesPopover, setShowSamplesPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isUploadPage = location.pathname === '/upload';

  return (
    <header className="fixed top-3 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left Wordmark */}
        <Link to="/" className="flex items-center group py-2" aria-label="StageSense Home">
          <Wordmark />
        </Link>

        {/* Centered Glass Navigation Pill */}
        <nav
          className={`hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all duration-300 ${
            isScrolled
              ? 'bg-[#0B1A2D]/85 backdrop-blur-xl border-[#79C8DF]/30 shadow-[0_8px_32px_rgba(2,8,16,0.6)] py-1'
              : 'bg-[#10243B]/60 backdrop-blur-md border-[#17324F]'
          }`}
          aria-label="Main Navigation"
        >
          <Link
            to="/#product"
            className="px-3 py-1 rounded-full text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] hover:bg-[#17324F]/50 transition-colors"
          >
            Product
          </Link>

          {/* Samples Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSamplesPopover(!showSamplesPopover)}
              onBlur={() => setTimeout(() => setShowSamplesPopover(false), 200)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] hover:bg-[#17324F]/50 transition-colors"
              aria-expanded={showSamplesPopover}
            >
              <span>Samples</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSamplesPopover && (
              <div className="absolute top-full mt-2 -left-4 w-72 p-2 rounded-2xl bg-[#08101F]/95 backdrop-blur-xl border border-[#17324F] shadow-2xl flex flex-col gap-1 z-50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7C93A9] px-2 py-1">
                  Sample Presentation Reports
                </span>
                {SAMPLE_DESCRIPTORS.map((s) => (
                  <Link
                    key={s.id}
                    to={`/samples/${s.id}`}
                    onClick={() => setShowSamplesPopover(false)}
                    className="p-2 rounded-xl hover:bg-[#10243B] flex flex-col transition-colors text-left"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#F7FAFC]">
                      <span>{s.title}</span>
                      <span className="font-mono text-[10px] text-[#79C8DF]">{s.score} score</span>
                    </div>
                    <span className="text-[11px] text-[#9AAFC2]">{s.subtitle}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/methodology"
            className="px-3 py-1 rounded-full text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] hover:bg-[#17324F]/50 transition-colors"
          >
            Methodology
          </Link>

          <Link
            to="/history"
            className="px-3 py-1 rounded-full text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] hover:bg-[#17324F]/50 transition-colors"
          >
            History
          </Link>
        </nav>

        {/* Right Section: ⌘K, Auth & Analyze Pill */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* ⌘K Trigger Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#10243B]/60 backdrop-blur-md border border-[#17324F] hover:border-[#79C8DF] text-xs font-mono text-[#7C93A9] hover:text-[#DCEFF8] transition-colors"
            title="Search commands (⌘K / Ctrl+K)"
          >
            <Command className="w-3 h-3" />
            <span>⌘K</span>
          </button>

          {/* User Status / Login */}
          {status === 'authenticated' || status === 'guest' ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#17324F] bg-[#10243B]/60 text-xs font-mono text-[#DCEFF8] hover:border-[#79C8DF]"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#79C8DF]" />
                <span className="truncate max-w-[100px]">{user?.display_name || 'Guest'}</span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 p-2 rounded-xl bg-[#08101F] border border-[#17324F] shadow-xl flex flex-col gap-1 text-xs font-mono z-50">
                  <div className="px-2 py-1 text-[#7C93A9] border-b border-[#17324F]">
                    {user?.email}
                  </div>
                  <Link
                    to="/history"
                    className="px-2 py-1.5 rounded hover:bg-[#10243B] text-[#DCEFF8]"
                  >
                    My History
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-2 py-1.5 rounded hover:bg-[#10243B] text-[#F2766B] text-left"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-mono text-[#9AAFC2] hover:text-[#F7FAFC] px-2 py-1"
            >
              Sign in
            </Link>
          )}

          {/* Primary Action Button */}
          {!isUploadPage && (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#F7FAFC] text-[#07111F] text-xs font-semibold hover:bg-[#DCEFF8] hover:shadow-[0_0_20px_rgba(121,200,223,0.6)] transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Analyze a Presentation
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 rounded-full bg-[#10243B] border border-[#17324F] text-[#9AAFC2]"
            aria-label="Command palette"
          >
            <Command className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-[#10243B] border border-[#17324F] text-[#F7FAFC]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#08101F]/98 backdrop-blur-2xl border-b border-[#17324F] p-6 shadow-2xl flex flex-col gap-4 pointer-events-auto">
          <Link
            to="/upload"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 rounded-xl bg-[#F7FAFC] text-[#07111F] text-center font-semibold text-sm"
          >
            Analyze a Presentation
          </Link>
          <Link
            to="/#product"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-[#DCEFF8] font-medium py-1"
          >
            Product Overview
          </Link>
          <div className="flex flex-col gap-1 py-1 border-y border-[#17324F]/70">
            <span className="text-xs font-mono uppercase text-[#7C93A9]">Samples</span>
            {SAMPLE_DESCRIPTORS.map((s) => (
              <Link
                key={s.id}
                to={`/samples/${s.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#9AAFC2] hover:text-[#F7FAFC] py-1"
              >
                {s.title} — {s.subtitle}
              </Link>
            ))}
          </div>
          <Link
            to="/methodology"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-[#DCEFF8] font-medium py-1"
          >
            Methodology
          </Link>
          <Link
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-[#DCEFF8] font-medium py-1"
          >
            History Archive
          </Link>
          {status === 'authenticated' || status === 'guest' ? (
            <button
              type="button"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="text-sm text-[#F2766B] font-mono text-left py-1"
            >
              Sign out ({user?.display_name})
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[#79C8DF] font-mono py-1"
            >
              Sign in / Demo account
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
