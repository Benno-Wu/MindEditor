export const getImageSizeByURL = (url: string): Promise<Record<'width' | 'height', number>> => {
    const _ = new Image()
    return new Promise((res, rej) => {
        _.onload = () => {
            res({ width: _.width, height: _.height })
        }
        _.onerror = rej
        _.src = url
    })
}

export const getImageSizeByBlob = async (blob: Blob, type = blob.type): Promise<Record<"width" | "height", number>> => {
    let width = 0, height = 0;
    switch (true) {
        case type === 'image/png': {
            const bytes = await blob.slice(16, 24).arrayBuffer()
            width = new DataView(bytes).getUint32(0)
            height = new DataView(bytes).getUint32(4)
        } break;
        case ['image/jpeg', 'image/jpg'].includes(type): {
            let index = 1, length = 0, type: number
            // 0xE0-EF,FE,DB
            const skippedType = new Uint16Array(0xEF - 0xE0 + 1 + 2)
            skippedType.forEach((v, i, a) => a[i] = i + 0xE0)
            skippedType[16] = 0xFE
            skippedType[17] = 0xDB
            do {
                // first skip 0xFFD8,FF
                // then always skip 0xFF
                index += length + 2
                type = new DataView(await blob.slice(index, index + 1).arrayBuffer()).getUint8(0)
                if (skippedType.includes(type)) {
                    length = new DataView(await blob.slice(index + 1, index + 1 + 2).arrayBuffer()).getUint16(0)
                } else if (type === 0xC0) break;
                else throw new Error("todo parser error")
            } while (type !== 0xC0)
            // 0xC0
            const bytes = await blob.slice(index + 4, index + 4 + 4).arrayBuffer()
            width = new DataView(bytes).getUint16(2)
            height = new DataView(bytes).getUint16(0)
        } break;
        case type === 'image/gif': {
            const bytes = await blob.slice(6, 10).arrayBuffer()
            width = new DataView(bytes).getUint16(0, true)
            height = new DataView(bytes).getUint16(2, true)
        } break;
    }
    return { width, height }
}