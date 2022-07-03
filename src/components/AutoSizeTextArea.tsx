import React, { forwardRef, } from "react"

export const AutoSizeTextArea = forwardRef<HTMLTextAreaElement | null, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({
    style, onChange, ...rest
}, ref) => {
    const onChangeWrapper = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto'
        e.target.style.height = e.target.scrollHeight + 'px'
        const FinalStyle = getComputedStyle(e.target)
        const width = MeasureTextWidth(e.target.value, FinalStyle)
        e.target.style.width = width + 'px'
        onChange?.(e)
    }
    return <textarea ref={ref} {...rest} rows={1} style={{ overflow: 'inherit', ...style, resize: 'both' }} onChange={onChangeWrapper}
        onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.target.blur() } }} />
})

export const MeasureTextWidth = (text: string, ComputedStyle: CSSStyleDeclaration): number => {
    const _ = document.createElement('span')
    _.style.font = ComputedStyle.font
    _.style.whiteSpace = 'pre' ?? ComputedStyle.whiteSpace
    _.style.border = ComputedStyle.border
    _.textContent = text
    document.body.appendChild(_)
    const width = _.getBoundingClientRect().width
    document.body.removeChild(_)
    return width + 2
}