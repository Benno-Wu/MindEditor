// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid/8809472
// 10000000-1000-4000-8000-100000000000 - xxxxxxxx-xxxx-4x-xxxx-xxxxxxxxxxxx
const uuidv4 = () => ('' + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    // @ts-ignore
    c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
// @ts-ignore
export const getUUID = (): string => window.crypto?.randomUUID ? window.crypto.randomUUID() : uuidv4()

export const base642blob = (base64: string, type: string): Blob => {
    const bytes = window.atob(base64.split(',')[1])
    const uint8 = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++)
        uint8[i] = bytes.charCodeAt(i)
    return new Blob([uint8], { type: `image${type}` })
}

// @ts-ignore
export const FileEntryReader = (entry: FileSystemEntry): Promise<File> => new Promise(entry.file)

const is = (regex: RegExp) => (str: string) => regex.test(str)
export const isSupportedImage = is(/\.|\/(jpeg|jpg|png|gif)$/i)
export const isBase64 = is(/^data:image\/\w*(;.*)*;base64,/)
// eslint-disable-next-line no-useless-escape
export const isURL = is(/^([a-z]([a-z\d\+\-\.])*:)?\/\//i)

export const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty)

export const appendStyleSheet = (id: string, href: string) => {
    const _ = document.createElement('link')
    _.id = id
    _.rel = 'stylesheet'
    _.type = 'text/css'
    _.href = href
    document.body.appendChild(_)
}