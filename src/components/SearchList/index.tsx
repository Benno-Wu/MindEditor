import type { MinderNode } from '@src/types/mind'
import { Input, Radio } from 'antd'
import { escapeRegExp, throttle } from 'lodash-es'
import React, { useCallback, useRef, useState, useContext, useEffect, useMemo, Fragment } from 'react'
import type { FC } from 'react'
import './index.less'
import { MinderContext } from '@src/context'
import { useTranslation } from 'react-i18next'

// todo tag, maybe refactor core
const Searchable = ['text', 'note', 'extra'] as const
const Conditions = { caseSensitive: 0b01, regex: 0b10 }
const matchCondition = (value: number, condition: number): boolean => (value & condition) === condition
const Matcher = (lookup: string, value: string, type: number): boolean => {
    if (!matchCondition(type, Conditions.caseSensitive)) {
        lookup = lookup.toLowerCase()
        value = value.toLowerCase()
    }
    try { return matchCondition(type, Conditions.regex) ? new RegExp(lookup).test(value) : value.includes(lookup) } catch (e) { return false }
}
const Highlighter: FC<{ regex: string, text?: string, condition: number }> = ({ regex, text = '', condition }) => {
    let preserve = false
    try {
        const splited = text.split(new RegExp(`(${matchCondition(condition, Conditions.regex) ? regex : escapeRegExp(regex)})`, matchCondition(condition, Conditions.caseSensitive) ? 'g' : 'gi'))
        return <span>{splited.map((v, i) => {
            preserve = !preserve
            return <Fragment key={i}>{preserve ? v : <span className="highlight">{v}</span>}</Fragment>
        })}</span>
    } catch (e) { return <></> }
}
export const SearchList: FC<{ active: boolean }> = ({ active }) => {
    const { t } = useTranslation()
    const { minder, Commands, mindOnOff } = useContext(MinderContext)!
    const [searchRadio, setSearchRadio] = useState<typeof Searchable[number]>('text')
    const [searchResult, setSearchResult] = useState<MinderNode[]>([])
    const resultDivRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<Input>(null)
    const [conditions, setConditions] = useState(0b00)

    const search = useCallback(throttle((e) => {
        const key = e.target.value
        if (key.length) {
            const filter = 'extra' === searchRadio ? (node: MinderNode) => {
                const _ = node.getData(searchRadio) ?? []
                for (const v of _) {
                    if (Matcher(key, v, conditions))
                        return true
                }
            } : (node: MinderNode) => {
                const _ = node.getData(searchRadio) ?? ''
                return Matcher(key, _, conditions)
            }
            setSearchResult(minder.getAllNode().filter(filter))
        } else { setSearchResult([]) }
    }, 50, { trailing: true }), [searchRadio, conditions])

    // update search result when contentchange or active
    useEffect(() => {
        if (active) {
            const updateSearch = throttle(() => {
                const key = searchInputRef.current?.input?.value ?? ''
                search({ target: { value: key } })
            }, 250, { trailing: true })
            setTimeout(updateSearch)
            return mindOnOff({ 'contentchange': updateSearch })
        }
    }, [active, mindOnOff, search])

    const highlightSearchResult = useCallback((node: MinderNode) => {
        const keyword = searchInputRef.current?.input.value ?? ''
        switch (searchRadio) {
            case 'text':
                return <Highlighter text={node?.getData(searchRadio)} regex={keyword} condition={conditions} />
            case 'note': {
                const note = node.getData(searchRadio)
                const index = note?.indexOf(keyword) ?? 5
                // todo previewNote
                return <Highlighter text={note?.substring(index - 5, index + 20)} regex={keyword} condition={conditions} />
            }
            case 'extra':
                return <div className='extra-result'>
                    {node.getData(searchRadio)?.map((v, i) => <Highlighter key={i} text={v} regex={keyword} condition={conditions} />)}
                </div>
        }
    }, [conditions, searchRadio])

    const Radios = useMemo(() => <>{Searchable.map(v => <Radio value={v} key={v}>{t(`Operation.${v}`)}</Radio>)}</>, [t])

    return <div className='search-result'>
        <Input allowClear onChange={search} onPressEnter={search} ref={searchInputRef} onFocus={e => e.target.select()}
            addonAfter={<span className='condition'>
                <div className={`case-sensitive ${matchCondition(conditions, Conditions.caseSensitive) ? 'active' : ''}`} onClick={() => { setConditions(o => o ^ Conditions.caseSensitive) }}>Aa</div>
                <div className={`regex ${matchCondition(conditions, Conditions.regex) ? 'active' : ''}`} onClick={() => { setConditions(o => o ^ Conditions.regex) }}>.*</div>
            </span>}></Input>
        <Radio.Group onChange={({ target: { value } }) => setSearchRadio(value)} value={searchRadio}>{Radios}</Radio.Group>
        <div className="results" ref={resultDivRef} onClickCapture={({ target }: any) => {
            while (target && target.className !== 'result') target = target?.parentNode;
            const index = target?.dataset?.index
            if (index !== undefined) {
                Commands.Camera(searchResult[index])
                minder.select(searchResult[index], true)
                Commands.Expand(true)
            }
        }}>{searchResult.map((v, i) => <div className="result" key={i} data-index={i}>{highlightSearchResult(v)}</div>)}</div>
    </div>
}
