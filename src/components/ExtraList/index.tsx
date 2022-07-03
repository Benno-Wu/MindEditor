import { DownloadOutlined, DeleteOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { filename2blob } from "@src/parser"
import { downloadFiles } from "@src/utils/downloadFiles"
import { useForceUpdate } from "@src/utils/hooks"
import { Typography, Popconfirm } from "antd"
import { FC, useContext, useEffect } from "react"
import React from "react"
import { useTranslation } from "react-i18next"
import "./index.less"
import { MinderContext } from "@src/context"
import { MinderNode } from "@src/types/mind"
import { HoverSelect } from "../HoverSelect"

export const ExtraList: FC = () => {
    const { t } = useTranslation()
    const update = useForceUpdate()
    const { minder, mindOnOff, Commands } = useContext(MinderContext)!
    useEffect(() => {
        // todo split
        return mindOnOff({ 'contentchange selectionchange': update })
    }, [mindOnOff, update])

    const filename2node = new Map<string, MinderNode[]>()
    minder.getAllNode().forEach(node => {
        node.getData('extra')?.forEach(v => {
            if (filename2node.has(v)) {
                filename2node.get(v)?.push(node)
            } else {
                filename2node.set(v, [node])
            }
        })
    })

    return <div className="scroll2list">
        <div className="node-resources">
            {minder.getSelectedNodes()?.map((node, i) => <div className="node" key={i} onClick={() => { Commands.Camera(node) }}>
                {node.getData('extra')?.map((filename, i) => <div className="resource" key={i}>
                    <Typography.Text type={filename2blob.has(filename) ? undefined : 'danger'}>{filename}</Typography.Text>
                    <div className="operation" onClick={e => e.stopPropagation()}>
                        {filename2blob.has(filename) ? <DownloadOutlined onClick={() => { downloadFiles(filename2blob.get(filename), filename) }} /> : ''}
                        <MinusCircleOutlined onClick={() => {
                            const newExtra = Array.from(node.getData('extra') ?? [])
                            newExtra.splice(i, 1)
                            Commands.Extra(newExtra, node)
                        }} />
                    </div>
                </div>)}
            </div>)}
        </div>
        <Typography.Title level={5} style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{t('MainDrawer.allResources')}</Typography.Title>
        <div className="local-resources" >
            {Array.from(filename2blob.keys()).map((v, i) => <div className="resource" key={i}>
                <HoverSelect renderOptions={filename2node.get(v)?.map(v => v.getText()) ?? []} options={filename2node.get(v)}
                    onSelect={Commands.Camera}>{v}</HoverSelect>
                <div className="operation">
                    <DownloadOutlined onClick={() => { downloadFiles(filename2blob.get(v), v) }} />
                    <Popconfirm title={<>{t('Message.FileDeleteConfirm?')}<br />{t('Message.CanNotUndone')}</>}
                        onConfirm={() => { filename2blob.delete(v); update(); }}><DeleteOutlined /></Popconfirm>
                </div>
            </div>)}
        </div>
    </div>
}
