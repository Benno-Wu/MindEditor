export const copy = async (share: string): Promise<void> => {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(share)
    } else {
        const _ = document.createElement('input')
        _.setAttribute('value', share)
        document.body.appendChild(_)
        _.select()
        document.execCommand('copy')
        document.body.removeChild(_)
    }
}
export const writeBase64 = async (base64: string): Promise<boolean> => {
    // @ts-ignore
    const { state } = await navigator.permissions?.query({ name: 'clipboard-write' }) ?? {}
    if (state !== 'granted') return false;
    const binary = window.atob(base64.split(',')[1])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'image/png' })
    // @ts-ignore
    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
}