import type { FC } from 'react'
import React from 'react'
import './index.less'

export const Keyboard: FC<{ keys: string }> = ({ keys }) => {
    const keyboard = keys.split(/,/)
    return <>{keyboard.map((v, i) => <span key={i}>
        <span className="keyboard">{v}</span>{(i + 1) === keyboard.length ? '  ' : ', '}
    </span>)}</>
}