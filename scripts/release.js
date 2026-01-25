#!/usr/bin/env node

import { spawn } from 'child_process'
import { readdir } from 'fs/promises'
import { createInterface } from 'readline'

const run = (command, args) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: 'inherit', shell: true })
		child.on('close', (code) => {
			if (code === 0) resolve()
			else reject(new Error(`Command "${command} ${args.join(' ')}" failed with code ${code}`))
		})
	})
}

const runCapture = (command, args) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { shell: true })
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

const ask = (question) => {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	return new Promise((resolve) => {
		rl.question(`\n${question} (Y/n) `, (answer) => {
			rl.close()
			resolve(answer.trim().toLowerCase() !== 'n')
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

const getPendingChangesets = async () => {
	try {
		const entries = await readdir('.changeset', { withFileTypes: true })
		return entries
			.filter((e) => e.isFile())
			.map((e) => e.name)
			.filter((name) => name.endsWith('.md') && name !== 'README.md')
	} catch {
		return []
	}
}

async function main() {
	console.log('\nWeave release-flow\n')

	try {
		const dirtyBeforeStart = await getGitStatusPorcelain()
		if (dirtyBeforeStart) {
			const cont = await ask('检测到未提交改动，仍然继续？')
			if (!cont) process.exit(1)
		}

		const addChangeset = await ask('1. 是否需要添加新的变更记录 (运行 pnpm changeset)？')
		if (addChangeset) {
			console.log('\n运行 changeset（选择包 + patch/minor/major + 填写说明）')
			await run('pnpm', ['changeset'])

			const pending = await getPendingChangesets()
			if (pending.length) {
				const commit = await ask('   检测到新的 changeset 记录，是否提交？')
				if (commit) {
					await run('pnpm', ['commit:changeset'])
				}
			}
		}

		const updateVersion = await ask(
			'2. 是否需要消耗变更集并更新版本号 (运行 pnpm changeset version)？',
		)
		if (updateVersion) {
			const pendingBeforeVersion = await getPendingChangesets()
			if (!pendingBeforeVersion.length) {
				console.log('\n未发现待消耗的 changeset 文件，changeset version 可能不会产生任何变更')
			}

			console.log('\n运行 changeset version')
			await run('pnpm', ['changeset', 'version'])

			const status = await getGitStatusPorcelain()
			if (status) {
				const commit = await ask('   检测到版本/日志文件变更，是否提交？')
				if (commit) {
					await run('pnpm', ['commit:version'])
				}
			} else {
				console.log('   没有检测到版本文件变更')
			}
		}

		const build = await ask('3. 是否需要构建项目 (运行 pnpm build)？')
		if (build) {
			console.log('\n运行 build')
			await run('pnpm', ['build'])
		}

		const publish = await ask('4. 是否确认发布到 npm (运行 pnpm changeset publish)？')
		if (publish) {
			const dirtyBeforePublish = await getGitStatusPorcelain()
			if (dirtyBeforePublish) {
				const cont = await ask('   发布前仍有未提交改动，仍然继续发布？')
				if (!cont) process.exit(1)
			}

			console.log('\n运行 changeset publish')
			await run('pnpm', ['changeset', 'publish'])

			const push = await ask('   发布完成。是否推送到远程仓库 (git push --follow-tags)？')
			if (push) {
				await run('pnpm', ['push'])
			}
		}

		console.log('\n完成\n')
	} catch (err) {
		console.error('\n发生错误:', err.message)
		process.exit(1)
	}
}

main()
