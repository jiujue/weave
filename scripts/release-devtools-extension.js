#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { createInterface } from 'readline'

const APP_PKG_PATH = 'apps/devtools-extension/package.json'
const TAG_PREFIX = 'devtools-extension-v'

const run = (command, args, options = {}) => {
	const res = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true,
		...options,
	})
	if (res.status !== 0) process.exit(res.status ?? 1)
}

const runCapture = (command, args) => {
	const res = spawnSync(command, args, {
		encoding: 'utf8',
		shell: true,
	})
	if (res.status !== 0) {
		const msg = (res.stderr || res.stdout || '').trim()
		throw new Error(msg || `Command failed: ${command} ${args.join(' ')}`)
	}
	return (res.stdout || '').trim()
}

const parseVersion = (v) => {
	const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v).trim())
	if (!m) throw new Error(`Invalid version: ${v}`)
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

const formatVersion = (v) => `${v.major}.${v.minor}.${v.patch}`

const bump = (current, type) => {
	if (type === 'patch') return { ...current, patch: current.patch + 1 }
	if (type === 'minor') return { ...current, minor: current.minor + 1, patch: 0 }
	if (type === 'major') return { ...current, major: current.major + 1, minor: 0, patch: 0 }
	throw new Error(`Invalid bump type: ${type}`)
}

const ask = (question) => {
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close()
			resolve(String(answer ?? '').trim())
		})
	})
}

const resolveModeInteractive = async () => {
	const choice = await ask(
		[
			'Release devtools-extension:',
			'1) patch',
			'2) minor',
			'3) major',
			'4) custom (x.y.z)',
			'Choose (default 1): ',
		].join('\n'),
	)

	if (!choice || choice === '1') return 'patch'
	if (choice === '2') return 'minor'
	if (choice === '3') return 'major'
	if (choice === '4') {
		const v = await ask('Version (x.y.z): ')
		return v
	}

	return choice
}

async function main() {
	const mode = process.argv[2] ?? (await resolveModeInteractive())
	const isBump = mode === 'patch' || mode === 'minor' || mode === 'major'

	if (!mode) {
		console.error('Usage: node scripts/release-devtools-extension.js [patch|minor|major|x.y.z]')
		process.exit(1)
	}

	const dirty = runCapture('git', ['status', '--porcelain'])
	if (dirty) {
		console.error('Working tree is not clean. Please commit or stash changes first.')
		process.exit(1)
	}

	const raw = await readFile(APP_PKG_PATH, 'utf8')
	const pkg = JSON.parse(raw)
	const current = parseVersion(pkg.version)
	const next = isBump ? bump(current, mode) : parseVersion(mode)
	const nextVersion = formatVersion(next)

	pkg.version = nextVersion
	await writeFile(APP_PKG_PATH, `${JSON.stringify(pkg, null, '\t')}\n`, 'utf8')

	run('git', ['add', APP_PKG_PATH])
	run('git', ['commit', '-m', `chore(devtools-extension): release v${nextVersion}`])
	run('git', ['tag', `${TAG_PREFIX}${nextVersion}`])
	run('git', ['push', '--follow-tags'])
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : String(err))
	process.exit(1)
})
