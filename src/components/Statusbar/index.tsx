import React, { useEffect, useState, useMemo, useContext, useCallback } from 'react'
import type { FC } from 'react'
import { Button, message, Popover, Slider, Image } from 'antd'
import { DeploymentUnitOutlined, DragOutlined, LockOutlined, UnlockOutlined, ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, GatewayOutlined, GlobalOutlined, ApartmentOutlined } from '@ant-design/icons'
import type { kityMinder, MinderNode, } from '../../types/mind'
import { writeBase64 } from '../../utils/clipboard'
import { useForceUpdate } from '../../utils/hooks'
import { Keyboard } from '../Keyboard'
import { AllShortcuts } from '../../types/editor'
import { useTranslation } from 'react-i18next'
import './index.less'
import { HoverSelect } from '../HoverSelect'
import * as TemplateImage from '@image/template'
import * as ThemeImage from '@image/theme'
import * as langs from '@src/intl'
import { LanguageContext, MinderContext } from '@src/context'
import { appendStyleSheet } from '@src/utils/utils'

const DarkMode = {
    antdDark: './static/antd.dark.min.css',
    customDark: './static/dark-mode.css',
} as const
const SuperDarkMode = {
    superDark: './static/super-dark-mode.css',
} as const
const Selecting = ['all', 'revert', 'siblings', 'level', 'path', 'tree'] as const
export const Statusbar: FC = () => {
    const update = useForceUpdate()
    const { t } = useTranslation()
    const { minder, Commands, mindOnOff } = useContext(MinderContext)!
    const switchLang = useContext(LanguageContext)
    const [imgsrc, setImgsrc] = useState('')
    const [selections, setSelections] = useState<MinderNode[]>([])
    const templates = useMemo(() => Object.keys(window.kityminder.Minder.getTemplateList()), [])
    const themes = useMemo(() => Object.keys(window.kityminder.Minder.getThemeList()), [])
    const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches)

    useEffect(() => {
        if (darkMode) Object.entries(DarkMode).forEach(v => appendStyleSheet(...v))
    }, [])

    const multiSelect = useCallback((type) => {
        const _ = minder.getSelectedNodes() ?? []
        let selected: MinderNode[] = []
        switch (type) {
            case 'all':
                selected = minder.getAllNode() ?? []
                break;
            case 'revert':
                selected = minder.getAllNode()?.filter(v => !_.includes(v)) ?? []
                break;
            case 'siblings':
                _.forEach(v => selected.push(...v.parent!.children.filter(vv => !_.includes(vv))))
                break;
            case 'level': {
                const levels = _.map(v => v.getLevel())
                selected = minder.getAllNode().filter(v => levels.includes(v.getLevel())) ?? []
            } break;
            case 'path':
                selected = [..._]
                _.forEach(v => {
                    let parent: MinderNode = v
                    while (parent.parent) selected.push(parent = parent.parent)
                })
                break;
            case 'tree':
                _.forEach(v => {
                    const tree: MinderNode[] = []
                    v.traverse(node => tree.push(node))
                    selected.push(...tree)
                })
                break;
        }
        minder.select(selected, true)
    }, [minder])

    // selection update & minder focus
    useEffect(() => {
        return mindOnOff({
            selectionchange: ({ minder }: { minder: kityMinder }) => {
                const selections = minder.getSelectedNodes() ?? []
                setSelections(selections)
                minder.focus()
            }
        })
    }, [mindOnOff, minder])

    useEffect(() => {
        return mindOnOff({ 'focus blur zoom': update })
    }, [mindOnOff, update])

    return <div className="statusbar">
        <div className="preview">
            <Popover placement='topLeft' onVisibleChange={async (v: boolean) => {
                if (v) { setImgsrc(await minder.exportData('png')) }
            }} content={<Image src={imgsrc} style={{ maxHeight: '50vh', maxWidth: '50vw' }} />}>
                <Button type='text' onClick={async () => {
                    const result = await writeBase64(await minder.exportData('png'))
                    message[result ? 'success' : 'error'](result ? { content: t('Statusbar.copied'), style: { paddingTop: '40vh' }, duration: 1.5 } : t('Statusbar.permission'))
                }}>{t(`Statusbar.preview`)}</Button></Popover>
        </div>
        <div className="templates">
            <HoverSelect cols={2} options={templates} onSelect={Commands.Template}
                renderOptions={templates.map(v => <div id='mindeditor-template'
                    // @ts-ignore
                    style={{ backgroundImage: `url(${TemplateImage[v.substr(0, 4)]})` }} />)}>
                {t(`Statusbar.template`)}
            </HoverSelect>
        </div>
        <div className="theme">
            <HoverSelect cols={4} options={themes} onSelect={Commands.Theme}
                renderOptions={themes.map(v => <div id='mindeditor-theme'
                    // @ts-ignore
                    style={{ backgroundImage: `url(${ThemeImage[v.replaceAll('-', '_')]})` }} />)}>
                {t(`Statusbar.theme`)}
            </HoverSelect>
        </div >
        <div className="expend">
            <Popover content={<Slider style={{ width: '200px' }} defaultValue={1} max={10} dots tipFormatter={v => v === 10 ? '∞' : v}
                onAfterChange={(v: number) => Commands.ExpandToLevel(v === 10 ? 99 : v)} />}>{t(`Statusbar.expand`)}</Popover>
        </div>
        <div className="select">
            <HoverSelect cols={2} options={Selecting} onSelect={multiSelect}
                renderOptions={Selecting.map(v => t(`MultiSelect.${v}`))}>{t(`Statusbar.select`)}</HoverSelect>
        </div>
        <div className="multi">
            <Popover content={t(`Statusbar.resetLayout`)}>
                <Button icon={<ApartmentOutlined />} onClick={Commands.ResetLayout} />
            </Popover>
            <Popover content={t(`Statusbar.selectOrDrag`)}>
                <Button icon={minder.queryCommandState('Hand') ? <DragOutlined /> : <GatewayOutlined />} onClick={() => { Commands.Hand(); update() }} />
            </Popover>
            <Popover content={t(`Statusbar.center`)}>
                <Button icon={<DeploymentUnitOutlined />} onClick={() => { Commands.Camera() }} />
            </Popover>
            <Popover content={t(`Statusbar.editable`)}>
                <Button icon={minder.getStatus() === 'readonly' ? <LockOutlined /> : <UnlockOutlined />}
                    danger={minder.getStatus() === 'readonly'}
                    onClick={() => {
                        if (minder.getStatus() === 'readonly') {
                            minder.enable()
                            minder.setStatus('normal', true)
                        } else {
                            minder.disable()
                        }
                        update()
                    }} />
            </Popover>
        </div>
        <div className="selection">
            <Popover content={<div style={{ maxHeight: '50vh', maxWidth: '50vw', overflow: 'auto' }} onClickCapture={(e: any) => {
                const index = Array.from(e.target.parentNode.childNodes).findIndex(v => v === e.target)
                if (index !== -1) {
                    Commands.Camera(selections[index])
                    minder.select(selections[index], true)
                    Commands.Expand(true)
                }
            }}>{selections.map((v, i) => <div key={i}>{v?.getText()}</div>)}</div>}>
                {t(`Statusbar.${minder.isFocused() ? 'focus' : 'blur'}`)}&nbsp;{t(`Statusbar.selection`)}:&nbsp;{selections.length === 1 ? selections[0]?.getText() ?? t(`Statusbar.unknown`) : `${selections.length + ' ' + t(`Statusbar.node`)}`}
            </Popover>
        </div>
        <div className="zoom">
            <Popover content={<Slider style={{ width: '200px' }} tipFormatter={v => v + '%'}
                defaultValue={100} min={100} max={500} step={20} onAfterChange={Commands.Zoom} />}>
                <Button icon={<ZoomInOutlined />} onClick={() => { Commands.ZoomIn() }} /></Popover>
            <HoverSelect cols={2} renderOptions={minder._options.zoom?.map(v => v + '%') ?? []}
                options={minder._options.zoom} onSelect={Commands.Zoom}>
                &nbsp;&nbsp;{minder.getZoomValue()}%&nbsp;&nbsp;
            </HoverSelect>
            <Popover content={<Slider style={{ width: '200px' }} tipFormatter={v => v + '%'}
                defaultValue={100} min={5} max={100} step={5} onAfterChange={Commands.Zoom} />}>
                <Button icon={<ZoomOutOutlined />} onClick={() => { Commands.ZoomOut() }} /></Popover>
        </div >
        <div className="shortcuts">
            <Popover placement='topRight' content={AllShortcuts.map((v, i) =>
                <div key={i} id='mindeditor-keyboard'><Keyboard keys={v} />{t(`Shortcuts.${v}`)}</div>)
            }>{t(`Statusbar.shortcut`)}</Popover>
        </div>
        <div className="language">
            <HoverSelect renderOptions={Object.entries(langs).map(([k, v]) => <div>{v.Iam}</div>)}
                // @ts-ignore
                options={Object.keys(langs)} onSelect={switchLang}>
                <GlobalOutlined />&nbsp;{t(`Statusbar.language`)}
            </HoverSelect>
        </div>
        <div className="fullscreen">
            <div className="mode" onClick={() => {
                if (darkMode) {
                    Object.keys({ ...DarkMode, ...SuperDarkMode }).forEach(v => {
                        const _ = document.getElementById(v)
                        if (_) document.body.removeChild(_)
                    })
                } else Object.entries(DarkMode).forEach(v => appendStyleSheet(...v))
                setDarkMode(o => !o)
            }} onDoubleClick={() => {
                if (darkMode) Object.entries(SuperDarkMode).forEach(v => appendStyleSheet(...v))
            }}>{darkMode ? '🌙' : '☀'}</div>
            <Button icon={<ExpandOutlined />} onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen()
                else document.getElementsByClassName('minder')[0]?.requestFullscreen()
            }}></Button>
        </div>
    </div >
}
