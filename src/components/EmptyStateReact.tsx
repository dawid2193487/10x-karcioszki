import { Button } from './ui/button';

interface EmptyStateProps {
	title: string;
	description: string;
	onAddFlashcard?: () => void;
	onGenerateAI?: () => void;
}

export function EmptyState({
	title,
	description,
	onAddFlashcard,
	onGenerateAI,
}: EmptyStateProps) {
	return (
		<div className="text-center py-12 bg-white rounded-lg shadow-sm border border-border">
			<svg
				className="w-16 h-16 mx-auto text-muted-foreground"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<h2 className="text-xl font-semibold text-foreground mt-4">{title}</h2>
			<p className="text-muted-foreground mt-2">{description}</p>
			<div className="flex gap-3 justify-center mt-6">
				{onAddFlashcard && (
					<Button onClick={onAddFlashcard}>Dodaj fiszkę</Button>
				)}
				{onGenerateAI && (
					<Button variant="outline" onClick={onGenerateAI}>
						Generuj AI
					</Button>
				)}
			</div>
		</div>
	);
}
