import { useMemo } from "react";
import { Button } from "@renderer/components/ui";
import { SpeakButton } from "@renderer/components";
import { useCamdict } from "@renderer/hooks";
import { Volume2Icon } from "lucide-react";

type Pronunciation = {
  region: string;
  pronunciation: string;
  audio?: string;
};

/**
 * How the word is said, and a way to hear it.
 *
 * The recordings come from the Cambridge dictionary that ships with the app,
 * which is keyed by headword — so `chirping` finds nothing and `chirp` does.
 * When a dictionary gave us the lemma we try that too, and when neither is in
 * there the browser's own speech synthesis reads the word, which is worse than
 * a recording and much better than nothing.
 */
export const WordPronunciation = (props: {
  word: string;
  lemma?: string;
  className?: string;
}) => {
  const { word, lemma, className = "" } = props;
  const { result } = useCamdict(word);
  const { result: lemmaResult } = useCamdict(
    lemma && lemma.toLowerCase() !== word?.toLowerCase() ? lemma : ""
  );

  const pronunciations = useMemo<Pronunciation[]>(() => {
    const entry = result || lemmaResult;
    if (!entry) return [];

    // One per region: every part of speech repeats the same two recordings,
    // and a row of four identical speakers is not two more ways to say it.
    const byRegion = new Map<string, Pronunciation>();
    for (const posItem of entry.posItems || []) {
      for (const pron of posItem.pronunciations || []) {
        if (!pron.audio?.match(/\.mp3/i)) continue;
        if (byRegion.has(pron.region)) continue;
        byRegion.set(pron.region, pron);
      }
    }

    return [...byRegion.values()];
  }, [result, lemmaResult]);

  if (!word?.trim()) return null;

  if (pronunciations.length === 0) {
    return <SynthesizedPronunciation word={word} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {pronunciations.map((pron) => (
        <Button
          key={pron.region}
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1"
          onClick={() => new Audio(pron.audio).play()}
        >
          <span className="uppercase text-xs font-serif text-muted-foreground">
            {pron.region}
          </span>
          <span className="text-xs font-code">/{pron.pronunciation}/</span>
          <Volume2Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
};

WordPronunciation.displayName = "WordPronunciation";

/**
 * The fallback, drawn only when the dictionary has no recording of the word.
 *
 * It says nothing about how the word is pronounced — there is no IPA to show —
 * so it is a speaker on its own, and `SpeakButton` draws nothing at all in a
 * browser without a voice installed for the language.
 */
const SynthesizedPronunciation = (props: {
  word: string;
  className?: string;
}) => <SpeakButton text={props.word} className={props.className} />;
