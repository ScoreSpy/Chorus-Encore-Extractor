import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, normalize } from 'node:path'
import { constants as FS_CONSTANTS } from 'node:fs'
import { createDecipheriv } from 'node:crypto'
import { createInterface } from 'node:readline'
import cryptoConfig from './config/crypto.json'
import JSZip from 'jszip'

export async function extractEncryptedArchive (input: string, outputDir: string) {
  const fileContent = await readFile(input)
  const iv = Buffer.from(fileContent.slice(0, cryptoConfig.IV_LENGTH))
  const encryptedBuffer = fileContent.slice(16)

  // decrypt the buffer
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(cryptoConfig.SECRET_KEY, 'hex'), iv)
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

  const zip = await JSZip.loadAsync(decryptedBuffer)
  await Promise.all(Object.entries(zip.files).map(async ([filename, file]) => {
    if (!file.dir) {
      const outputPath = join(outputDir, filename)
      await mkdir(dirname(outputPath), { recursive: true })
      await writeFile(outputPath, await file.async('nodebuffer'))
    }
  }))
}

export async function findCEFiles (dirPath: string, files: string[]): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = join(dirPath, entry.name)

    if (entry.isFile() && extname(entry.name) === '.ce') {
      files.push(entryPath)
    } else if (entry.isDirectory()) {
      await findCEFiles(join(dirPath, entry.name), files)
    }
  }

  return files
}

export function replacePathPart (filePath: string, oldPart: string, newPart: string): string {
  const dir = dirname(filePath)
  const base = basename(filePath)
  const newDir = dir.replace(normalize(oldPart), normalize(newPart))
  const newPath = join(newDir, base)
  return newPath
}

export function fileExists (path: string): Promise<boolean> {
  return access(path, FS_CONSTANTS.F_OK).then(() => true).catch(() => false)
}

export function askQuestion (question: string, expected: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const rl = createInterface(process.stdin, process.stdout)
    rl.question(`${question}\n`, (answer) => {
      if (answer.toLowerCase() !== expected.toLowerCase()) { return reject(new Error('invalid input')) }
      return resolve()
    })
  })
}

export function keyPress (): Promise<void> {
  console.log('\nPress Any Key To Exit')
  process.stdin.setRawMode(true)
  return new Promise(() => process.stdin.once('data', () => {
    console.log('\n^C')
    process.exit(1)
  }))
}
