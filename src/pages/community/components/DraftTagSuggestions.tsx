import { useEffect, useState } from 'react';
import { suggestPostTags, type PostTagSuggestion } from '../../../api/community';

type Props = {
    title: string;
    content: string;
    boardCode: 'INFO' | 'QUESTION';
    selected: string[];
    onSelect: (tag: PostTagSuggestion) => void;
};

export const DraftTagSuggestions = ({ title, content, boardCode, selected, onSelect }: Props) => {
    const [result, setResult] = useState<{
        title: string; content: string; boardCode: string; tags: PostTagSuggestion[];
    } | null>(null);
    const full = selected.length >= 5;

    useEffect(() => {
        if (full || !(title.trim() || content.trim())) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const tags = await suggestPostTags({ title, content, boardCode }, controller.signal);
                if (!controller.signal.aborted) setResult({ title, content, boardCode, tags });
            } catch {
                // Suggestions are optional; manual selection and publishing stay available.
                if (!controller.signal.aborted) setResult(null);
            }
        }, 700);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [title, content, boardCode, full]);

    if (full || !result || result.title !== title || result.content !== content || result.boardCode !== boardCode) return null;
    const available = result.tags.filter(tag => !selected.includes(tag.name));
    if (available.length === 0) return null;
    return (
        <section aria-label="추천 태그" className="flex flex-wrap items-center gap-2 py-2">
            <span className="text-r-12 text-gray-650">추천 태그</span>
            {available.map(tag => (
                <button key={tag.id} type="button" title={tag.evidence ?? undefined}
                    aria-label={`${tag.name} 태그 추가`}
                    className="rounded-full border border-gray-300 px-3 py-1 text-r-12"
                    onClick={() => onSelect(tag)}>
                    + {tag.name}
                </button>
            ))}
        </section>
    );
};
