import React, { useState } from "react"
import type { FC } from "react"
import ReactDOM from "react-dom"
import { ConfigProvider } from "antd"
import { Minder } from "."
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as resource from "./intl"
import type { langs } from "./intl"
import { LanguageContext } from "./context"
import zh_CN from "antd/lib/locale/zh_CN"
import en_US from "antd/lib/locale/en_US"
import 'kity'
import '@bennowu/kityminder-core'
import '@bennowu/kityminder-core/dist/kityminder.core.css'
import '@bennowu/hotbox/hotbox.css'
import '@bennowu/hotbox/hotbox.min.js'

declare module 'react-i18next' {
    interface CustomTypeOptions {
        defaultNS: 'zh-CN'
        resources: {
            'zh-CN': typeof resource.zh_CN;
            'en-US': typeof resource.en_US;
        }
    }
}

// intl language name follows the same rules as below
// https://ant.design/docs/react/i18n
// ❗❗❗ the order of language resource matters
const language = (Object.keys(resource) as langs).find(v => {
    return v.toLowerCase().split('_')[0] === navigator.language.toLowerCase().split('-')[0]
}) ?? 'zh_CN'

i18n.use(initReactI18next).init({
    resources: Object.fromEntries(Object.entries(resource).map(([k, v]) => ([k.replaceAll('_', '-'), { translation: v }]))),
    lng: language.replace('_', '-'),
    interpolation: { escapeValue: false, },
    debug: process.env.NODE_ENV === 'development',
})

const antdLangs = { zh_CN, en_US }

const App: FC = () => {
    const [locale, setLocale] = useState(antdLangs[language])
    const switchLang = (lang: langs[number]) => {
        i18n.changeLanguage(lang.replaceAll('_', '-'))
        setLocale(antdLangs[lang])
    }

    return <LanguageContext.Provider value={switchLang}>
        <ConfigProvider componentSize='small' locale={locale} >
            <Minder />
        </ConfigProvider>
    </LanguageContext.Provider>
}

ReactDOM.render(<App />, document.getElementById('root'))

if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.i18n = i18n
    // setTimeout(() => {
    //     document.querySelectorAll('*').forEach(v =>
    //         // todo
    //         // @ts-ignore
    //         v.style.outline = `1px solid #${Math.random().toString(16).slice(-6)}`
    //     )
    // }, 3000)
}
// todo: Tail-Recursion
// todo: all the small loading
// todo: @typescript/lib-dom
