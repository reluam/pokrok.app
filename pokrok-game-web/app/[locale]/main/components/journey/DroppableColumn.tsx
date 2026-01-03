'use client'

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableColumnProps {
  id: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DroppableColumn({ id, children, className, style }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-4 ring-orange-400 ring-opacity-50' : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}

