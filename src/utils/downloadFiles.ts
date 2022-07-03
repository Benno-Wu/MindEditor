export const downloadFiles = (content: Blob | Array<unknown> | string | unknown, filename: string, BlobOptions?: BlobPropertyBag): void => {
    const a = document.createElement('a')
    a.download = filename
    a.style.display = 'none'
    a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob(Array.isArray(content) ? content : [JSON.stringify(content)], BlobOptions))
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}