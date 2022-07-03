// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import { Button, Drawer, Input, message, notification, Popover, Radio, Tabs } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, EditOutlined, ClearOutlined, SisternodeOutlined, SubnodeOutlined, FileTextOutlined, LinkOutlined, RestOutlined, CloseOutlined, ImportOutlined, ExportOutlined, UndoOutlined, RedoOutlined, SmileTwoTone, PaperClipOutlined, BgColorsOutlined, TagOutlined, SearchOutlined, PictureOutlined } from "@ant-design/icons";
import type { refDragTags } from './components/DragTags';
import { DragTags } from './components/DragTags';
import { throttle } from 'lodash-es'
import { downloadFiles } from './utils/downloadFiles';
import { marked } from "marked";
import type { kityMinder, iHotBox, MindEvents, iMinderData, iMinderNode, MindEventWapped, NoteEvents } from './types/mind';
import { MinderCommands } from './types/mind';
import { History } from "./history";
import * as LZString from 'lz-string'
import { copy } from './utils/clipboard'
import type { iCommands, iMindOnOff } from './types/editor';
import { MinderContext } from './context';
import { Statusbar } from './components/Statusbar';
import { useTranslation } from 'react-i18next';
import { filename2blob, filename2objectUrl, Parser } from './parser';
import './index.less'
import i18next from 'i18next';
import * as zip from "@zip.js/zip.js";
import { base642blob, FileEntryReader, getUUID, isBase64, isSupportedImage, isURL } from './utils/utils';
import type { UnPartial } from './types/utils';
import { useClickOutside, useDraggable, useDropable } from './utils/hooks';
import { ExtraList } from './components/ExtraList';
import { SearchList } from './components/SearchList';
import { AutoSizeTextArea } from './components/AutoSizeTextArea';

const stupidMessage: (content: React.ReactNode, type?: 'warn' | 'info') => void
    = (content, type = 'warn') => { message[type](content) }
const { TextArea } = Input
const { TabPane } = Tabs

// https://marked.js.org/using_advanced#options
marked.setOptions({
    gfm: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: false
})

export const Minder: FC = () => {
    const { t } = useTranslation()
    const defaultMinderData = useRef<iMinderData>({
        root: {
            data: {
                text: "Todo",
                resource: [
                    "✔"
                ],
                hyperlink: "https://www.example.com/",
            },
            children: [
                { data: { text: "Todo" }, children: [] },
                { data: { text: "Todo" }, children: [] },
                { data: { text: "Todo" }, children: [] },
                { data: { text: "Todo" }, children: [] },
            ]
        },
        template: "default", theme: "fresh-blue", version: "2.0.0",
        tags: [
            '😄', '🙂', '😶', '😑', '🤓', '👽', '💤'
            , '👌', '👍', '👎', '🙏', '✍', '🦴'
            , '🏃', '💃', '🤺', '🚴', '🤸', '👣', '💩'
            , '🐾', '🐋', '🐬', '🦈', '🐙', '🐛', '🕸'
            , '🍉', '🥕', '🥚', '🍚', '🍦', '🍺', '🥢'
            , '🗺', '🧭', '🏠', '🚕', '🚧', '⚓', '🚀', '⏳'
            , '☀', '🌕', '⭐', '🔥', '💧', '⚡', '♥', '♦', '✨'
            , '⚠', '⛔', '🚫', '❗', '❓', '❌', '✔', '⭕'
            , '🚩', '🏴', '🏳',
        ],
    })
    const minder = useRef<kityMinder>(new window.kityminder.Minder({
        // animateDefaultOptions
        enableAnimation: true,
        layoutAnimationDuration: 300,
        viewAnimationDuration: 100,
        zoomAnimationDuration: 300,
        // shortcut
        enableKeyReceiver: true,
        // theme
        defaultTheme: 'fresh-blue',
        // imgsize
        maxImageWidth: 200,
        maxImageHeight: 200,
        // zoom
        zoom: [25, 50, 75, 100, 150, 200],
        expandPos: 'in',
        whiteSpace: 'pre',
        alignByText: 'center',
    }))
    const hotbox = useRef<iHotBox>()
    const history = useRef<History>()
    const saved = useRef(0)

    const tagRef = useRef<refDragTags>(null)

    const [tabActiveKey, setTabActiveKey] = useState<'' | 'search' | 'tag' | 'note' | 'extra'>('')

    const editTextareaRef = useRef<HTMLTextAreaElement>(null)
    const [editTextarea, setEditTextarea] = useState({ visible: false, value: '', left: '0', top: '0', minWidth: '0', minHeight: '0', fontSize: 'unset' })
    const multiInputRef = useRef<typeof Input>(null)
    const [multiInput, setMultiInput] = useState<{
        visible: boolean, placeholder: string,
        onBlur?: (e: React.FocusEvent<HTMLInputElement>) => Promise<void> | void
    }>({ visible: false, placeholder: '' })

    const importInputRef = useRef<HTMLInputElement>(null)
    const imageUploadRef = useRef<HTMLInputElement>(null)
    const filesUploadRef = useRef<HTMLInputElement>(null)

    const [noteValue, setNoteValue] = useState('')
    const [previewNote, setPreviewNote] = useState<{
        visible: boolean, __html: string, style: Record<'left' | 'top', string>,
        now?: MindEventWapped<NoteEvents>,
    }>({ visible: false, __html: '', style: { left: '0', top: '0' } })

    const [deleteButton, setDeleteButton] = useState<{
        visible: boolean, style?: Record<'left' | 'top', string>, onClick?: () => void
    }>({ visible: false })
    const deleteButtonRef = useRef<HTMLButtonElement>(null)

    // init all minder commands & minder events listener
    const Commands = useMemo<iCommands>(
        () => (Object.fromEntries(MinderCommands.map(v => ([v, (...params: any[]) => minder.current.execCommand(v, ...params)])))) as any
        , [])
    // todo type
    const mindOnOff = useCallback<iMindOnOff>(kvs => {
        for (const [k, v] of Object.entries(kvs))
            minder.current.on(k as [MindEvents][number], v)
        return () => {
            for (const [k, v] of Object.entries(kvs))
                minder.current.off(k as [MindEvents][number], v)
        }
    }, [])

    // just short same logic
    /** already has - true */
    const tryPushNewBlob = useCallback((filename: string, blob: Blob): boolean => {
        const bool = filename2blob.has(filename)
        if (bool) message.info(t('Message.sameFilename'))
        else filename2blob.set(filename, blob)
        return bool
    }, [t])
    const tryPushNewImage = useCallback((filename: string, blob: Blob): void => {
        // a ? b ?? c : c === a && b || c
        const url = tryPushNewBlob(filename, blob) && filename2objectUrl.get(filename) || URL.createObjectURL(blob)
        filename2objectUrl.set(filename, url)
        Commands.Image(url, filename)
    }, [Commands, tryPushNewBlob])
    /** supported - true */
    const warnUnsupportedImage = useCallback((type: string): boolean | void => isSupportedImage(type) || stupidMessage(t('Message.unsupportImage')), [])
    /** try fetch head, default link - image */
    const tryFetchImage = useCallback(async (url: string) => {
        Commands.HyperLink(url)
        try {
            const response = await fetch(url, { mode: 'cors', method: 'head' })
            if (response.ok) {
                const type = response.headers.get('Content-Type')?.match(/image\/\w*/i)?.[0] ?? ''
                if (type.startsWith('image') && warnUnsupportedImage(type)) {
                    Commands.HyperLink(null)
                    const filename = url.split('/').pop()!
                    const blob = await (await fetch(url, { mode: 'cors' })).blob()
                    tryPushNewImage(filename, blob)
                }
            } else message.warn(response.status + t('Message.imageLoadFailButLink'))
        } catch (error) {
            // normally block by cors
            message.warn(t('Message.imageLoadFailButLink'))
        }
    }, [Commands, t, tryPushNewImage, warnUnsupportedImage])
    const tryPushBase64 = useCallback((base64: string) => {
        const type = base64.match(/\/\w*/)?.[0] ?? ''
        if (warnUnsupportedImage(type)) {
            const blob = base642blob(base64, type)
            const url = URL.createObjectURL(blob)
            const filename = getUUID()
            filename2blob.set(filename, blob)
            filename2objectUrl.set(filename, url)
            Commands.Image(url, filename)
        }
    }, [Commands, warnUnsupportedImage])

    // after import
    useEffect(() => {
        return mindOnOff({
            afterimport: () => {
                setTabActiveKey('')
                history.current?.reset()
                // bug? seems to cause exportJson with layout:null on node's data
                Commands.ResetLayout()
                minder.current.select(minder.current.getRoot(), true)
                // todo when data is small expand as normal, when it's big just expand to a specific level, and collapse all others !in data level!(when exporting?).
                // less than x00, expand as normal
                // less than 1000, expand to level x,
                // less than 2000, expand to level x-n...
                // Commands.ExpandToLevel(1)
                minder.current.focus()
                // wtf! very hard to debug, below causes camera always on root
                // setTimeout(Commands.Camera)
            },
        })
    }, [Commands, mindOnOff])
    // render Minder, import default data  & init history
    useEffect(() => {
        // fix: enableKeyReceiver: true,
        // minder.current.fire('paperrender')
        minder.current.renderTo('#minder')
        minder.current.importJson(defaultMinderData.current)
        history.current = new History(minder.current)
    }, [])
    // history sync contentchange
    useEffect(() => {
        return mindOnOff({ contentchange: history.current?.do })
    }, [mindOnOff])
    // save reminder
    useEffect(() => {
        return mindOnOff({
            contentchange: () => {
                clearTimeout(saved.current)
                saved.current = window.setTimeout(() => {
                    notification.open({
                        message: '导出保存一下',
                        description: '已经15分钟没有保存了',
                    })
                }, 15 * 60 * 1000)
            }
        })
    }, [mindOnOff])

    // hack image-viewer
    // useEffect(() => {
    //     // @ts-ignore
    //     const hack = minder.current._eventCallbacks['normal.dblclick'][0]
    //     minder.current.off('normal.dblclick', hack)
    // }, [])

    // when editing text, textarea attaches to the view
    useEffect(() => {
        if (editTextarea.visible) {
            const updatePosition = throttle(() => {
                const selectedNode = minder.current.getSelectedNode()!
                const box = selectedNode.getRenderBox('TextRenderer')
                setEditTextarea(o => ({ ...o, left: box.x + 'px', top: box.y + 'px' }))
            }, 50, { trailing: true })
            const blurInput = () => { editTextareaRef.current?.blur() }
            return mindOnOff({
                'layoutallfinish viewchanged': updatePosition,
                'contentchange': blurInput,
                'beforemousedown': blurInput,
            })
        }
    }, [editTextarea.visible, mindOnOff])

    // edit text
    const edit = useCallback(() => {
        const selectedNode = minder.current.getSelectedNode()
        if (selectedNode) {
            minder.current.select(selectedNode, true)
            // hard bug: posBox.width=0
            const posBox = selectedNode.getRenderBox('TextRenderer')
            const sizeBox = selectedNode.getRenderer('TextRenderer')._renderShape.node.getBoundingClientRect()
            // selectedNode.getData('font-size') ||
            const fontSize = selectedNode.getStyle('font-size')
            // hard bug: when keyboardEvent is composing, minder will get keydown event with key:'/' and keyCode:191, but code is correct
            // and key:'/' cause node's expandState change, and contentchange
            minder.current.setStatus('textedit')
            setEditTextarea({
                visible: true, value: selectedNode.getText(), fontSize: fontSize + 'px'
                , left: posBox.x + 'px', top: posBox.y + 'px'
                , minWidth: sizeBox.width + 2 + 'px', minHeight: sizeBox.height + 6 + 'px',
            })
        }
    }, [])
    useEffect(() => {
        return mindOnOff({ 'normal.dblclick hand.dblclick': edit })
    }, [edit, mindOnOff])

    // init Hotbox
    // todo a lot of other operation
    useEffect(() => {
        hotbox.current = new window.HotBox('#minder')
        const main = hotbox.current!.state('main')
        main.button({ position: 'center', label: () => t('Operation.edit'), key: 'E', action: edit })
        main.button({ position: 'ring', label: () => t('Operation.arrangeUp'), key: 'Alt+Up', action: Commands.ArrangeUp })
        main.button({ position: 'ring', label: () => t('Operation.appendChild'), key: 'Tab', action: () => Commands.AppendChildNode('Todo') })
        main.button({ position: 'ring', label: () => t('Operation.appendSibling'), key: 'Enter', action: () => { Commands.AppendSiblingNode('Todo') } })
        main.button({ position: 'ring', label: () => t('Operation.arrangeDown'), key: 'Alt+Down', action: Commands.ArrangeDown })
        main.button({ position: 'ring', label: () => t('Operation.delete'), key: 'Delete', action: Commands.RemoveNode })
        main.button({ position: 'ring', label: () => t('Operation.appendParent'), key: 'Shift+Tab', action: () => { Commands.AppendParentNode('Todo') } })
        main.button({ position: 'top', label: () => t('Operation.progress'), key: 'P', next: 'progress' })
        main.button({ position: 'top', label: () => t('Operation.priority'), key: 'G', next: 'priority' })
        main.button({ position: 'bottom', label: () => t('Operation.redo'), key: 'Ctrl+Y', action: history.current?.redo })
        main.button({ position: 'bottom', label: () => t('Operation.undo'), key: 'Ctrl+Z', action: history.current?.undo })
        const progress = hotbox.current!.state('progress')
        progress.button({ position: 'center', label: () => t('Operation.remove'), key: 'Delete', action: () => Commands.Progress(0) })
        progress.button({ position: 'bottom', label: () => t('Operation.back'), key: 'Esc', next: 'back' })
        Array(9).fill('').forEach((v, i) => {
            progress.button({ position: 'ring', label: `P${i + 1}`, key: (i + 1) + '', action: () => { Commands.Progress(i + 1) } })
        })
        const priority = hotbox.current!.state('priority')
        priority.button({ position: 'center', label: () => t('Operation.remove'), key: 'Delete', action: () => Commands.Priority(0) })
        priority.button({ position: 'bottom', label: () => t('Operation.back'), key: 'Esc', next: 'back' })
        Array(9).fill('').forEach((v, i) => {
            priority.button({ position: 'ring', label: `G${i + 1}`, key: (i + 1) + '', action: () => { Commands.Priority(i + 1) } })
        })
        // detect i18n.languageChanged
        i18next.on('languageChanged', () => {
            [main, progress, priority].forEach(v => v.rerender())
        })
        return () => i18next.off('languageChanged')
    }, [Commands, edit, t])
    // idle/active hotbox
    const idleHotbox = useCallback(() => { if (hotbox.current?.state() !== 'idle') hotbox.current?.active('idle') }, [])
    // clickoutside2idle
    useClickOutside(idleHotbox, () => hotbox.current?.$element)
    // contextmenu&space2active
    useEffect(() => {
        const contextmenuActive = (e: MindEventWapped<MouseEvent>) => {
            if (minder.current.getSelectedNode()) hotbox.current?.active('main', e.getPosition('paper'))
        }
        const spaceActive = (e: MindEventWapped<KeyboardEvent>) => {
            // actived and intercept all KeyboardEvent
            if (hotbox.current?.state() !== 'idle') {
                hotbox.current!.dispatch(e.originEvent)
                e.stopPropagationImmediately()
            } else if (e?.originEvent?.key === ' ') {
                minder.current.select(minder.current.getSelectedNode() ?? [], true)
                const node = minder.current.getSelectedNode()
                if (node) {
                    const box = node.getRenderBox()
                    hotbox.current?.active('main', { x: box.x + box.width / 2, y: box.y + box.height / 2 })
                } else {
                    // no node is selected, active to do some other operations or not, maybe set hotbox's enable
                    // hotbox.current?.dispatch(e?.originEvent)
                }
                e.stopPropagationImmediately()
            }
        }
        return mindOnOff({
            'contextmenu': contextmenuActive,
            'normal.prekeydown normal.prekeyup': spaceActive,
            'layoutallfinish viewchanged': idleHotbox,
        })
    }, [idleHotbox, mindOnOff])

    // paste image file/base64 or link on nodes
    // todo readme rules
    // todo conflit to paste nodes always hint, and paste node always working...
    useEffect(() => {
        const paste = async (e: MindEventWapped<ClipboardEvent>) => {
            if (!minder.current.getSelectedNodes()?.length) return;
            const { originEvent: { clipboardData } } = e
            e.stopPropagationImmediately()
            if (clipboardData?.types.includes('Files')) {
                const file = clipboardData.files[0]
                if (warnUnsupportedImage(file.name)) tryPushNewImage(file.name, file)
            }
            // paste some text
            else if (clipboardData?.types.includes('text/link-preview')) {
                const url = clipboardData.getData('text/plain')
                await tryFetchImage(url)
            }
            // forget about the perfect regex
            // how gfm does
            // https://github.github.com/gfm/#autolinks-extension-
            else if (clipboardData?.types.includes('text/plain')) {
                const text = clipboardData.getData('text/plain').trim()
                // base64, random name
                // spec https://datatracker.ietf.org/doc/html/rfc2397
                if (isBase64(text)) tryPushBase64(text)
                /**
                 * here i'm actually looking for a string which is fetch-able(network requestable, could represent a network resource)
                 * but after reading the spec https://webidl.spec.whatwg.org/#idl-USVString
                 * it seems like, any string is fetch-able
                 * so fall back to imperfect Regex
                 */
                // const url = new URL(text, window.location.origin)
                // https://github.com/fiquu/is/blob/6a73853/src/regexp/url.ts#L13
                // spec https://datatracker.ietf.org/doc/html/rfc3986/#section-3.1
                else if (isURL(text)) {
                    try {
                        const url = new URL(text, text.startsWith('//') ? window.location.origin : undefined)
                        await tryFetchImage(url.href)
                    } catch (error) {
                        message.warn(t('Message.invalidLink'))
                    }
                } else message.info(t('Message.imageOrLinkNotRecognized'))
            }
        }
        return mindOnOff({ paste })
    }, [Commands, mindOnOff, t, tryFetchImage, tryPushBase64, tryPushNewImage, warnUnsupportedImage])

    // DropOnNode text, file but not directory
    // if there's only one file and also a supported image, replace the image, else attachment
    useEffect(() => {
        const DropOnNode = async (e: MindEventWapped<DragEvent>) => {
            const { node, originEvent: { dataTransfer } } = e
            minder.current.select(node, true)
            switch (true) {
                case dataTransfer?.types.includes('Files'): {
                    const files = dataTransfer?.files
                    if (files?.length === 1) {
                        const file = files[0]
                        if (isSupportedImage(file.type)) {
                            return tryPushNewImage(file.name, file)
                        }
                    }
                    const items = dataTransfer?.items
                    // todo maybe refactor2files
                    // ie only supports files, and FileReader goes error when it's a directory
                    if (!items) return;
                    const newFiles: string[] = []
                    const _ = e.node?.getData('extra')
                    // https://html.spec.whatwg.org/multipage/dnd.html#the-datatransferitemlist-interface
                    // In the normal loop, like for...of, forEach...
                    // When you try await something inside, DataTransferItemList will fall into disabled mode easily.
                    await Promise.allSettled(Array.prototype.map.call(items, async (item: DataTransferItem) => {
                        if (item.kind === 'file') {
                            if (window.showOpenFilePicker) {
                                // @ts-ignore
                                const entry = await item.getAsFileSystemHandle()
                                if (entry.kind === 'file') {
                                    const file: File = await entry.getFile()
                                    if (!_?.includes(file.name)) {
                                        newFiles.push(file.name)
                                        tryPushNewBlob(file.name, file)
                                    }
                                } else if (entry.kind === 'directory') {
                                    message.warn(t('Message.directoryNotSupported'))
                                }
                            } else if (item.webkitGetAsEntry) {
                                const fileEntry = item.webkitGetAsEntry()
                                if (fileEntry?.isFile) {
                                    const file = await FileEntryReader(fileEntry)
                                    if (!_?.includes(file.name)) {
                                        newFiles.push(file.name)
                                        tryPushNewBlob(file.name, file)
                                    }
                                } else if (fileEntry?.isDirectory) {
                                    message.warn(t('Message.directoryNotSupported'))
                                }
                            }
                        }
                    }))
                    if (newFiles.length) Commands.Extra((_ ?? []).concat(newFiles), node)
                } break;
                case dataTransfer?.types.includes('text/uri-list'): {
                    const uri = dataTransfer!.getData('text/uri-list').trim()
                    if (isBase64(uri)) tryPushBase64(uri)
                    else await tryFetchImage(uri)
                } break;
                default: message.info(t('Message.imageOrLinkNotRecognized'))
            }
        }
        // show delete button
        const click = (e: MindEventWapped<MouseEvent>) => {
            const container = e.kityEvent.targetShape.container
            const node = minder.current.getSelectedNode()!
            if (container?.getType?.() === 'ExtraIcon') {
                const box = e.getPosition('paper')
                const filename = container.node.textContent!
                setDeleteButton({
                    visible: true, style: { left: box.x + 10 + 'px', top: box.y + 10 + 'px' }, onClick: () => {
                        Commands.Extra(node.getData('extra')?.filter(v => v !== filename))
                        setDeleteButton({ visible: false })
                        // shouldn't delete any resource, because of undo
                        // setTimeout(() => {
                        //     const allExtra = minder.current.getAllNodeExtra()
                        //     // not used in image & other nodes' extra
                        //     if (!filename2objectUrl.has(filename) && !allExtra.includes(filename)) filename2blob.delete(filename)
                        // })
                    }
                })
            }
        }
        // download
        const dblclick = (e: MindEventWapped<MouseEvent>) => {
            const container = e.kityEvent.targetShape.container
            if (container?.getType?.() === 'ExtraIcon') {
                // stop edit
                e.stopPropagationImmediately()
                const filename = container.node.textContent!
                downloadFiles(filename2blob.get(filename), filename)
            }
        }
        return mindOnOff({ DropOnNode, click, dblclick, })
    }, [Commands, mindOnOff, t, tryFetchImage, tryPushBase64, tryPushNewBlob, tryPushNewImage, warnUnsupportedImage])
    // hide extra delete button
    useClickOutside(() => { setDeleteButton({ visible: false }) }, deleteButtonRef)
    useEffect(() => {
        if (deleteButton.visible) return mindOnOff({ 'layoutallfinish viewchanged': () => setDeleteButton({ visible: false }), })
    }, [deleteButton.visible, mindOnOff])

    // update note
    // bug always set root's note '' when open
    const synchronizedNote = useCallback(throttle(Commands.Note, 250, { trailing: true }), [])
    useEffect(() => {
        synchronizedNote(noteValue)
    }, [noteValue, synchronizedNote])
    // click noteicon to edit note
    useEffect(() => {
        const click = (e: MindEventWapped<MouseEvent>) => {
            if (e.kityEvent.targetShape.container?.getType?.() === 'NoteIcon') {
                minder.current.select(minder.current.getSelectedNode() ?? [], true)
                setNoteValue(minder.current.queryCommandValue('Note'))
                setTabActiveKey('note')
            }
        }
        return mindOnOff({ click })
    }, [mindOnOff])
    // flush note edit panel
    useEffect(() => {
        if (tabActiveKey === 'note') {
            const selectionchange = () => {
                minder.current.select(minder.current.getSelectedNode() ?? [], true)
                setNoteValue(minder.current.queryCommandValue('Note'))
            }
            return mindOnOff({ selectionchange })
        }
    }, [mindOnOff, tabActiveKey])

    // preview note
    useEffect(() => {
        let id = 0
        const shownoterequest = (e: MindEventWapped<NoteEvents>) => {
            const box = e.icon.getRenderBox('paper')
            const left = box.x + 'px'
            const top = box.y + 31 + 'px'
            id = window.setTimeout(() => {
                setPreviewNote({ now: e, visible: true, __html: marked(e.node.getData('note')!), style: { left, top } })
            }, 100)
        }
        const hidenoterequest = () => { clearTimeout(id) }
        return mindOnOff({ shownoterequest, hidenoterequest, })
    }, [mindOnOff])
    useEffect(() => {
        if (!previewNote.visible) return;
        const hidePreview = () => { setPreviewNote(o => ({ ...o, visible: false })) }
        const updatePosition = throttle(() => {
            const e = previewNote.now!
            const box = e.icon.getRenderBox('paper')
            const left = box.x + 'px'
            const top = box.y + 31 + 'px'
            setPreviewNote(o => ({ ...o, style: { left, top } }))
        }, 50, { trailing: true })
        return mindOnOff({
            'layoutallfinish viewchanged': updatePosition,
            'contentchange': hidePreview,
            'beforemousedown': hidePreview,
        })
    }, [previewNote.visible, previewNote.now, mindOnOff])

    // add shortcuts
    useEffect(() => {
        minder.current.addShortcut('Ctrl+Y', history.current!.redo)
        minder.current.addShortcut('Ctrl+Z', history.current!.undo)
        minder.current.addShortcut('E', edit)
        minder.current.addShortcut('Ctrl+F', () => {
            setTabActiveKey('search')
        })
        // todo paste node always working...
        minder.current.addCommandShortcutKeys('Copy', 'Ctrl+C')
        minder.current.addCommandShortcutKeys('Cut', 'Ctrl+X')
        minder.current.addCommandShortcutKeys('Paste', 'Ctrl+V', true)
        // override
        minder.current.addShortcut('Enter', () => Commands.AppendSiblingNode('Todo'))
        minder.current.addShortcut('Tab|Insert', () => Commands.AppendChildNode('Todo'))
        minder.current.addShortcut('Shift+Tab', () => Commands.AppendParentNode('Todo'))
        // / en / -> cn 、
        const _ = (e: KeyboardEvent) => {
            if (e.key === 'Process') {
                minder.current.dispatchKeyEvent(Object.defineProperties(e, {
                    key: { value: '/' },
                    keyCode: { value: 191 },
                }))
                e.stopPropagation()
            }
        }
        document.body.addEventListener('keydown', _, true)
        return () => document.body.removeEventListener('keydown', _, true)
    }, [Commands, edit])

    // url share
    useEffect(() => {
        const share = location.hash.split('/')?.[1]
        if (share) {
            minder.current.importJson(JSON.parse(LZString.decompressFromEncodedURIComponent(share) ?? ''))
        }
    }, [])
    // delete useless properties
    const shareZip = useMemo<Record<keyof iMinderNode["data"], (node: UnPartial<iMinderNode['data']>) => boolean>>(() => ({
        id: () => true,
        created: () => true,
        text: ({ text }) => !text.length,
        expandState: ({ expandState }) => expandState === 'expand',
        progress: ({ progress }) => progress < 1 || progress > 9,
        hyperlink: ({ hyperlink }) => !hyperlink.length,
        hyperlinkTitle: () => true,
        resource: ({ resource }) => !resource.length,
        priority: ({ priority }) => priority < 1 || priority > 9,
        note: ({ note }) => !note.length,
        image: ({ image }) => !/^(https?:)?\/\//.test(image),
        imageTitle: ({ image }) => !image || !/^(https?:)?\/\//.test(image),
        imageSize: ({ image }) => !image || !/^(https?:)?\/\//.test(image),
        extra: () => true,
    }), [])

    // expose stuffs to window
    useEffect(() => {
        console.log('minder', window.minder = minder.current)
        console.log('FileResources', window.FileResources = { filename2blob, filename2objectUrl })
        if (process.env.NODE_ENV === 'development') {
            console.log('kmhistory', window.kmhistory = history.current)
            console.log('hotbox', window.hotbox = hotbox.current)
            minder.current.on('beforeExecCommand', e => {
                // debug command executed as expected
                console.info('beforeExecCommand', e)
            })
        }
    }, [])

    const parserMap: Record<string, (file: File) => Promise<iMinderData>> = useMemo(() => ({
        km: async file => JSON.parse(await file.text()),
        xmind: async file => await Parser.parseXmind(file),
        km2: async file => await Parser.parseKm2(file),
    }), [])
    // parse km, km2, xmind
    const parseFile = useCallback(async (files: null | File[] | FileList) => {
        const file = files?.[0]
        const filename = file?.name.split('.').pop() ?? ''
        if (file && Object.keys(parserMap).includes(filename)) {
            // todo readme every import will clear all file caches, even when import may fails
            filename2blob.clear()
            filename2objectUrl.forEach(URL.revokeObjectURL)
            filename2objectUrl.clear()
            try {
                const json = await parserMap[filename]?.(file) ?? defaultMinderData.current
                minder.current.importJson(json)
            } catch (error) {
                message.warn(t('Message.fail2import'))
            }
        } else message.warn(t('Message.unsupportFile'))
    }, [parserMap, t])

    const TextDraggable = useDraggable({ dataTransfer: { type: 'Text' } })
    const HyperLinkDraggable = useDraggable({ dataTransfer: { type: 'HyperLink' } })
    const ImageDraggable = useDraggable({ dataTransfer: { type: 'Image' } })
    const ResourceDraggable = useDraggable({ dataTransfer: { type: 'Resource' } })
    const NoteDraggable = useDraggable({ dataTransfer: { type: 'Note' } })
    const ExtraDraggable = useDraggable({ dataTransfer: { type: 'Extra' } })
    const DeleteDropable = useDropable({
        onDrop: e => {
            const v = e.dataTransfer.getData('type') as typeof MinderCommands[number]
            Commands[v](null)
            e.stopPropagation()
        }
    })
    const MinderDropable = useDropable({
        onDrop: e => { parseFile(e.dataTransfer.files); e.stopPropagation(); e.preventDefault() }
    })

    return <MinderContext.Provider value={{ minder: minder.current, Commands, mindOnOff }}>
        <div className="minder">
            <div className="operate">
                <div className="ports">
                    <Button type='link' onClick={async () => {
                        // todo readme only support text, struct, tags, link, note and online image
                        const json = minder.current.exportJson()
                        json.tags = tagRef.current?.getLatestTag()
                        const traverse = ({ data, children }: iMinderNode) => {
                            let key: keyof iMinderNode['data']
                            for (key in data) {
                                if (Object.prototype.hasOwnProperty.call(shareZip, key)) {
                                    if (data[key] == null) { Reflect.deleteProperty(data, key); continue; }
                                    if (shareZip[key](data as UnPartial<typeof data>)) Reflect.deleteProperty(data, key)
                                }
                            }
                            // todo when childs'length is zero, delete
                            children.forEach(traverse)
                        }
                        // todo refactor2replacer
                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
                        traverse(json.root)
                        const share = window.location.origin + window.location.pathname + '#share/' + LZString.compressToEncodedURIComponent(JSON.stringify(json))
                        try {
                            await copy(share)
                            message.success({ content: t('Message.copy2clipboard'), style: { paddingTop: '40vh' }, duration: 1.5 })
                        } catch (error) {
                            message.warn(t('Message.fail2share'))
                        }
                    }} icon={<SmileTwoTone rotate={new Date().getMonth() === 3 && new Date().getDate() === 1 ? 180 : 0} />}>{t('Operation.share')}</Button>
                    <Button icon={<ExportOutlined />} type='text' onClick={async () => {
                        const json = minder.current.exportJson()
                        json.tags = tagRef.current?.getLatestTag()
                        const blobWriter = new zip.BlobWriter("application/km2")
                        const writer = new zip.ZipWriter(blobWriter, { useWebWorkers: true, bufferedWrite: true })
                        const allWriting = []
                        const traverse = ({ data, children }: iMinderNode) => {
                            if (data.image && data.imageTitle) {
                                const blob = filename2blob.get(data.imageTitle)
                                if (blob) {
                                    data.image = data.imageTitle
                                    allWriting.push(writer.add('files/' + data.imageTitle, new zip.BlobReader(blob)))
                                }
                            }
                            if (data.extra?.length) {
                                data.extra.forEach(v => {
                                    const blob = filename2blob.get(v)
                                    if (blob) allWriting.push(writer.add('files/' + v, new zip.BlobReader(blob)))
                                })
                            }
                            children.forEach(traverse)
                        }
                        traverse(json.root)
                        allWriting.unshift(writer.add("content.json", new zip.TextReader(JSON.stringify(json))))
                        try {
                            await Promise.all(allWriting)
                        } catch (error) {
                            message.warn(t('Message.fail2export'))
                        }
                        await writer.close()
                        downloadFiles(await blobWriter.getData(), (minder.current.getMinderTitle() || 'Todo') + '.km2')
                        clearTimeout(saved.current)
                    }}>{t('Operation.export')}</Button>
                    <Button icon={<ImportOutlined />} type='text' onClick={() => importInputRef.current?.click()}>{t('Operation.import')}
                        <input accept='.km,.km2,.xmind' ref={importInputRef} type='file' style={{ display: 'none' }}
                            onChange={({ target: { files } }) => { parseFile(files) }}></input>
                    </Button>
                </div>
                <div className="do">
                    <Button icon={<RedoOutlined />} type='text' onClick={() => history.current?.redo()}>{t('Operation.redo')}</Button>
                    <Button icon={<UndoOutlined />} type='text' onClick={() => history.current?.undo()}>{t('Operation.undo')}</Button>
                    <Button icon={<SearchOutlined />} type='text' onClick={() => { setTabActiveKey('search') }}>{t('Operation.search')}</Button>
                </div>
                <div className="nodes">
                    <Button icon={<SubnodeOutlined rotate={180} />} type='text' onClick={() => Commands.AppendParentNode('Todo')}>{t('Operation.appendParent')}</Button>
                    <Button icon={<SisternodeOutlined />} type='text' onClick={() => Commands.AppendSiblingNode('Todo')}>{t('Operation.appendSibling')}</Button>
                    <Button icon={<SubnodeOutlined />} type='text' onClick={() => Commands.AppendChildNode('Todo')}>{t('Operation.appendChild')}</Button>
                </div>
                <div className="move">
                    <Button icon={<ArrowUpOutlined />} type='text' onClick={Commands.ArrangeUp}>{t('Operation.arrangeUp')}</Button>
                    <Button icon={<ArrowDownOutlined />} type='text' onClick={Commands.ArrangeDown}>{t('Operation.arrangeDown')}</Button>
                    <Button icon={<ClearOutlined />} type='text' onClick={Commands.RemoveNode}>{t('Operation.delete')}</Button>
                </div>
                <div className="multi">
                    <div className="media">
                        <Button icon={<EditOutlined />} type='text' {...TextDraggable} onClick={edit}> {t('Operation.text')}</Button>
                        <Button icon={<LinkOutlined />} type='text'{...HyperLinkDraggable} onClick={() => {
                            setMultiInput({
                                visible: true, placeholder: t('Operation.linkHint'), onBlur: ({ target: { value } }) => {
                                    setMultiInput(o => ({ ...o, visible: false })); const v = value.trim();
                                    if (v) Commands.HyperLink(v)
                                }
                            })
                        }}>{t('Operation.link')}</Button>
                        <Popover placement='rightTop' content={t('Operation.imageUploadHint')}>
                            <Button icon={<PictureOutlined />} type='text' {...ImageDraggable} onDoubleClick={() => imageUploadRef.current?.click()}
                                onClick={() => {
                                    setMultiInput({
                                        visible: true, placeholder: t('Operation.imageHint'), onBlur: async ({ target: { value } }) => {
                                            setMultiInput(o => ({ ...o, visible: false }))
                                            const v = value.trim()
                                            const filename = v.split('/').pop()
                                            if (!filename) return;
                                            // shouldn't & hard to short
                                            // normal xxx/xxx.png(?xx), sometimes xxx/xxx(?xx=xx)...
                                            try {
                                                let url
                                                if (filename2blob.has(filename)) {
                                                    message.info('Message.sameFilename')
                                                    url = filename2objectUrl.get(filename) ?? URL.createObjectURL(filename2blob.get(filename))
                                                } else {
                                                    const response = await fetch(v, { mode: 'cors' })
                                                    const type = response.headers.get('Content-Type')?.match(/\/\w*/i)?.[0] ?? ''
                                                    if (!warnUnsupportedImage(type)) return;
                                                    const blob = await response.blob()
                                                    filename2blob.set(filename, blob)
                                                    url = URL.createObjectURL(blob)
                                                }
                                                filename2objectUrl.set(filename, url)
                                                Commands.Image(url, filename)
                                            } catch (error) {
                                                message.warn(t('Message.imageLoadFail_UseLinkInstead'))
                                                Commands.Image(v, filename)
                                            }
                                        }
                                    })
                                }}>{t('Operation.image')}
                                <input ref={imageUploadRef} accept='.jpg,.jpeg,.png,.gif' type="file" hidden onChange={({ target: { files } }) => {
                                    const file = files?.[0]
                                    if (file && warnUnsupportedImage(file.name)) tryPushNewImage(file.name, file)
                                }} />
                            </Button>
                        </Popover>
                        <Button icon={<TagOutlined />} type='text' {...ResourceDraggable} onClick={() => {
                            setTabActiveKey('tag')
                        }}>{t('Operation.tag')}</Button>
                        <Button icon={<FileTextOutlined />} type='text' {...NoteDraggable} onClick={() => {
                            setTabActiveKey('note')
                            minder.current.select(minder.current.getSelectedNode() ?? [], true)
                            setNoteValue(minder.current.queryCommandValue('Note'))
                        }}>{t('Operation.note')}</Button>
                        <Button icon={<PaperClipOutlined />} type='text' {...ExtraDraggable} onClick={() => {
                            if (minder.current.getSelectedNodes()?.length) filesUploadRef.current?.click()
                            else {
                                setTabActiveKey('extra')
                                message.info(t('Message.NoNodeSelected'))
                            }
                        }}>{t('Operation.extra')}
                            <input ref={filesUploadRef} multiple type="file" hidden onChange={({ target: { files } }) => {
                                const nodes = minder.current.getSelectedNodes()
                                if (!files?.length || !nodes?.length) return message.info(t('Message.NoFileUploaded_NoNodeSelected'));
                                const filenames: string[] = []
                                for (const file of files) {
                                    filenames.push(file.name)
                                    tryPushNewBlob(file.name, file)
                                }
                                nodes.forEach(node => {
                                    const extras = node.getData('extra') ?? []
                                    const final = new Set(extras.concat(filenames))
                                    Commands.Extra(Array.from(final), node)
                                })
                            }} onClick={(e: any) => e.target.value = null} /></Button>
                    </div>
                    {multiInput.visible ? <Input autoFocus placeholder={multiInput.placeholder} ref={multiInputRef} onBlur={multiInput.onBlur}></Input>
                        : <div className="remove" {...DeleteDropable}><RestOutlined /></div>}
                </div>
                <div className="priorities" onClickCapture={(e: any) => { Commands.Priority(+e.target.innerText) }}>
                    {Array(10).fill('').map((v, i) => <div className="priority" style={{ backgroundPositionY: - i * 20 }} key={i}>{i}</div>)}
                </div>
                <div className="progresses" onClickCapture={(e: any) => { Commands.Progress(+e.target.innerText) }}>
                    {Array(10).fill('').map((v, i) =>
                        <div className="progress" style={{ backgroundPositionY: - i * 20 }} key={i}>{i}</div>)}
                </div>
                <div className="colors" onClickCapture={({ target }: any) => { Commands.Background(target.style.backgroundColor) }}>
                    {[0, 25, 122, 204, 246, 334].map(v => [`hsl(${v}, 37%, 60%)`, `hsl(${v}, 33%, 95%)`])
                        .flat().concat(['#e9df98', '#a4c5c0', 'rgb(254, 219, 0)', '#99ca6a', '#999', 'gray', 'black', 'white', 'transparent',])
                        .map(v => <div className="color" style={{ backgroundColor: v }} key={v} />)}
                    <Button icon={<BgColorsOutlined />} type='text' onClick={() => minder.current.getSelectedNodes()?.forEach(v => v.resetBackground())}>{t('Operation.reset')}</Button>
                </div>
            </div>
            {/* todo readme drag&drop to import */}
            <div id="minder" {...MinderDropable} onContextMenu={e => e.preventDefault()}>
                {editTextarea.visible ?
                    <AutoSizeTextArea style={{
                        position: 'absolute', padding: 0, fontSize: editTextarea.fontSize
                        , minWidth: editTextarea.minWidth, minHeight: editTextarea.minHeight,
                        left: editTextarea.left, top: editTextarea.top,
                    }}
                        ref={editTextareaRef} autoFocus defaultValue={editTextarea.value} onFocus={e => e.target.select()}
                        onBlur={e => {
                            minder.current.setStatus('normal')
                            setEditTextarea(o => ({ ...o, visible: false }))
                            Commands.Text(e.target.value)
                            minder.current.focus()
                        }} /> : ''}
                <Drawer placement='left' getContainer={false} mask={false} closable={false} visible={['search', 'tag', 'note', 'extra'].includes(tabActiveKey)}
                    style={{ position: 'absolute' }} width='320px' bodyStyle={{ padding: '5px 10px' }} >
                    <Tabs tabBarGutter={10} activeKey={tabActiveKey} onTabClick={(v: any) => setTabActiveKey(v)}
                        tabBarExtraContent={<CloseOutlined className='closeIcon' onClick={() => setTabActiveKey('')} />}>
                        <TabPane tab={t('Operation.search')} key='search'>
                            <SearchList active={tabActiveKey === 'search'} />
                        </TabPane>
                        <TabPane tab={t('Operation.tag')} key='tag'>
                            <DragTags tags={defaultMinderData.current.tags ?? []} ref={tagRef}></DragTags>
                        </TabPane>
                        <TabPane tab={t('Operation.note')} key='note'>
                            <div className="scrollarea">
                                <TextArea allowClear showCount autoSize value={noteValue} onChange={({ target: { value } }) => { setNoteValue(value) }}></TextArea>
                                <Button className="textarea-hint" type='link' target='_blank' href='https://guides.github.com/features/mastering-markdown/'>{t('Message.GFMSupported')}</Button>
                            </div>
                        </TabPane>
                        <TabPane tab={t('Operation.extra')} key='extra'>
                            <ExtraList />
                        </TabPane>
                    </Tabs>
                </Drawer>
                {previewNote.visible ? <div className="previewNote" style={previewNote.style} dangerouslySetInnerHTML={{ __html: previewNote.__html }}></div> : ''}
                {deleteButton.visible ? <Button danger ref={deleteButtonRef} style={{ position: 'absolute', ...deleteButton.style }} onClick={deleteButton.onClick}>{t('Operation.remove')}</Button> : ''}
            </div>
            <Statusbar />
        </div >
    </MinderContext.Provider >
}
