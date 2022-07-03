import React, { useState } from "react"
import type { FC, ReactNode } from "react"
import { Popover } from "antd"
import "./index.less"

export const HoverSelect: FC<{
    cols?: number, renderOptions: ReactNode[], options?: any[] | readonly any[]
    onSelect: (value: any, index: number, options: any[] | readonly any[]) => void,
}> = ({ cols = 1, renderOptions, options = renderOptions, onSelect, children }) => {
    const [visible, setVisible] = useState(false)

    const content = <div className="hover-select" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
        {renderOptions.map((v, i) => <div className="item" key={i} style={{ cursor: 'pointer' }} onClick={() => {
            setVisible(false)
            onSelect(options[i], i, options)
        }}>{v}</div>)}
    </div >

    return React.createElement(Popover, { visible, content, onVisibleChange: setVisible }, children)
}