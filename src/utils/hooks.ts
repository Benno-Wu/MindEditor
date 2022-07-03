import React, { useEffect, useReducer } from "react"

export const useForceUpdate = (): React.DispatchWithoutAction => useReducer(() => [], [])[1]

type AllTarget<T extends Element = HTMLElement> = undefined | null | T | React.RefObject<T> | (() => T | null | undefined)
// todo type-challenge
export const useClickOutside = <T extends Event = MouseEvent>(handler: (event: T) => void, target: AllTarget | AllTarget[], eventName = 'click'): void => {
    useEffect(() => {
        const _ = (e: any) => {
            const targets = Array.isArray(target) ? target : [target]
            if (targets.every(t => {
                const tt = typeof t === 'function' ? t()
                    : (t && 'current' in t) ? t.current
                        : t
                return tt && !tt.contains(e.target)
            })) handler(e)
        }
        document.addEventListener(eventName, _, true)
        return () => document.removeEventListener(eventName, _, true)
    }, [handler, target, eventName])
}

type DragEventHandler = (e: React.DragEvent) => void
type iDraggable = (config: { onDragStart?: DragEventHandler, onDragEnd?: DragEventHandler, dataTransfer?: Record<string, string> }) => ({
    draggable: true,
    onDragStart: DragEventHandler,
    onDragEnd?: DragEventHandler,
})
export const useDraggable: iDraggable = ({ onDragStart, onDragEnd, dataTransfer }) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
        for (const [k, v] of Object.entries(dataTransfer ?? {}))
            e.dataTransfer.setData(k, v)
        onDragStart?.(e)
    },
    onDragEnd,
})

type iDropable = (config: Partial<Record<'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop', DragEventHandler>>) => ({
    onDragEnter?: DragEventHandler,
    onDragLeave?: DragEventHandler,
    onDragOver: DragEventHandler,
    onDrop?: DragEventHandler
})
export const useDropable: iDropable = ({ onDragEnter, onDragLeave, onDragOver, onDrop }) => ({
    onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        onDragOver?.(e)
    },
    onDragEnter, onDragLeave, onDrop,
})
