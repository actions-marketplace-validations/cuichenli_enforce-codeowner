import fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Ignore } from 'ignore'

export function generateIgnore(
  ig: Ignore,
  codeOwnerPath: string | undefined
): void {
  const path = codeOwnerPath || '.github/CODEOWNERS'
  if (!fs.existsSync(path)) {
    throw new Error(`CODEOWNERS file ${path} not exist.`)
  }

  const rawCodeOwners = fs.readFileSync(path).toString()

  rawCodeOwners.split(/\r?\n/).map((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      return
    }
    const pattern = trimmedLine.split(/\s+/)[0]
    ig.add(pattern)
  })
}

export async function checkFiles(
  ig: Ignore,
  diffFiles: string[]
): Promise<string[]> {
  const failedList: string[] = []
  diffFiles.forEach((file) => {
    // The ignore package is initially for gitignore, since the CODEOWNERS file
    // share the same syntax with gitignore, we can use this package to check
    // if the provided file is covered. Only in our case, we want the file to be
    // ignored instead.
    core.info(`Checking file ${file}`)
    if (!ig.ignores(file)) {
      core.error(`${file} does not have a codeowner.`)
      failedList.push(file)
    }
  })
  return failedList
}

export function readRequiredContext(): [string, number] {
  const token = process.env.GITHUB_TOKEN
  if (token === undefined) {
    throw 'Failed to read GITHUB_TOKEN'
  }

  const prNumber = github.context.payload.number
  return [token, Number(prNumber)]
}
