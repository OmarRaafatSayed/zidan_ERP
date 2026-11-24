'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ScanLine, Users, ClipboardList,
  PersonStanding, Wallet, Menu, X, FileBarChart2,
  UserRound, Building2,
  type LucideIcon,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface NavItem  { href: string; label: string; Icon: LucideIcon }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'الرئيسي',
    items: [
      { href: '/',       label: 'لوحة التحكم',  Icon: LayoutDashboard },
      { href: '/report', label: 'التقرير الشهري', Icon: FileBarChart2   },
    ],
  },
  {
    label: 'الأعضاء',
    items: [
      { href: '/players',       label: 'اللاعبون',      Icon: UserRound      },
      { href: '/subscriptions', label: 'الاشتراكات',    Icon: ClipboardList  },
      { href: '/checkin',       label: 'تسجيل الحضور',  Icon: ScanLine       },
      { href: '/visitors',      label: 'الزوار',         Icon: Users          },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/coaches',   label: 'المدربون', Icon: PersonStanding },
      { href: '/finance',   label: 'المالية',  Icon: Wallet         },
      { href: '/branches',  label: 'الفروع',   Icon: Building2      },
    ],
  },
]

/* flat list for pathname matching */
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items)

function DrawerContents({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const [year, setYear] = useState(0)
  useEffect(() => { setYear(new Date().getFullYear()) }, [])

  return (
    <>
      {/* ── Brand ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.125rem 1.25rem',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          backgroundColor: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: 'var(--text-on-volt)', fontWeight: 900, fontSize: '0.95rem' }}>Z</span>
        </div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>
            زيدان ERP
          </div>
          <div style={{ color: 'var(--neon-text)', fontSize: '0.65rem', fontWeight: 600, marginTop: '1px' }}>
            نظام الإدارة المتكامل
          </div>
        </div>
      </div>

      {/* ── Nav groups ── */}
      <nav style={{
        flex: 1, padding: '0.5rem 0.625rem', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
      }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: '0.5rem' }}>
            {/* Group label */}
            <div style={{
              fontSize: '0.62rem', fontWeight: 800,
              letterSpacing: '0.09em', textTransform: 'uppercase',
              color: 'var(--text-disabled)',
              padding: '0.5rem 0.875rem 0.3rem',
            }}>
              {group.label}
            </div>

            {/* Items */}
            {group.items.map(({ href, label, Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href} href={href} onClick={onLinkClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.875rem', borderRadius: '10px',
                    fontSize: '0.875rem', fontWeight: active ? 700 : 500,
                    textDecoration: 'none', minHeight: '44px',
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--text-on-volt)' : 'var(--text-muted)',
                    position: 'relative',
                    transition: 'background-color 0.12s, color 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface-hover)'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span style={{
                      position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '55%', borderRadius: '99px 0 0 99px',
                      backgroundColor: 'var(--neon)',
                    }} />
                  )}
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '0.75rem 0.875rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0,
      }}>
        <ThemeToggle variant="sidebar" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '99px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>A</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Admin</div>
            <div style={{ color: 'var(--text-disabled)', fontSize: '0.65rem' }}>
              {year > 0 ? `© ${year} زيدان ERP` : '© زيدان ERP'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mobile-topbar" dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          backgroundColor: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--text-on-volt)', fontWeight: 900, fontSize: '0.85rem' }}>Z</span>
        </div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.9rem' }}>زيدان ERP</span>
      </div>
      <button
        onClick={onOpen}
        className="tap-target"
        aria-label="فتح القائمة"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '8px' }}
      >
        <Menu size={22} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <MobileTopBar onOpen={() => setOpen(true)} />
      <div
        className={`sidebar-backdrop${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`sidebar-drawer${open ? ' open' : ''}`}
        dir="rtl"
        aria-label="القائمة الرئيسية"
      >
        <button
          onClick={() => setOpen(false)}
          className="tap-target"
          aria-label="إغلاق القائمة"
          style={{
            position: 'absolute', left: '0.75rem', top: '0.75rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', borderRadius: '8px', display: 'flex',
          }}
        >
          <span className="lg-hidden"><X size={18} strokeWidth={2} /></span>
        </button>
        <DrawerContents onLinkClick={() => setOpen(false)} />
      </aside>
    </>
  )
}
