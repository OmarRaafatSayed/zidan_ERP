import React from 'react'

interface CardProps {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Card({ className = '', children, style }: CardProps) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1.5px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div
      className={`card-header-pad ${className}`}
      style={{ borderBottom: '1px solid var(--border-default)' }}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3
      className={`font-bold ${className}`}
      style={{ fontSize: '0.95rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}
    >
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`card-body-pad ${className}`}>{children}</div>
}
