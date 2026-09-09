"use client"; 
 
import Link from "next/link"; 
import { Menu, Moon, Sun, X } from "lucide-react"; 
import { usePathname } from "next/navigation"; 
import { useTheme } from "@/components/theme-provider"; 
import { useState } from "react"; 
 
const links = [ 
  { label: "Home", href: "/" }, 
  { label: "Play Game", href: "/play" }, 
  { label: "Leaderboard", href: "/leaderboard" }, 
  { label: "How It Works", href: "/how-it-works" }, 
  { label: "My Profile", href: "/profile" }, 
]; 
 
export default function Navbar() { 
  const pathname = usePathname(); 
  const { isDark, toggleTheme } = useTheme(); 
  const [mobileOpen, setMobileOpen] = useState(false); 
 
  function isActive(href: string) { 
    if (href === "/") { 
      return pathname === "/"; 
    } 
 
    return pathname === href || pathname.startsWith(`${href}/`); 
  } 
 
  function closeMobile() { 
    setMobileOpen(false); 
  } 
 
  return ( 
    <header className="sticky top-0 z-50 border-b border-[#f1e3da] bg-[#fffaf6]/95 backdrop-blur-md dark:border-[#342620] dark:bg-[#17110e]/95"> 
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10"> 
        <Link 
          href="/" 
          onClick={closeMobile} 
          aria-label="TinkHubb home" 
          className="shrink-0 text-[21px] font-extrabold tracking-[-0.04em] text-[#ff8a3d]" 
        > 
          TinkHubb 
        </Link> 
 
        <nav 
          aria-label="Main navigation" 
          className="hidden items-center gap-7 lg:flex" 
        > 
          {links.map((link) => { 
            const active = isActive(link.href); 
 
            return ( 
              <Link 
                key={link.href} 
                href={link.href} 
                className={`group relative py-7 text-[13px] font-semibold tracking-[0.01em] transition-colors ${ 
                  active 
                    ? "text-[#ff8a3d]" 
                    : "text-[#5e514b] hover:text-[#ff8a3d] dark:text-[#c9bcb5] dark:hover:text-[#ff8a3d]" 
                }`} 
              > 
                {link.label} 
 
                <span 
                  className={`absolute bottom-[14px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#ff8a3d] transition-all duration-300 ${ 
                    active ? "w-full" : "w-0 group-hover:w-full" 
                  }`} 
                /> 
              </Link> 
            ); 
          })} 
        </nav> 
 
        <div className="flex items-center gap-2.5"> 
          <button 
            type="button" 
            onClick={toggleTheme} 
            aria-label={ 
              isDark ? "Switch to light mode" : "Switch to dark mode" 
            } 
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#5e514b] transition hover:bg-[#f7ebe4] hover:text-[#ff8a3d] dark:text-[#d5c8c1] dark:hover:bg-[#2a1e19] dark:hover:text-[#ff8a3d]" 
          > 
            {isDark ? ( 
              <Sun size={18} strokeWidth={2} /> 
            ) : ( 
              <Moon size={18} strokeWidth={2} /> 
            )} 
          </button> 
 
          <Link 
            href="/play" 
            className="hidden rounded-[7px] bg-[#ff8a3d] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex" 
          > 
            Play Now 
          </Link> 
 
          <button 
            type="button" 
            onClick={() => setMobileOpen((open) => !open)} 
            aria-label={ 
              mobileOpen ? "Close navigation" : "Open navigation" 
            } 
            aria-expanded={mobileOpen} 
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#451900] hover:bg-[#f7ebe4] dark:text-[#fff4ec] dark:hover:bg-[#2a1e19] lg:hidden" 
          > 
            {mobileOpen ? <X size={22} /> : <Menu size={22} />} 
          </button> 
        </div> 
      </div> 
 
      <div 
        className={`overflow-hidden border-t border-[#f1e3da] bg-[#fffaf6] transition-[max-height,opacity] duration-300 dark:border-[#342620] dark:bg-[#17110e] lg:hidden ${ 
          mobileOpen 
            ? "max-h-[500px] opacity-100" 
            : "max-h-0 opacity-0" 
        }`} 
      > 
        <nav className="mx-auto flex max-w-[1280px] flex-col px-5 py-4 sm:px-8"> 
          {links.map((link) => { 
            const active = isActive(link.href); 
 
            return ( 
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={closeMobile} 
                className={`border-b border-[#f1e3da] py-3.5 text-sm font-semibold last:border-b-0 dark:border-[#342620] ${ 
                  active 
                    ? "text-[#ff8a3d]" 
                    : "text-[#5e514b] dark:text-[#c9bcb5]" 
                }`} 
              > 
                {link.label} 
              </Link> 
            ); 
          })} 
 
          <Link 
            href="/play" 
            onClick={closeMobile} 
            className="mt-4 flex items-center justify-center rounded-[7px] bg-[#ff8a3d] px-5 py-3 text-sm font-bold text-white" 
          > 
            Play Now 
          </Link> 
        </nav> 
      </div> 
    </header> 
  ); 
} 
