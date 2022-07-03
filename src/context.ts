import { createContext } from "react"
import type { langs } from "./intl"
import type { iCommands, iMindOnOff } from "./types/editor"
import type { kityMinder } from "./types/mind"

export const MinderContext = createContext<{ minder: kityMinder, Commands: iCommands, mindOnOff: iMindOnOff } | undefined>(undefined)

export const LanguageContext = createContext<((lang: langs[number]) => void) | undefined>(undefined)