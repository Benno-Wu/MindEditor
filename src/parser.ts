import * as zip from "@zip.js/zip.js";
import { message } from "antd";
import xmlParser from 'fast-xml-parser'
import i18next from "i18next";
import type { iMinderData, iMinderNode } from "./types/mind";
import { getImageSizeByBlob } from "./utils/getImageSize";

export const filename2blob = new Map<string, Blob>()
export const filename2objectUrl = new Map<string, string>()

const progress = ['', 'start', 'oct', 'quarter', '3oct', 'half', '5oct', '3quar', '7oct', 'done',]
const XMLPropertiesTransformer: Record<string, (node: iMinderNode['data'], whatever: any) => void> = {
    '@_id': (node, id) => node.id = id,
    '@_timestamp': (node, time) => node.created = time,
    '@_branch': (node, branch) => {
        if (branch === 'folded')
            node.expandState = 'collapse'
    },
    title: (node, title) => {
        node.text = title?.['#text'] ?? title
        node.text += ''
    },
    // todo file2attachmentOfParent?
    '@_xlink:href': (node, link) => node.hyperlink = link,
    'xhtml:img': (node, img) => {
        node.image = img['@_xhtml:src']
        node.imageTitle = img['@_xhtml:src'].split('/').pop()
        node.imageSize = {
            width: img['@_svg:width'],
            height: img['@_svg:height'],
        }
    },
    'marker-refs': (node, refs) => {
        let _ = refs['marker-ref']
        if (!Array.isArray(_)) _ = [_]
        _.forEach((ref: { [x: string]: string; }) => {
            const _ = ref['@_marker-id']
            switch (true) {
                case _.includes('task'):
                    node.progress = progress.findIndex(v => v === _.split('-')[1])
                    break;
                case _.includes('priority'):
                    node.priority = +_.split('-')[1]
                    break;
            }
        });
    },
    labels: (node, labels) => {
        node.resource = labels.label
    },
    // todo richtext? style, link, image
    notes: (node, note) => {
        node.note = note.plain
    },
}
// todo type topic
const XMLTransform = (topic: any, result: iMinderNode) => {
    for (const key in topic) {
        if (Object.hasOwnProperty.call(XMLPropertiesTransformer, key)) {
            XMLPropertiesTransformer[key](result.data, topic[key])
        }
    }
    if (topic?.children) {
        let _ = topic.children.topics.topic
        if (!Array.isArray(_)) _ = [_]
        _.forEach((topic: any) => {
            const children = { data: {}, children: [] }
            result.children.push(children)
            XMLTransform(topic, children)
        })
    }
}
const JSONPropertiesTransformer: Record<string, (node: iMinderNode['data'], whatever: any) => void> = {
    id: (node, id) => node.id = id,
    branch: (node, branch) => {
        if (branch === 'folded')
            node.expandState = 'collapse'
    },
    title: (node, title) => node.text = title + '',
    image: (node, image) => {
        node.image = image.src
        node.imageTitle = image.src.split('/').pop()
        node.imageSize = { width: image.width, height: image.height }
    },
    // when it's a local file, opened by file://, only works in local app 
    // todo file2attachmentOfParent?
    href: (node, href) => node.hyperlink = href,
    markers: (node, markers) => {
        markers.forEach((marker: { markerId: string; }) => {
            const _ = marker.markerId
            switch (true) {
                case _.includes('task'):
                    node.progress = progress.findIndex(v => v === _.split('-')[1])
                    break;
                case _.includes('priority'):
                    node.priority = +_.split('-')[1]
                    break;
            }
        });
    },
    labels: (node, labels) => {
        node.resource = labels
    },
    // todo richtext? style, link, image
    notes: (node, note) => {
        node.note = note.plain.content
    },
}
const JSONTransform = (topic: any, result: iMinderNode) => {
    for (const key in topic) {
        if (Object.prototype.hasOwnProperty.call(JSONPropertiesTransformer, key)) {
            JSONPropertiesTransformer[key](result.data, topic[key])
        }
    }
    if (topic?.children?.attached?.length) {
        topic.children.attached.forEach((topic: any) => {
            const children = { data: {}, children: [] }
            result.children.push(children)
            JSONTransform(topic, children)
        })
    }
}

const imageTransform = async (root: iMinderNode): Promise<void> => {
    const filename = root.data.image?.split('/').pop()
    if (filename && !/^(https?:)?\/\//.test(root.data.image ?? '')) {
        const blob = filename2blob.get(filename)
        if (blob) {
            root.data.image = URL.createObjectURL(blob)
            filename2objectUrl.set(filename, root.data.image)
            if (!(root.data.imageSize?.width && root.data.imageSize?.height)) {
                root.data.imageSize = await getImageSizeByBlob(blob, `image/${filename.split('.').pop()}`)
            }
        }
    }
    for (const child of root.children) {
        await imageTransform(child)
    }
}

export class Parser {
    static async parseKm2(file: File): Promise<iMinderData> {
        let result: iMinderData
        const reader = new zip.ZipReader(new zip.BlobReader(file));
        const entries = await reader.getEntries()
        // find content
        const contentEntry = entries.filter(v => v.filename.includes('content.json'))[0]
        if (contentEntry) {
            result = JSON.parse(await contentEntry.getData?.(new zip.TextWriter(), { useWebWorkers: true }) ?? '')
        } else {
            message.warn(i18next.t('Message.contentFileNotFound'))
            throw new Error()
        }

        // read all resources under files
        const resourceNameList: string[] = []
        const resourceReaderList: Promise<Blob>[] = []
        for (const entry of entries) {
            const path2file = entry.filename.split('/')
            if (path2file[0] === 'files') {
                if (entry.getData) {
                    resourceNameList.push(path2file[1])
                    resourceReaderList.push(entry.getData(new zip.BlobWriter(), { useWebWorkers: true }))
                }
            }
        }
        // filename - blob
        const blobs = await Promise.allSettled(resourceReaderList)
        blobs.forEach((v, i) => {
            if (v.status === 'fulfilled') {
                filename2blob.set(resourceNameList[i], v.value)
            } else {
                message.warn(i18next.t('Message.file') + ' ' + resourceNameList[i] + ' ' + i18next.t('Message.loadFails_reasonIs') + v.reason)
            }
        })
        // image.src=objectURL - filename
        await imageTransform(result.root)
        await reader.close()
        return result
    }
    static async parseXmind(file: File): Promise<iMinderData> {
        const result: iMinderData = {
            template: "default",
            theme: "fresh-blue",
            version: "2.0.0",
            root: { data: {}, children: [] }
        }
        const reader = new zip.ZipReader(new zip.BlobReader(file));
        const entries = await reader.getEntries()
        // find content
        const contentEntries = entries.filter(v => v.filename.includes('content'))
        let contentEntry = contentEntries.find(v => v.filename.endsWith('.json'))
        if (contentEntry) {
            const json = JSON.parse(await contentEntry.getData?.(new zip.TextWriter(), { useWebWorkers: true }) ?? '')
            // todo notice on readme usage
            // only the first paper is loaded now
            JSONTransform(json[0].rootTopic, result.root)
        } else if (contentEntry = contentEntries.find(v => v.filename.endsWith('.xml'))) {
            const content = await contentEntry.getData?.(new zip.TextWriter(), { useWebWorkers: true }) ?? ''
            const json = xmlParser.parse(content, { ignoreAttributes: false })
            XMLTransform(json['xmap-content'].sheet.topic, result.root)
        } else {
            message.warn(i18next.t('Message.contentFileNotFound'))
            throw new Error()
        }

        // read all resources under attachments & resources
        const resourceNameList: string[] = []
        const resourceReaderList: Promise<Blob>[] = []
        for (const entry of entries) {
            const path2file = entry.filename.split('/')
            if (['attachments', 'resources'].includes(path2file[0])) {
                if (entry.getData) {
                    resourceNameList.push(path2file[1])
                    resourceReaderList.push(entry.getData(new zip.BlobWriter(), { useWebWorkers: true }))
                }
            }
        }
        // filename - blob
        const blobs = await Promise.allSettled(resourceReaderList)
        blobs.forEach((v, i) => {
            if (v.status === 'fulfilled') {
                filename2blob.set(resourceNameList[i], v.value)
            } else {
                message.warn(i18next.t('Message.file') + ' ' + resourceNameList[i] + ' ' + i18next.t('Message.loadFails_reasonIs') + v.reason)
            }
        })
        // image.src=objectURL - filename
        await imageTransform(result.root)
        await reader.close()
        return result
    }
}