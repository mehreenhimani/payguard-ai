import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Settings,
  GitBranch,
  FileSearch,
  Bell,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { label: 'Risk Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Review Queue', to: '/queue', icon: ShieldAlert, badge: 41 },
  { label: 'Model Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Audit Log', to: '/audit', icon: FileSearch },
  { label: 'Rule Engine', to: '/rules', icon: GitBranch },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface-card border-r border-surface-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-border">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <ShieldAlert size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">PayGuard</p>
          <p className="text-[10px] text-slate-500 mt-0.5">AI Risk Operations</p>
        </div>
      </div>

      {/* Org switcher */}
      <button className="mx-3 mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-surface-muted border border-surface-border text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <span className="font-medium text-slate-300">Acme Financial</span>
        <ChevronDown size={12} />
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5">
        {NAV.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-slate-400 hover:bg-surface-muted hover:text-slate-200'
              )
            }
          >
            <Icon size={15} />
            <span className="flex-1">{label}</span>
            {badge != null && (
              <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-surface-border pt-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            MH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Mehreen H.</p>
            <p className="text-[10px] text-slate-500">Risk Analyst</p>
          </div>
          <Bell size={13} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
        </div>
      </div>
    </aside>
  )
}
