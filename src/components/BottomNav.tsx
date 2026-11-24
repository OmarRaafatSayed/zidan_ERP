'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ScanLine, Users, ClipboardList,
  Wallet, PersonStanding, FileBarChart2, UserRound, Building2,
  type LucideIcon,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface NavItem { href: string; label: string; Icon: LucideIcon }

/* ── كل الـ pages ── */
const NAV_ITEMS: NavItem[] = [
  { href: '/',             label: 'الرئيسية',  Icon: LayoutDashboard },
  { href: '/report',       label: 'التقرير',   Icon: FileBarChart2   },
  { href: '/players',      label: 'اللاعبون',  Icon: UserRound       },
  { href: '/subscriptions',label: 'الاشتراكات',Icon: ClipboardList   },
  { href: '/checkin',      label: 'الحضور',    Icon: ScanLine        },
  { href: '/visitors',     label: 'الزوار',    Icon: Users           },
  { href: '/coaches',      label: 'المدربون',  Icon: PersonStanding  },
  { href: '/finance',      label: 'المالية',   Icon: Wallet          },
  { href: '/branches',     label: 'الفروع',    Icon: Building2       },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="bottom-nav"
      dir="rtl"
      aria-label="التنقل السريع"
      style={{
        position: 'fixed', bottom: 0, right: 0, left: 0,
        height: 'var(--bottom-nav-h)',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-default)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
        /* scroll أفقي لما الشاشة صغيرة */
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',          /* Firefox */
        msOverflowStyle: 'none',         /* IE / Edge */
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* hide scrollbar — WebKit */}
      <style>{`
        nav[aria-label="التنقل السريع"]::-webkit-scrollbar { display: none; }
      `}</style>

      {/* inner flex — min-width يمنع squish */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        minWidth: 'max-content', width: '100%',
      }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href} href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: '1 0 64px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', padding: '0.375rem 0.25rem',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative', minWidth: 0,
              }}
            >
              {/* Active top bar */}
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '24px', height: '3px', borderRadius: '0 0 4px 4px',
                  backgroundColor: 'var(--neon)',
                }} />
              )}

              {/* Icon pill */}
              <div style={{
                width: '34px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? 'var(--accent)' : 'transparent',
              }}>
                <Icon
                  size={18}
                  strokeWidth={active ? 2.4 : 1.8}
                  color={active ? 'var(--text-on-volt)' : 'var(--text-muted)'}
                />
              </div>

              {/* Label */}
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 800 : 500,
                color: active ? 'var(--neon-text)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '64px',
              }}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Theme toggle — آخر عنصر */}
        <div style={{
          flex: '1 0 64px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.375rem 0.25rem',
        }}>
          <ThemeToggle variant="nav" />
        </div>
      </div>
    </nav>
  )
}
