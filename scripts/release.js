#!/usr/bin/env node

import { spawn } from 'child_process'
import { readdir, readFile, writeFile } from 'fs/promises'
import { createInterface } from 'readline/promises'
import process from 'process'

const run = (command, args, options = {}) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options })
		child.on('close', (code) => {
			if (code === 0) resolve()
			else reject(new Error(`Command "${command} ${args.join(' ')}" failed with code ${code}`))
		})
	})
}

const runCapture = (command, args, options = {}) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { shell: true, ...options })
		let stdout = ''
		let stderr = ''
		child.stdout?.on('data', (data) => (stdout += data))
		child.stderr?.on('data', (data) => (stderr += data))
		child.on('close', (code) => {
			if (code === 0) resolve(stdout.trim())
			else
				reject(
					new Error(
						(stderr || stdout || '').trim() || `Command "${command} ${args.join(' ')}" failed`,
					),
				)
		})
	})
}

const getGitStatusPorcelain = async () => {
	try {
		return await runCapture('git', ['status', '--porcelain'])
	} catch {
		return ''
	}
}

const getWorkspacePackages = async () => {
	const roots = [
		{ dir: 'packages', kind: 'packages' },
		{ dir: 'apps', kind: 'apps' },
	]

	const results = []
	for (const root of roots) {
		let entries = []
		try {
			entries = await readdir(root.dir, { withFileTypes: true })
		} catch {
			continue
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) continue
			const pkgJsonPath = `${root.dir}/${entry.name}/package.json`
			try {
				const raw = await readFile(pkgJsonPath, 'utf8')
				const json = JSON.parse(raw)
				const name = json?.name
				const version = json?.version
				const isPrivate = Boolean(json?.private)
				if (!name || typeof name !== 'string') continue
				results.push({
					name,
					version: typeof version === 'string' ? version : null,
					private: isPrivate,
					path: `${root.dir}/${entry.name}`,
					kind: root.kind,
				})
			} catch {
				continue
			}
		}
	}

	results.sort((a, b) => a.name.localeCompare(b.name))
	return results
}

const promptLine = async (rl, question, params = {}) => {
	const suffix = params.optional ? ' (可选)' : ''
	const answer = await rl.question(`\n${question}${suffix}\n> `)
	return answer.trim()
}

const promptYesNo = async (rl, question, params = {}) => {
	const def = params.default ?? true
	const hint = def ? '(Y/n)' : '(y/N)'
	const answer = await rl.question(`\n${question} ${hint}\n> `)
	const normalized = answer.trim().toLowerCase()
	if (!normalized) return def
	if (normalized === 'y' || normalized === 'yes') return true
	if (normalized === 'n' || normalized === 'no') return false
	return def
}

const promptBumpType = async (rl) => {
	while (true) {
		const answer = await promptLine(rl, '选择版本升级类型：patch / major')
		const normalized = answer.toLowerCase()
		if (normalized === 'patch' || normalized === 'p') return 'patch'
		if (normalized === 'major' || normalized === 'm') return 'major'
	}
}

const parseSelection = (input, max) => {
	const trimmed = input.trim().toLowerCase()
	if (!trimmed) return []
	if (trimmed === 'all' || trimmed === '*') return [...Array(max).keys()].map((i) => i + 1)

	const parts = trimmed
		.split(/[,\s]+/g)
		.map((p) => p.trim())
		.filter(Boolean)

	const picked = new Set()
	for (const part of parts) {
		if (/^\d+$/.test(part)) {
			const n = Number(part)
			if (n >= 1 && n <= max) picked.add(n)
			continue
		}
		const m = part.match(/^(\d+)-(\d+)$/)
		if (m) {
			const start = Number(m[1])
			const end = Number(m[2])
			if (Number.isNaN(start) || Number.isNaN(end)) continue
			const lo = Math.max(1, Math.min(start, end))
			const hi = Math.min(max, Math.max(start, end))
			for (let i = lo; i <= hi; i++) picked.add(i)
		}
	}

	return [...picked].sort((a, b) => a - b)
}

const promptPackages = async (rl, pkgs) => {
	const publishable = pkgs.filter((p) => !p.private && p.version && p.kind === 'packages')
	if (!publishable.length) return []

	const lines = publishable.map(
		(p, idx) => `${String(idx + 1).padStart(2, ' ')}. ${p.name}@${p.version}`,
	)
	const hint = '输入序号（例：1,3,5 或 2-6），或 all'
	while (true) {
		console.log(`\n可发布包列表（packages/*）：\n${lines.join('\n')}`)
		const answer = await promptLine(rl, hint)
		const indices = parseSelection(answer, publishable.length)
		if (!indices.length) continue
		return indices.map((i) => publishable[i - 1])
	}
}

const ensureDirEntries = async (dir) => {
	try {
		return await readdir(dir, { withFileTypes: true })
	} catch {
		return []
	}
}

const createChangesetFile = async (params) => {
	const { bumpType, packages, summary } = params

	const entries = await ensureDirEntries('.changeset')
	const existingNames = new Set(entries.filter((e) => e.isFile()).map((e) => e.name))
	let filename = `release-${Date.now()}-${Math.random().toString(16).slice(2)}.md`
	while (existingNames.has(filename)) {
		filename = `release-${Date.now()}-${Math.random().toString(16).slice(2)}.md`
	}

	const headerLines = packages.map((p) => `"${p.name}": ${bumpType}`)
	const content = `---\n${headerLines.join('\n')}\n---\n\n${summary || 'release'}\n`
	await writeFile(`.changeset/${filename}`, content, 'utf8')
	return `.changeset/${filename}`
}

async function main() {
	console.log('\nWeave release-flow (简化版)\n')

	try {
		const rl = createInterface({ input: process.stdin, output: process.stdout })
		try {
			const dirty = await getGitStatusPorcelain()
			if (dirty) {
				console.log('\n检测到未提交改动：\n' + dirty)
				console.log('\n为避免把无关改动一起发布/推送，请先提交或清理工作区后再运行。')
				process.exit(1)
			}

			const pkgs = await getWorkspacePackages()
			const bumpType = await promptBumpType(rl)
			const selected = await promptPackages(rl, pkgs)
			const summary = await promptLine(rl, '变更说明', { optional: true })

			const confirm = await promptYesNo(
				rl,
				`将对 ${selected.length} 个包做 ${bumpType} 升级并发布，继续？`,
				{
					default: true,
				},
			)
			if (!confirm) process.exit(1)

			const changesetPath = await createChangesetFile({ bumpType, packages: selected, summary })
			console.log(`\n已生成 changeset: ${changesetPath}`)

			console.log('\n运行 changeset version')
			await run('pnpm', ['changeset', 'version'])

			console.log('\n提交版本与日志变更')
			await run('git', ['add', '-A'])
			await run('git', [
				'commit',
				'-m',
				`chore(release): ${bumpType} ${selected.map((p) => p.name).join(', ')}`,
			])

			console.log('\n运行 build')
			await run('pnpm', ['build'])

			console.log('\n运行 changeset publish')
			await run('pnpm', ['changeset', 'publish'])

			console.log('\n发布完成，推送到远程仓库')
			await run('git', ['push', '--follow-tags'])
		} finally {
			rl.close()
		}

		console.log('\n完成\n')
	} catch (err) {
		console.error('\n发生错误:', err.message)
		process.exit(1)
	}
}

main()
