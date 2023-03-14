import { mkdir } from 'node:fs/promises'
import { extractEncryptedArchive, fileExists, findCEFiles, replacePathPart } from './helpers'

const BASE_PATH = 'C:\\Users\\Ahriana\\Documents\\Projects\\Chorus Encore\\Chorus-Encore-Validator\\shadow'
const SHADOW_PATH = 'C:\\Users\\Ahriana\\Documents\\Projects\\Chorus Encore\\Chorus-Encore-Extractor\\shadow'

async function start () {
  const ceFiles = await findCEFiles('C:\\Users\\Ahriana\\Documents\\Projects\\Chorus Encore\\Chorus-Encore-Validator\\shadow', [])
  console.log(ceFiles)
  console.log(ceFiles.length)

  for (const file of ceFiles) {
    const outputPath = replacePathPart(file, BASE_PATH, SHADOW_PATH)
    if (!await fileExists(outputPath)) { await mkdir(outputPath, { recursive: true }) }

    extractEncryptedArchive(file, outputPath)
  }
}

start()
