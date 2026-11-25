import type { FileUpload, FileUploadEntry } from "@kirana-ui/core/file-upload"
import { getContext, setContext } from "svelte"

const KEY = Symbol("FileUpload")

export const provide = (controller: FileUpload): FileUpload => setContext(KEY, controller)

export function useFileUpload(): FileUpload {
  const controller = getContext<FileUpload | undefined>(KEY)
  if (!controller) throw new Error("A FileUpload part must be inside <FileUpload.Root>")
  return controller
}

// The file an item is, for the parts inside it, read through a function as its prop is.
export const ITEM = Symbol("FileUploadItem")

export function useEntry(part: string): () => FileUploadEntry {
  const entry = getContext<(() => FileUploadEntry) | undefined>(ITEM)
  if (!entry) throw new Error(`<FileUpload.${part}> must be inside <FileUpload.Item>`)
  return entry
}
