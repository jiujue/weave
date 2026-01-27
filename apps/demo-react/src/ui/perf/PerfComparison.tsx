import React, { Profiler, useCallback, useMemo, useRef, useState } from 'react'

type PerfItem = {
	id: string
	label: string
	value: number
}

function busyWork(work: number): number {
	let acc = 0
	const loops = Math.max(0, Math.floor(work)) * 600
	for (let i = 0; i < loops; i++) {
		acc = (acc * 33 + i) % 1000003
	}
	return acc
}

function buildPerfItems(count: number): readonly PerfItem[] {
	const out: PerfItem[] = []
	for (let i = 0; i < count; i++) {
		out.push({
			id: `i${i + 1}`,
			label: `Item ${i + 1}`,
			value: (i * 97) % 997,
		})
	}
	return out
}

const PerfRow = React.memo(function PerfRow(props: {
	item: PerfItem
	isSelected: boolean
	work: number
	onSelect: (id: string) => void
}) {
	const { item, isSelected, work, onSelect } = props

	const checksum = busyWork(work + (item.value % 20))

	return (
		<div
			onClick={() => onSelect(item.id)}
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				padding: '10px 12px',
				borderRadius: 10,
				border: isSelected ? '1px solid #60a5fa' : '1px solid rgba(148, 163, 184, 0.18)',
				background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.55)',
				color: '#e5e7eb',
				cursor: 'pointer',
				userSelect: 'none',
			}}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
				<div style={{ fontSize: 12, color: 'rgba(226, 232, 240, 0.75)' }}>value={item.value}</div>
			</div>
			<div style={{ fontSize: 12, color: 'rgba(226, 232, 240, 0.65)' }}>checksum={checksum}</div>
		</div>
	)
})

function PerfList(props: {
	title: string
	variant: 'bad' | 'good'
	itemCount: number
	work: number
	selectedId: string
	onSelect: (id: string) => void
	pulse: number
}) {
	const { title, variant, itemCount, work, selectedId, onSelect, pulse } = props

	const captureNextCommitRef = useRef(false)

	type ProfilerPhase = Parameters<React.ProfilerOnRenderCallback>[1]
	const [metrics, setMetrics] = useState<{
		phase: ProfilerPhase
		actualDuration: number
		baseDuration: number
	}>({
		phase: 'mount',
		actualDuration: 0,
		baseDuration: 0,
	})

	const itemsGood = useMemo(() => buildPerfItems(itemCount), [itemCount])
	const itemsBad = useMemo(() => buildPerfItems(itemCount), [itemCount, pulse, selectedId])
	const items = variant === 'good' ? itemsGood : itemsBad

	const handleSelect = useCallback(
		(id: string) => {
			captureNextCommitRef.current = true
			onSelect(id)
		},
		[onSelect],
	)

	const onRender: React.ProfilerOnRenderCallback = (_id, phase, actualDuration, baseDuration) => {
		if (!captureNextCommitRef.current) return
		captureNextCommitRef.current = false
		setMetrics((prev) => {
			if (
				prev.phase === phase &&
				Math.abs(prev.actualDuration - actualDuration) < 0.01 &&
				Math.abs(prev.baseDuration - baseDuration) < 0.01
			)
				return prev
			return { phase, actualDuration, baseDuration }
		})
	}

	const pulseLabel = useMemo(() => {
		return `pulse=${pulse}`
	}, [pulse])

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateRows: 'auto auto 1fr',
				gap: 12,
				padding: 16,
				border: '1px solid rgba(148, 163, 184, 0.18)',
				borderRadius: 14,
				background: 'rgba(2, 6, 23, 0.55)',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'baseline',
					justifyContent: 'space-between',
					gap: 12,
				}}
			>
				<div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 700 }}>{title}</div>
				<div style={{ fontSize: 12, color: 'rgba(226, 232, 240, 0.65)' }}>{pulseLabel}</div>
			</div>

			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 10,
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
					<div style={{ fontSize: 12, color: 'rgba(226, 232, 240, 0.72)' }}>
						last {metrics.phase}: actual {metrics.actualDuration.toFixed(1)}ms, base{' '}
						{metrics.baseDuration.toFixed(1)}ms
					</div>
				</div>
				<button
					onClick={() => {
						captureNextCommitRef.current = true
						onSelect(selectedId)
					}}
					style={{
						padding: '8px 10px',
						borderRadius: 10,
						border: '1px solid rgba(148, 163, 184, 0.25)',
						background: 'rgba(15, 23, 42, 0.5)',
						color: '#e5e7eb',
						cursor: 'pointer',
					}}
				>
					测一次（不改选中）
				</button>
			</div>

			<Profiler id={`${variant}-list`} onRender={onRender}>
				<div
					style={{
						overflow: 'auto',
						height: 420,
						paddingRight: 4,
						display: 'grid',
						gap: 8,
					}}
				>
					{items.map((item) => (
						<PerfRow
							key={item.id}
							item={item}
							isSelected={item.id === selectedId}
							work={work}
							onSelect={handleSelect}
						/>
					))}
				</div>
			</Profiler>
		</div>
	)
}

export function PerfComparison(props: {
	itemCount: number
	work: number
	pulse: number
	selectedId: string
	onSelect: (id: string) => void
}) {
	const { itemCount, work, selectedId, onSelect, pulse } = props

	return (
		<div
			style={{
				height: '100%',
				padding: 16,
				background: '#0b1020',
				display: 'grid',
				gridTemplateColumns: '1fr 1fr',
				gap: 16,
			}}
		>
			<PerfList
				title="未优化"
				variant="bad"
				itemCount={itemCount}
				work={work}
				selectedId={selectedId}
				onSelect={onSelect}
				pulse={pulse}
			/>
			<PerfList
				title="已优化（useMemo + memo）"
				variant="good"
				itemCount={itemCount}
				work={work}
				selectedId={selectedId}
				onSelect={onSelect}
				pulse={pulse}
			/>
		</div>
	)
}
