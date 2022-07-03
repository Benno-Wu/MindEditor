import type { Operation } from "fast-json-patch"
import { History } from "../history"
import type { array2string, nOne2one, zero2nine, Permutation, trimEnd, tuple2union, writable, UnPartial, UnPartialByKeys } from "./utils"

declare global {
    interface Window {
        kityminder: {
            Minder: {
                new(options: MinderOptions): kityMinder
                getTemplateList: () => Record<MinderTemplate[number], { getLayout: unknown, getConnect: unknown }>
                getThemeList: () => MinderTheme
            }
        }
        HotBox: {
            new(renderTo: string | HTMLElement): iHotBox;
        }
        kity: any
        minder: kityMinder
        kmhistory?: History
        hotbox?: iHotBox
        FileResources: {
            filename2blob: Map<string, Blob>,
            filename2objectUrl: Map<string, string>,
        },
        // FileSystemAccessAPI check
        showOpenFilePicker: unknown
    }
}
export interface iMinderNode {
    data: Partial<{
        id: string,
        created: number,
        text: string,
        expandState: 'expand' | 'collapse',
        progress: zero2nine | number,
        hyperlink: string,
        hyperlinkTitle: string,
        resource: string[],
        priority: zero2nine | number,
        note: string,
        image: string,
        imageTitle: string,
        imageSize: Record<'width' | 'height', number>,
        // custom
        extra: string[],
    }>
    children: iMinderNode[]
}
export interface iMinderData {
    root: iMinderNode,
    version: `${number}.${number}.${number}`,
    theme: MinderTheme[number], template: MinderTemplate[number],
    // custom
    tags?: string[]
}
export interface iMinder {
    minderData: iMinderData,
}

type timing = 'before' | 'pre' | 'after'
type normalState = 'normal' | 'readonly' | 'hand'
type rareState = 'textedit' | 'dragtree' | 'inputready'
type state = normalState | rareState

type normalKeys = Capitalize<[
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '`', '=', '-', '/', '.',
    'tab', 'insert',
][number]>
type SpecialKeys = Capitalize<[
    'esc',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
    'backspace', 'enter',
    'space',
    // 'shift', 'control', 'alt',
    'capslock', 'numlock',
    'pageup', 'pagedown',
    'home', 'end',
    'del',
    'left', 'up', 'right', 'down',
][number]>
type combineKeys = Capitalize<'shift' | 'ctrl' | 'alt'>
type BaseShortcutKeys = 'Tab|Insert' | SpecialKeys | `${normalKeys}` | `${combineKeys}+${normalKeys}` | `${PermutationWapper<combineKeys, 2, '+'>}+${normalKeys}`
type StatedShortscutKeys = `${state}::${BaseShortcutKeys}`
type ShortcutKeys = BaseShortcutKeys | StatedShortscutKeys
// | PermutationWapper<BaseShortcutKeys | StatedShortscutKeys, 2, '|'>

// hard to type, a little mess
interface MindEvent<E> {
    minder: kityMinder,
    type: MindEvents,
    __KityClassName: 'MindEvent',
    _canstop: boolean,

    kityEvent?: {
        originEvent: E,
        targetShape: rc,
    },
    originEvent?: E,

    node?: MinderNode,
    icon?: rc,

    command?: unknown,
    commandArgs?: unknown[],
    commandName?: unknown | string,

    // refer some element, get the coordinate
    // refer is partial unknown
    getPosition: (refer?: 'paper' | 'minder' | 'group' | 'view') => Point
    getTargetNode: () => MinderNode | null,
    isRightMB: () => boolean,
    stopPropagationImmediately: () => void,
}

export type MindEventWapped<E = unknown> = E extends ClipboardEvent ? UnPartialByKeys<MindEvent<E>, 'originEvent'>
    : E extends NoteEvents ? UnPartialByKeys<MindEvent<E>, 'node' | 'icon'>
    : E extends DragEvent ? UnPartialByKeys<MindEvent<E>, 'node' | 'icon' | 'kityEvent' | 'originEvent'>
    : E extends UIEvent ? UnPartialByKeys<MindEvent<E>, 'kityEvent' | 'originEvent'>
    : MindEvent<E>

type ClickEvents = 'click' | 'dblclick'
type DragEvents = 'dragenter' | 'dragleave' | 'drop'
type MouseEvents = 'mousedown' | 'mouseup' | 'mousemove' | 'mousewheel' | 'contextmenu' | 'mouseover'
type TouchEvents = 'touchstart' | 'touchend' | 'touchmove'
type MindClipboardEvents = 'cut' | 'copy' | 'paste'
type MindKeyboardEvents = 'keyup' | 'keydown' | 'keypress'
type MindChangeEvents = 'contentchange' | 'selectionchange' | 'interactchange'
type MindOtherEvents = 'focus' | 'blur' | 'zoom'
export type NoteEvents = 'hidenoterequest' | 'shownoterequest'
type ViewEvents = 'layoutallfinish' | 'viewchanged' | 'viewchange'
type DataEvents = 'preimport' | 'afterimport' | 'patch'
// https://github.com/Benno-Wu/kityminder-core
// custom since 2.0.0
type NodeEvents = 'DropOnNode'

type EventWapper<T extends string> = T | `${timing}${T}` | `${normalState}.${T}` | `${normalState}.${timing}${T}`
type PermutationWapper<T extends string, L extends number, PH = ' '> = trimEnd<array2string<Permutation<T, L>, PH>>

// try not to use anything about all Permutations
// https://github.com/microsoft/TypeScript/issues/13298#issuecomment-514082646
export type MindEvents = NoteEvents | DataEvents | NodeEvents | MindClipboardEvents
    | `${timing}ExecCommand`
    | PermutationWapper<MindOtherEvents, 3>
    | MindChangeEvents | PermutationWapper<MindChangeEvents, 2>
    | ViewEvents | PermutationWapper<ViewEvents, 2>
    | ClickEvents | PermutationWapper<EventWapper<ClickEvents>, 2>
    | EventWapper<MouseEvents> | PermutationWapper<EventWapper<MouseEvents>, 2>
    | EventWapper<TouchEvents> | PermutationWapper<EventWapper<TouchEvents>, 2>
    | EventWapper<MindKeyboardEvents> | PermutationWapper<EventWapper<MindKeyboardEvents>, 2>

export const MinderCommands = ['AppendParentNode', 'AppendSiblingNode', 'AppendChildNode', 'RemoveNode'
    , 'ArrangeUp', 'ArrangeDown', 'ExpandToLevel', 'Expand', 'Template', 'Theme'
    , 'Priority', 'Progress', 'Resource', 'Extra'
    , 'ResetLayout', 'Zoom', 'ZoomIn', 'ZoomOut', 'Camera', 'Hand'
    , 'Text', 'Image', 'Note', 'HyperLink', 'Background'
    , 'Copy', 'Paste', 'Cut'
] as const

type iMinderCommand = tuple2union<writable<typeof MinderCommands>>
type MinderOptions = Partial<{
    renderTo: string,
    enableAnimation: boolean,
    layoutAnimationDuration: number,
    viewAnimationDuration: number,
    zoomAnimationDuration: number,
    enableKeyReceiver: boolean,
    defaultTheme: MinderTheme[number],
    maxImageWidth: number,
    maxImageHeight: number,
    zoom: number[],
    // custom
    expandPos: 'in' | 'out',
    whiteSpace: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
    | 'inherit' | 'initial' | 'revert' | 'unset',
    alignByText: 'center' | 'left' | 'right',
}>

export interface kityMinder {
    _defaultOptions: UnPartial<MinderOptions>,
    _options: MinderOptions,
    getOption: <T extends keyof MinderOptions = keyof MinderOptions>(key?: T) => MinderOptions[T]

    execCommand: (command: iMinderCommand, ...args: unknown[]) => boolean,
    queryCommandState: (command: iMinderCommand) => nOne2one,
    queryCommandValue: (command: iMinderCommand) => any,

    importJson: (json: iMinderData) => kityMinder,
    exportJson: () => iMinderData,
    exportData: (type: 'png') => Promise<string>,

    on: <T>(event: MindEvents, callback: (e: MindEventWapped<T>) => void) => kityMinder,
    off: <T>(event: MindEvents, callback: (e: MindEventWapped<T>) => void) => void,
    // fire: (type: MindEvents, params: unknown) => kityMinder,
    dispatchKeyEvent: (e: KeyboardEvent) => void,
    // event loop
    // https://github.com/Benno-Wu/kityminder-core/blob/alpha/src/core/event.js#L162
    _eventCallbacks: Record<MindEvents, (e: MindEventWapped) => void>,

    select: (nodes: MinderNode | MinderNode[], isSingleSelect?: boolean) => kityMinder,
    getSelectedNode: () => MinderNode | null,
    getSelectedNodes: () => MinderNode[] | null,

    // getTheme: () => any,
    // getThemeItems: () => { 'selected-stroke': string, background: string },
    getTemplate: () => MinderTemplate[number],

    getZoomValue: () => number,

    // _renderTarget: Element,
    getRenderTarget: () => Element,
    // getRenderContainer: () => unknown,
    renderTo: (target: string | Element) => kityMinder,

    getResourceColor: (resource: string) => ({ toHEX: () => string }),
    getAllNodeResource: () => string[],

    getRoot: () => MinderNode,
    getAllNode: () => MinderNode[],
    getMinderTitle: () => string,

    getStatus: () => state,
    setStatus: (status: state, force?: boolean) => kityMinder,
    enable: () => void,
    disable: () => void,

    blur: () => kityMinder,
    focus: () => kityMinder,
    isFocused: () => boolean,

    applyPatches: (patchs: Operation[]) => kityMinder,

    addShortcut: (key: BaseShortcutKeys, func: () => unknown) => void,
    _shortcutKeys: Record<BaseShortcutKeys, () => unknown>,
    addCommandShortcutKeys: (command: iMinderCommand, key: ShortcutKeys, notPreventDefault?: boolean) => void,
    _commandShortcutKeys: Record<iMinderCommand, ShortcutKeys>,
    getCommandShortcutKey: (command: iMinderCommand) => ShortcutKeys,

    // custom
    getAllNodeExtra: () => string[]
}
export type MinderTemplate = ['default', 'tianpan', 'structure', 'filetree', 'right', 'fish-bone']
export type MinderTheme = [
    'classic', 'classic-compact',
    'snow', 'snow-compact',
    'fish',
    'wire',
    'fresh-red', 'fresh-red-compat',
    'fresh-soil', 'fresh-soil-compat',
    'fresh-green', 'fresh-green-compat',
    'fresh-blue', 'fresh-blue-compat',
    'fresh-purple', 'fresh-purple-compat',
    'fresh-pink', 'fresh-pink-compat',
    'tianpan', 'tianpan-compact'
]

interface rc {
    container: rc,
    items: unknown[],
    node: Element,
    remove: unknown,
    transform: Record<'translate' | 'rotate' | 'scale' | 'matrix', unknown>,
    getType?: () => rc['__KityClassName'],
    __KityClassName: string,
    getBoundaryBox: () => Box,
    getRenderBox: (refer?: 'screen' | 'doc' | 'paper' | 'view' | 'top' | 'parent' | unknown) => Box,
}
type Box = Record<'x' | 'y' | 'cx' | 'cy' | 'width' | 'height' | 'left' | 'top' | 'right' | 'bottom', number>
type Point = Record<'x' | 'y', number>
type AllRenderers = ["TextRenderer", "PriorityRenderer", "ProgressRenderer", "hyperlinkrender", "NoteIconRenderer", "ResourceRenderer"
    , "ImageRenderer", "ExtraRenderer", "OutlineRenderer", "ExpanderRenderer", "ShadowRenderer", "WireframeRenderer",]
interface Renderer {
    // todo other props
    getType: () => AllRenderers[number],
    contentBox: Box,
    node: MinderNode,
    _renderShape: {
        container: Renderer['_renderShape'] | Element,
        items: unknown[],
        node: Element,
    },
    // todo explain
    bringToBack?: boolean,
    [key: string]: any,
}
export interface MinderNode {
    attached: boolean,
    isRoot: () => boolean,
    isLeaf: () => boolean,
    root: MinderNode,
    getRoot: () => MinderNode,
    parent: MinderNode | null,
    getParent: () => MinderNode | null,
    getSiblings: () => MinderNode[],
    getLevel: () => number,
    // getComplex:()=>number,
    type: 'root' | 'main' | 'sub',
    getType: () => 'root' | 'main' | 'sub',
    isAncestorOf: (ancestor: MinderNode) => boolean,
    data: iMinderNode['data'],
    getData: <T extends keyof iMinderNode['data'] = keyof iMinderNode['data']>(key: T) => iMinderNode['data'][T],
    setData: <T extends keyof iMinderNode['data'] = keyof iMinderNode['data']>(key: T, value: iMinderNode['data'][T]) => MinderNode,
    getText: () => string,
    setText: (text: string) => string,
    preTraverse: (func: (node: MinderNode) => void, excludeThis?: boolean) => void,
    postTraverse: (func: (node: MinderNode) => void, excludeThis?: boolean) => void,
    // equal postTraverse
    traverse: (func: (node: MinderNode) => void, excludeThis?: boolean) => void,
    children: MinderNode[],
    getChildren: () => MinderNode[],
    getIndex: () => number,
    insertChild: (node: MinderNode, index?: number) => void,
    appendChild: (node: MinderNode) => void,
    prependChild: (node: MinderNode) => void,
    removeChild: (child: number | MinderNode) => void,
    clearChildren: () => void,
    getChild: (index: number) => MinderNode,
    rc: rc,
    getRenderContainer: () => rc,
    getCommonAncestor: (node: MinderNode) => MinderNode,
    contains: (node: MinderNode) => boolean,
    clone: () => MinderNode,
    // compareTo: (node: MinderNode) => boolean,
    minder: kityMinder,
    getMinder: () => kityMinder,

    _currentTextGroupBox: Box,
    getRenderer: (type: AllRenderers[number]) => Renderer,
    getContentBox: () => Box,
    // node.getRenderBox('type'),参数type来自node._renderers的key或者其他例如paper,screen,minder...
    getRenderBox: (type?: AllRenderers[number], refer?: unknown) => Box,

    getStyle: (name: 'color' | 'background' | 'stroke' | 'font-size' | 'padding' | 'margin' | 'radius' | 'space' | 'shadow') => string,

    // custom
    resetBackground: () => void,
}

interface ButtonOptions {
    position: 'center' | 'ring' | 'top' | 'bottom',
    // custom
    label: string | (() => string),
    key: string,
    enable?: () => boolean,
    action?: (options: ButtonOptions) => void,
    next?: hbState | 'back',
    beforeShow?: () => void,
}
export type hbState = 'idle' | 'main' | 'progress' | 'priority'
export interface iHotBox {
    state: {
        (): hbState
        (state: Exclude<hbState, 'idle'>): {
            button: (options: ButtonOptions) => void,
            // custom
            rerender: () => void,
        },
    },
    active: (state: hbState | 'back', position?: Point) => void,
    dispatch: (e: KeyboardEvent) => boolean,
    $element: HTMLElement,
    $container: HTMLElement,
    activeKey: 'space',
}