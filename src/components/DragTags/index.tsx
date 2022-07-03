import { useForceUpdate } from '../../utils/hooks'
import { DeleteOutlined } from '@ant-design/icons'
import React, { forwardRef, useImperativeHandle, useEffect, useContext, useState } from 'react'
import { MinderContext } from '../../context'
import './index.less'
import { useTranslation } from 'react-i18next'

interface iDragTags {
    tags?: string[],
}
export interface refDragTags {
    getLatestTag: () => string[]
}

export const DragTags = forwardRef<refDragTags, iDragTags>(({ tags = [] }, ref) => {
    const { t } = useTranslation()
    const { minder, mindOnOff } = useContext(MinderContext)!
    const selected = minder?.queryCommandValue('Resource') ?? []
    const [tag, setTag] = useState(tags)
    const update = useForceUpdate()
    useImperativeHandle(ref, () => ({ getLatestTag: () => tag }))

    useEffect(() => {
        return mindOnOff({ selectionchange: update })
    }, [mindOnOff, update])

    const select = (v: string, selected_: boolean) => {
        minder?.execCommand('Resource', selected_ ? selected.filter((v_: string) => v_ !== v) : selected.concat(v))
        update()
    }

    return <div className="minder-drag-tags">
        <input placeholder={`+ ${t('MainDrawer.tag')}`} onBlur={(e) => {
            const v = e.target.value
            if (v.length && !tag.includes(v))
                setTag(o => [...o, v])
            e.target.value = ''
            // @ts-ignore
        }} onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }} />
        <div className="tags">{tag.map(v =>
            <div key={v} className={selected.includes(v) ? 'tag selected' : 'tag'} style={{ backgroundColor: minder?.getResourceColor(v).toHEX() }}
                draggable onDragStart={e => { e.dataTransfer.setData('tag', v); e.dataTransfer.dropEffect = 'move' }} onClick={() => select(v, selected.includes(v))}
            >{v}</div>)} </div>
        <div className="delete" onDragOver={e => e.preventDefault()} onDrop={e => {
            const v = e.dataTransfer.getData('tag')
            setTag(tag.filter(v_ => v_ !== v))
            e.stopPropagation()
        }}><DeleteOutlined className='trashBin' /></div>
        <div className="error">
            {selected.filter((v: string) => !tag.includes(v)).map((v: string) => <div key={v} className="out" onClick={() => { select(v, true) }}>{v}</div>)}
        </div>
    </div >
})