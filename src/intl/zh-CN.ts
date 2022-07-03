import { AllShortcuts } from "../types/editor"

type recordKeys<T extends string> = Record<T, string>
export interface translation {
    Iam: string,
    Message: recordKeys<'unsupportImage' | 'sameFilename' | 'contentFileNotFound' | 'imageLoadFailButLink' | 'directoryNotSupported' | 'imageOrLinkNotRecognized'
        | 'copy2clipboard' | 'fail2share' | 'fail2export' | 'imageLoadFail_UseLinkInstead' | 'invalidLink'
        | 'fail2import' | 'unsupportFile' | 'file' | 'loadFails_reasonIs' | 'GFMSupported' | 'NoFileUploaded_NoNodeSelected' | 'NoNodeSelected'
        | 'FileDeleteConfirm?' | 'CanNotUndone'>,
    Operation: recordKeys<'share' | 'export' | 'import' | 'redo' | 'undo' | 'search' | 'appendParent' | 'appendSibling' | 'appendChild' | 'arrangeUp' | 'arrangeDown'
        | 'edit' | 'text' | 'delete' | 'link' | 'image' | 'note' | 'extra' | 'priority' | 'progress' | 'reset' | 'tag' | 'remove' | 'back'
        | 'linkHint' | 'imageHint' | 'imageUploadHint'>,
    MainDrawer: recordKeys<'tag' | 'allResources'>,
    MultiSelect: recordKeys<'all' | 'revert' | 'siblings' | 'level' | 'path' | 'tree'>,
    Statusbar: recordKeys<'preview' | 'copied' | 'permission' | 'template' | 'theme' | 'shortcut' | 'language' | 'resetLayout'
        | 'selectOrDrag' | 'center' | 'editable' | 'selection' | 'unknown' | 'node' | 'expand' | 'select' | 'focus' | 'blur'>,
    Shortcuts: recordKeys<typeof AllShortcuts[number]>,
}

export const zh_CN: translation = {
    Iam: "中文",
    Message: {
        unsupportImage: '不支持的图片格式',
        sameFilename: '文件名称有冲突，已使用旧文件',
        contentFileNotFound: '核心数据文件未找到',
        imageLoadFailButLink: '图片加载失败，已转为链接',
        directoryNotSupported: '暂时不支持文件夹',
        imageOrLinkNotRecognized: '未识别到图片或者链接',
        copy2clipboard: '已复制到剪切板',
        fail2share: '分享链接生成失败',
        fail2export: '文件导出失败',
        fail2import: '文件导入失败',
        unsupportFile: '不支持的文件格式',
        imageLoadFail_UseLinkInstead: '图片下载失败，已切换为链接加载模式',
        invalidLink: '无效的链接',
        file: '文件',
        loadFails_reasonIs: '加载失败，原因是',
        GFMSupported: '支持GFM语法',
        NoFileUploaded_NoNodeSelected: '未上传文件或者未选中节点',
        NoNodeSelected: '未选中节点',
        'FileDeleteConfirm?': '确定删除该文件吗？',
        CanNotUndone: '无法撤销',
    },
    Operation: {
        share: '分享',
        export: '导出',
        import: '导入',
        redo: '重做',
        undo: '撤销',
        search: '搜索',
        appendParent: '+父节点',
        appendSibling: '+兄弟节点',
        appendChild: '+子节点',
        arrangeUp: '上移',
        arrangeDown: '下移',
        edit: '编辑',
        text: '文字',
        delete: '删除',
        link: '链接',
        linkHint: '粘贴超链接',
        image: '图片',
        imageHint: '粘贴图片地址',
        imageUploadHint: '双击上传图片',
        note: '备注',
        extra: '附件',
        priority: '优先级',
        progress: '进度',
        reset: '还原',
        tag: '标签',
        remove: '移除',
        back: '返回',
    },
    MainDrawer: {
        tag: '标签',
        allResources: '所有资源',
    },
    MultiSelect: {
        all: '全选',
        revert: '反选',
        siblings: '兄弟',
        level: '同级',
        path: '路径',
        tree: '子树',
    },
    Statusbar: {
        preview: '预览',
        copied: '已复制图片到剪切板',
        permission: '请在浏览器相关设置中，授予剪切板访问权限',
        template: '结构样式',
        theme: '主题',
        resetLayout: '规整某选中节点布局，默认全部',
        selectOrDrag: '选择/拖拽移动',
        center: '居中显示',
        editable: '编辑锁定',
        shortcut: '快捷键',
        language: '语言',
        selection: '当前选中',
        unknown: '未知',
        node: '个节点',
        expand: '展开',
        select: '选择',
        focus: '获得焦点',
        blur: '失去焦点',
    },
    Shortcuts: {
        'Enter': '+兄弟节点',
        'Tab,Insert': '+子节点',
        'Shift+Tab': '+父节点',
        'Delete': '删除节点',
        'Up,Down,Left,Right': '节点导航',
        'Alt+Up,Down': '上/下移',
        '/,、': '展开/收起',
        'Alt+1,2,3,4,5': '展开至层级N',
        'Alt+`': '展开全部',
        'E': '编辑',
        'Ctrl+A': '全选',
        'Ctrl+C': '复制',
        'Ctrl+X': '剪切',
        'Ctrl+V': '粘贴',
        'Ctrl+B': '加粗',
        'Ctrl+I': '斜体',
        'Ctrl+F': '搜索',
        'Alt+LeftMouse,RightMouse': 'Alt+左键,右键 拖动视野',
        'MouseWheel,TouchPad': '鼠标滚轮/触摸板 移动视野',
        'dblclick blank': '双击空白处 居中显示',
        'Ctrl++,-,MouseWheel': '缩放',
        'Ctrl+Shift+L': '规整布局',
        'Ctrl+Z': '撤销',
        'Ctrl+Y': '重做',
    },
}