import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, toast } from "@renderer/components/ui";
import { useAiCommand } from "@renderer/hooks";
import { VocabularyButton, WordPronunciation } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { md5 } from "js-md5";

export const AiLookupResult = (props: {
  word: string;
  context?: string;
  sourceType?: string;
  sourceId?: string;
}) => {
  const { word, context = "", sourceType, sourceId } = props;
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [result, setResult] = useState<LookupType>();
  const { lookupWord } = useAiCommand();

  const handleLookup = async (options?: { force: boolean }) => {
    if (lookingUp) return;
    if (!word) return;
    const { force = false } = options || {};

    setLookingUp(true);
    lookupWord({
      word,
      context,
      sourceId,
      sourceType,
      cacheKey: `lookup-${md5(`${word}-${context}`)}`,
      force,
    })
      .then((lookup) => {
        if (lookup?.meaning) {
          setResult(lookup);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLookingUp(false);
      });
  };

  const fetchCachedLookup = async () => {
    const remoteLookup = await webApi.lookup({
      word,
      context,
      sourceId,
      sourceType,
    });
    if (remoteLookup?.meaning) {
      setResult(remoteLookup);
      return;
    }

    const cached = await EnjoyApp.cacheObjects.get(
      `lookup-${md5(`${word}-${context}`)}`
    );
    if (cached?.meaning) {
      setResult(cached);
      return;
    }

    setResult(undefined);
  };

  /*
   * Fetch cached lookup result.
   */
  useEffect(() => {
    if (!word || !context) return;

    fetchCachedLookup();
  }, [word, context]);

  if (!word) return null;

  // The AI dictionary answers in the shape its prompt asks for, and the
  // sentence translation comes back on the meaning under the prompt's own
  // snake_case name rather than as a field of the lookup.
  const contextTranslation = (result?.meaning as any)?.context_translation;

  return (
    <>
      {result ? (
        <>
          <div className="mb-4 select-text">
            <div className="mb-2 font-semibord font-serif">{word}</div>
            <div className="mb-2">
              {result.meaning?.pos && (
                <span className="italic text-sm text-muted-foreground mr-2">
                  {result.meaning.pos}
                </span>
              )}
              {result.meaning?.pronunciation && (
                <span className="text-sm font-code mr-2">
                  /{result.meaning.pronunciation.replaceAll("/", "")}/
                </span>
              )}
              {result.meaning?.lemma &&
                result.meaning.lemma !== result.meaning.word && (
                  <span className="text-sm">({result.meaning.lemma})</span>
                )}
            </div>
            <WordPronunciation
              word={word}
              lemma={result.meaning?.lemma}
              className="mb-2"
            />
            <div className="text-serif">{result.meaning.translation}</div>
            <div className="text-serif">{result.meaning.definition}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <VocabularyButton
              word={word}
              lemma={result.meaning?.lemma}
              pronunciation={result.meaning?.pronunciation}
              pos={result.meaning?.pos}
              definition={result.meaning?.definition}
              translation={result.meaning?.translation}
              context={context}
              contextTranslation={contextTranslation}
            />
            <Button
              className="cursor-pointer"
              variant="secondary"
              size="sm"
              disabled={lookingUp}
              onClick={() => handleLookup({ force: true })}
              asChild
            >
              <a>
                {lookingUp && (
                  <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                )}
                {t("reLookup")}
              </a>
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center space-x-2 py-2">
          <Button
            className="cursor-pointer"
            size="sm"
            asChild
            onClick={() => handleLookup()}
          >
            <a>
              {lookingUp && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              <span>{t("aiLookup")}</span>
            </a>
          </Button>
        </div>
      )}
    </>
  );
};
