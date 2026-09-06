import { Button } from "@renderer/components/ui";
import { VocabularyButton } from "@renderer/components";
import { useCamdict } from "@renderer/hooks";
import { Volume2Icon } from "lucide-react";
import { t } from "i18next";

/**
 * The Cambridge entry for a word: how it is said, what it means, and — under
 * each sense — the sentences Cambridge uses to show it being used.
 *
 * The examples were always in the shipped dictionary, one list per sense; only
 * the definitions were ever drawn. A definition on its own says what a word
 * means and not how anyone would say it, which is the half a learner is
 * actually looking a word up for.
 */
export const CamdictLookupResult = (props: {
  word: string;
  context?: string;
}) => {
  const { word, context } = props;
  const { result } = useCamdict(word);

  if (!word) return null;

  return (
    <>
      {result ? (
        <div className="select-text">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="font-semibord font-serif">{word}</div>
            <VocabularyButton
              word={word}
              pronunciation={firstPronunciation(result)}
              pos={result.posItems?.[0]?.type}
              definition={firstDefinition(result)}
              context={context}
            />
          </div>
          {result.posItems.map((posItem, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center space-x-4 mb-2 flex-wrap">
                <div className="italic text-sm text-muted-foreground">
                  {posItem.type}
                </div>

                {posItem.pronunciations.map((pron, i) => (
                  <div
                    key={`pron-${i}`}
                    className="flex items-center space-x-2"
                  >
                    <span className="uppercase text-xs font-serif text-muted-foreground">
                      [{pron.region}]
                    </span>
                    <span className="text-sm font-code">
                      /{pron.pronunciation}/
                    </span>
                    {pron.audio && pron.audio.match(/\.mp3/i) && (
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full p-0 w-6 h-6"
                          onClick={() => {
                            const audio = new Audio(pron.audio);
                            audio.play();
                          }}
                        >
                          <Volume2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ul className="list-disc pl-4 space-y-2">
                {posItem.definitions.map((def, i) => (
                  <li key={`pos-${i}`} className="">
                    {def.definition}
                    {def.examples?.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {def.examples.map((example, j) => (
                          <li
                            key={`example-${i}-${j}`}
                            className="text-sm italic text-muted-foreground font-serif"
                          >
                            {example}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm font-serif text-muted-foreground py-2 text-center">
          - {t("noResultsFound")} -
        </div>
      )}
    </>
  );
};

/**
 * What a Cambridge entry contributes to a vocabulary book entry.
 *
 * The first sense of the first part of speech, rather than all of them: the
 * book is a list of words to review, and an entry that reproduces the whole
 * article is one nobody reads the back of. The article stays a lookup away.
 */
const firstDefinition = (result: CamdictWordType) =>
  result.posItems?.[0]?.definitions?.[0]?.definition;

/** The UK reading when there is one, since that is the row shown first. */
const firstPronunciation = (result: CamdictWordType) => {
  const pronunciations = result.posItems?.[0]?.pronunciations || [];

  return (
    pronunciations.find((pron) => pron.region === "uk") || pronunciations[0]
  )?.pronunciation;
};
