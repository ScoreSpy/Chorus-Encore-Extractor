import './shim'
import { askQuestion, extractEncryptedArchive, fileExists, findCEFiles, replacePathPart } from './helpers'
import { join, parse } from 'node:path'
import { mkdir } from 'node:fs/promises'
import type { ApplicationArguments } from './types'
import yargs from 'yargs'

const isPackaged = Boolean(process.pkg)

async function start () {
  console.log('Chorus Encore Validator - 14/03/2023')

  // eslint-disable-next-line init-declarations
  let appArguments: ApplicationArguments

  if (isPackaged) {
    if (process.argv.length > 2) {
      const { argv } = yargs(process.argv.slice(2)).
        option('baseDir', { type: 'string', description: 'The path to the base directory.', demandOption: true }).
        option('outputDir', { type: 'string', description: 'The path to the output directory.', demandOption: true }).
        help().
        alias('help', 'h')

      appArguments = argv as ApplicationArguments
    } else {
      setInterval(() => {
        // nasty hack that stops the terminal quitting out
      }, 2147483647)

      appArguments = {
        baseDir: process.cwd(),
        outputDir: join(process.cwd(), 'CE_EXTRACTED')
      }

      console.log('\nRun again with CLI to manually specify parameters as shown below\n')
      yargs().
        option('baseDir', { type: 'string', description: 'The path to the base directory.' }).
        option('outputDir', { type: 'string', description: 'The path to the output directory.' }).
        alias('help', 'h').
        showHelp()

      console.log('\n')
      console.log('baseDir: ', appArguments.baseDir)
      console.log('outputDir: ', appArguments.outputDir)
      console.log('\n')

      await askQuestion('Infomation correct? "Yes" or "No"', 'yes')
    }
  } else {
    const config = await import('./../devconfig.json')

    appArguments = {
      baseDir: config.baseDir,
      outputDir: config.outputDir
    }
  }

  const ceFiles = await findCEFiles(appArguments.baseDir, [])
  console.log(`found ${ceFiles.length} encrypted archives`)

  for (const file of ceFiles) {
    const fileData = parse(file)
    const outputPath = replacePathPart(join(fileData.dir, fileData.name), appArguments.baseDir, appArguments.outputDir)
    if (!await fileExists(outputPath)) { await mkdir(outputPath, { recursive: true }) }

    console.log(`decrypting and extracting: ${fileData.name}`)
    extractEncryptedArchive(file, outputPath)
  }

  console.log('Archives dexrypted and extracted...')
}

start()
