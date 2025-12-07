/**
 * Utility to read files from file system paths in Electron
 * Converts file paths to File objects for upload
 */

export async function readFileAsFile(filePath: string, mimeType?: string): Promise<File> {
  // Use Electron's ipcRenderer to read file
  const fileBuffer = await window.api.readFile(filePath)

  // Get file name and extension
  const fileName = filePath.split(/[/\\]/).pop() || 'file'
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  // Determine MIME type from extension if not provided
  if (!mimeType) {
    const mimeTypes: { [key: string]: string } = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      rtf: 'application/rtf'
    }
    mimeType = mimeTypes[ext] || 'application/octet-stream'
  }

  // Convert buffer to Blob then File
  const blob = new Blob([fileBuffer], { type: mimeType })
  return new File([blob], fileName, { type: mimeType })
}

export async function readFilesAsFiles(filePaths: string[]): Promise<File[]> {
  const files = await Promise.all(filePaths.map(path => readFileAsFile(path)))
  return files
}

