import type { MinderCommands, MindEvents } from "./mind";

export type iCommands = Record<typeof MinderCommands[number], (...params: any[]) => unknown>
export type iMindOnOff = (kvs: Partial<Record<MindEvents, (e: any) => void>>) => () => void

export const AllShortcuts = [
    'Enter', 'Tab,Insert', 'Shift+Tab', 'Delete', 'Up,Down,Left,Right', 'Alt+Up,Down', '/,、',
    'Alt+1,2,3,4,5', 'Alt+`', 'E', 'Ctrl+A', 'Ctrl+C', 'Ctrl+X', 'Ctrl+V',
    'Ctrl+B', 'Ctrl+I', 'Ctrl+F', 'Alt+LeftMouse,RightMouse', 'MouseWheel,TouchPad', 'dblclick blank',
    'Ctrl++,-,MouseWheel', 'Ctrl+Shift+L', 'Ctrl+Z', 'Ctrl+Y',] as const
