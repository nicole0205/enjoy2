import { useEffect, useState } from "react";
import { Button } from "@renderer/components/ui";
import { Volume2Icon } from "lucide-react";
import { cn } from "@renderer/lib/utils";

/**
 * A speaker that reads a piece of text with the browser's own voice.
 *
 * For text nobody recorded: a sentence you met a word in, rather than the word
 * itself, which the shipped Cambridge dictionary has an actual recording of.
 * Synthesis is worse than a recording and much better than reading silently.
 *
 * Drawn only when the browser has a voice installed, since a speaker that
 * stays silent is worse than no speaker at all.
 */
export const SpeakButton = (props: {
  text: string;
  lang?: string;
  className?: string;
}) => {
  const { text, lang = "en-US", className = "" } = props;
  const [available, setAvailable] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Voices load asynchronously in Chrome, and the first call routinely
    // answers with an empty list.
    const check = () => setAvailable(synth.getVoices().length > 0);
    check();
    synth.addEventListener("voiceschanged", check);

    return () => synth.removeEventListener("voiceschanged", check);
  }, []);

  // A card you flip or step past should stop talking, and an utterance that
  // outlives its button keeps reading a sentence no longer on screen.
  useEffect(() => {
    return () => {
      if (speaking) window.speechSynthesis?.cancel();
    };
  }, [speaking]);

  if (!available) return null;
  if (!text?.trim()) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();

    if (speaking) {
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full size-6 p-0 border border-secondary shrink-0",
        speaking && "bg-secondary",
        className
      )}
      onClick={speak}
    >
      <Volume2Icon className="size-4" />
    </Button>
  );
};

SpeakButton.displayName = "SpeakButton";
