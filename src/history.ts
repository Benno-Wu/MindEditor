import type { iMinderData, kityMinder } from "./types/mind"
import { compare } from "fast-json-patch"
import type { Operation } from "fast-json-patch"

export class History {
    static MAX_HISTORY = 100
    constructor(minder: kityMinder) {
        this.#minder = minder
        this.#lastSnap = this.#minder?.exportJson()
    }
    #minder: kityMinder
    #lastSnap: iMinderData
    #lock = false
    #undos: Operation[][] = []
    #redos: Operation[][] = []
    undos = () => this.#undos
    redos = () => this.#redos
    reset = () => {
        this.#undos = []
        this.#redos = []
        this.#lastSnap = this.#minder.exportJson()
    }
    redo = () => {
        this.#lock = true
        const redo = this.#redos.pop()
        if (redo?.length) {
            this.#minder.applyPatches(redo)
            this.#addUndo()
        }
        this.#lock = false
    }
    undo = () => {
        this.#lock = true
        const undo = this.#undos.pop()
        if (undo?.length) {
            this.#minder.applyPatches(undo)
            const snap = this.#minder.exportJson()
            const patches = compare(snap, this.#lastSnap)
            this.#redos.push(patches)
            this.#lastSnap = snap
        }
        this.#lock = false
    }
    do = () => {
        if (!this.#lock && this.#addUndo()) this.#redos = []
    }
    #addUndo = () => {
        const snap = this.#minder.exportJson()
        const patches = compare(snap, this.#lastSnap)
        if (patches.length) {
            this.#undos.push(patches)
            while (this.#undos.length > History.MAX_HISTORY) {
                this.#undos.shift()
            }
            this.#lastSnap = snap
            return true
        } return false
    }
}