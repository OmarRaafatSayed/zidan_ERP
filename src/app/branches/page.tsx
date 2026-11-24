'use client'
import { useState, useEffect } from 'react'
import {
  Building2, PlusCircle, Pencil, Trash2,
  ClipboardList, CheckSquare, FileX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { inputStyle, labelStyle, btnPrimary, btnSecondary } from '@/lib/styles'

interface Branch {
  id: number
  name: string
  year: string | null
  createdAt: string
  _count: { subscriptions: number; checkIns: number }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading,  setLoading]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState<number | null>(null)
  const [delId,    setDelId]    = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', year: '' })

  useEffect(() => { load() }, [])

  function load() {
    fetch('/api/branches').then(r => r.json()).then(setBranches)
  }

  function startAdd() {
    setEditId(null)
    setForm({ name: '', year: '' })
    setShowForm(true)
    setTimeout(() => document.getElementById('branch-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function startEdit(b: Branch) {
    setEditId(b.id)
    setForm({ name: b.name, year: b.year ?? '' })
    setShowForm(true)
    setTimeout(() => document.getElementById('branch-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    if (editId) {
      await fetch(`/api/branches?id=${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm({ name: '', year: '' })
    load()
  }

  async function confirmDelete(id: number) {
    setLoading(true)
    await fetch(`/api/branches?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    setDelId(null)
    load()
  }

  const totalSubs   = branches.reduce((s, b) => s + b._count.subscriptions, 0)
  const totalChecks = branches.reduce((s, b) => s + b._count.checkIns, 0)

  return (
    <div className="animate-fade-in" dir="rtl"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <PageHeader
        title="الفروع"
        subtitle="إدارة فروع الأكاديمية"
        actions={
          <button onClick={startAdd}
            style={{ ...btnPrimary, minHeight: '44px', padding: '0.5rem 1rem' }}>
            <PlusCircle size={15} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>فرع جديد</span>
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid-3col">
        <StatCard title="عدد الفروع"        value={branches.length} icon={Building2}    color="blue"  />
        <StatCard title="إجمالي الاشتراكات" value={totalSubs}       icon={ClipboardList} color="muted" />
        <StatCard title="إجمالي الحضور"      value={totalChecks}     icon={CheckSquare}  color="muted" />
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div id="branch-form">
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={15} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <CardTitle>{editId ? 'تعديل الفرع' : 'إضافة فرع جديد'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="form-grid">
                <div>
                  <label style={labelStyle}>اسم الفرع *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={{ ...inputStyle, minHeight: '44px' }}
                    placeholder="مثال: فرع 2006، فرع المقطم..."
                  />
                </div>
                <div>
                  <label style={labelStyle}>السنة / الفئة العمرية</label>
                  <input
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    style={{ ...inputStyle, minHeight: '44px' }}
                    placeholder="مثال: 2006، 2007، تحت 15..."
                  />
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit" disabled={loading}
                    style={{ ...btnPrimary, minHeight: '44px', flex: '1 1 140px', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة الفرع'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditId(null) }}
                    style={{ ...btnSecondary, minHeight: '44px', flex: '0 0 auto' }}>
                    إلغاء
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {delId !== null && (
        <>
          <div
            onClick={() => setDelId(null)}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'var(--bg-overlay)',
              zIndex: 60, animation: 'fadeIn 0.18s ease both',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 61,
            backgroundColor: 'var(--bg-card)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: '18px',
            padding: '1.5rem',
            width: 'min(90vw, 360px)',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            boxShadow: 'var(--shadow-dropdown)',
          }} dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                backgroundColor: 'var(--status-danger-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={18} strokeWidth={2} style={{ color: 'var(--status-danger-text)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>حذف الفرع</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              حذف الفرع سيؤثر على كل الاشتراكات والحضور المرتبطة به. هل أنت متأكد؟
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => confirmDelete(delId!)}
                disabled={loading}
                style={{
                  flex: 1, minHeight: '44px', borderRadius: '10px',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1.5px solid var(--status-danger-text)',
                  color: 'var(--status-danger-text)',
                  fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}>
                {loading ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                onClick={() => setDelId(null)}
                style={{ ...btnSecondary, flex: 1, minHeight: '44px' }}>
                إلغاء
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Branches list ── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={17} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <CardTitle>قائمة الفروع</CardTitle>
            </div>
            {branches.length > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {branches.length} فرع
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '2.5rem 1rem', gap: '0.625rem', textAlign: 'center',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileX size={24} strokeWidth={1.5} color="var(--text-disabled)" />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                لا توجد فروع بعد
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                أضف فرعاً جديداً بالضغط على «فرع جديد»
              </p>
              <button onClick={startAdd}
                style={{ ...btnPrimary, marginTop: '0.5rem', minHeight: '44px' }}>
                <PlusCircle size={14} strokeWidth={2.5} />
                فرع جديد
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {branches.map((b, idx) => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem', borderRadius: '14px',
                  backgroundColor: idx === 0 ? 'var(--accent)' : 'var(--bg-surface)',
                  border: idx === 0 ? 'none' : '1px solid var(--border-default)',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    backgroundColor: idx === 0 ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 900,
                    color: idx === 0 ? '#fff' : 'var(--text-muted)',
                  }}>
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 800, fontSize: '0.95rem',
                      color: idx === 0 ? '#fff' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {b.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', flexWrap: 'wrap' }}>
                      {b.year && (
                        <span style={{ fontSize: '0.72rem', color: idx === 0 ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)' }}>
                          فئة {b.year}
                        </span>
                      )}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.72rem', color: idx === 0 ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                      }}>
                        <ClipboardList size={11} strokeWidth={2} />
                        {b._count.subscriptions} اشتراك
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.72rem', color: idx === 0 ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                      }}>
                        <CheckSquare size={11} strokeWidth={2} />
                        {b._count.checkIns} حضور
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    <button
                      onClick={() => startEdit(b)}
                      title="تعديل"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px', borderRadius: '8px', display: 'flex',
                        minHeight: '36px', minWidth: '36px',
                        alignItems: 'center', justifyContent: 'center',
                        color: idx === 0 ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                        transition: 'color 0.12s, background-color 0.12s',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          idx === 0 ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-hover)'
                        ;(e.currentTarget as HTMLElement).style.color =
                          idx === 0 ? '#fff' : 'var(--text-primary)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color =
                          idx === 0 ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)'
                      }}
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setDelId(b.id)}
                      title="حذف"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px', borderRadius: '8px', display: 'flex',
                        minHeight: '36px', minWidth: '36px',
                        alignItems: 'center', justifyContent: 'center',
                        color: idx === 0 ? 'rgba(255,255,255,0.55)' : 'var(--destructive)',
                        transition: 'color 0.12s, background-color 0.12s',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          idx === 0 ? 'rgba(255,255,255,0.12)' : 'var(--status-danger-bg)'
                        ;(e.currentTarget as HTMLElement).style.color =
                          idx === 0 ? '#fff' : 'var(--status-danger-text)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color =
                          idx === 0 ? 'rgba(255,255,255,0.55)' : 'var(--destructive)'
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
