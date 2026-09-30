import JSZip from "jszip"

type FileNode = {
  type: 'file'
  name: string
  content: string | Blob | ArrayBuffer | Uint8Array | Promise<string | Blob | ArrayBuffer | Uint8Array>
}

type FolderNode = {
  type: 'folder'
  name: string
  children: ZipStructure
}

export type ZipNode = FileNode | FolderNode
export type ZipStructure = Array<ZipNode>

export default async function makeZip(content: ZipStructure): Promise<Blob> {
  const aZip = new JSZip()

  function addToZip(zip: JSZip, node: ZipNode) {
    if (node.type === 'folder') {
      const folder = zip.folder(node.name)
      if (folder) {
        for (const child of node.children) {
          addToZip(folder, child)
        }
      }
    } else {
      zip.file(node.name, node.content)
    }
  }

  for (const node of content) {
    addToZip(aZip, node)
  }

  return aZip.generateAsync({ type: "blob" })
}