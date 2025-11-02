import PentagonBubbleGame from "@/components/PentagonBubbleGame";

interface JournalEntry {
  id: number;
  question: string;
  response: string;
  experienceType?: string | null;
  createdAt: Date | string;
}

interface ExperiencesBubbleViewProps {
  entries: JournalEntry[];
}

export default function ExperiencesBubbleView({ entries }: ExperiencesBubbleViewProps) {
  // Theme names that should NOT appear as bubbles (they're vertices)
  const themeNames = ['Freedom', 'Love', 'Power', 'Truth', 'Value'];
  
  // Get unique experience types from entries
  const uniqueExperiences = Array.from(
    new Set(
      entries
        .map(e => e.experienceType)
        .filter(Boolean)
        .flatMap(exp => exp!.split(',').map(e => e.trim()))
    )
  ).filter(exp => exp.length > 0 && !themeNames.includes(exp));

  return <PentagonBubbleGame experiences={uniqueExperiences} />;
}

