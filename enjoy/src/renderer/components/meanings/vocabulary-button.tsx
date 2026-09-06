import { Button, toast } from "@renderer/components/ui";
import { useVocabulary } from "@renderer/hooks";
import { BookmarkCheckIcon, BookmarkPlusIcon, LoaderIcon } from "lucide-react";
import { t } from "i18next";

/**
 * Put the word you are looking at into the vocabulary book, or take it out.
 *
 * What is saved is whatever the dictionary in front of you knew — the AI
 * dictionary hands over a translation and the sentence you met the word in,
 * Cambridge hands over a definition and an IPA. Saving the same word from the
 * other dictionary fills in what the first one did not have rather than
 * replacing the entry, so the two are worth using on the same word.
 */
export const VocabularyButton = (props: {
  word: string;
  lemma?: string;
  pronunciation?: string;
  pos?: string;
  definition?: string;
  translation?: string;
  context?: string;
  contextTranslation?: string;
}) => {
  const { word, ...meaning } = props;
  const { saved, saving, save, remove } = useVocabulary(word);

  if (!word?.trim()) return null;

  const handleSave = () => {
    save(meaning)
      .then(() => toast.success(t("savedToVocabulary", { word })))
      .catch((err) => toast.error(err.message));
  };

  const handleRemove = () => {
    remove()
      .then(() => toast.success(t("removedFromVocabulary", { word })))
      .catch((err) => toast.error(err.message));
  };

  if (saving) {
    return (
      <Button variant="ghost" size="sm" className="h-7 gap-1" disabled>
        <LoaderIcon className="size-4 animate-spin" />
      </Button>
    );
  }

  if (saved) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-muted-foreground"
        onClick={handleRemove}
      >
        <BookmarkCheckIcon className="size-4" />
        <span className="text-xs">{t("inVocabulary")}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-7 gap-1"
      onClick={handleSave}
    >
      <BookmarkPlusIcon className="size-4" />
      <span className="text-xs">{t("saveToVocabulary")}</span>
    </Button>
  );
};

VocabularyButton.displayName = "VocabularyButton";
