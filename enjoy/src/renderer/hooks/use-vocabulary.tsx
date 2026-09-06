import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

/**
 * One word's standing in the vocabulary book.
 *
 * Saving is an upsert on the main process side, so a component need not know
 * whether the word is already in the book before offering to save it — asking
 * is only what decides which of the two buttons to draw.
 */
export const useVocabulary = (word: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [meaning, setMeaning] = useState<MeaningType>();
  const [saving, setSaving] = useState<boolean>(false);

  const trimmed = (word || "").trim();

  useEffect(() => {
    let stale = false;

    if (!trimmed) {
      setMeaning(undefined);
      return;
    }

    EnjoyApp.meanings.findOne({ word: trimmed }).then((found) => {
      if (!stale) setMeaning(found);
    });

    return () => {
      stale = true;
    };
  }, [trimmed]);

  const save = async (params?: {
    lemma?: string;
    pronunciation?: string;
    pos?: string;
    definition?: string;
    translation?: string;
    context?: string;
    contextTranslation?: string;
  }) => {
    if (!trimmed) return;

    setSaving(true);
    try {
      setMeaning(await EnjoyApp.meanings.create({ ...params, word: trimmed }));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!meaning) return;

    setSaving(true);
    try {
      await EnjoyApp.meanings.destroy(meaning.id);
      setMeaning(undefined);
    } finally {
      setSaving(false);
    }
  };

  return { meaning, saved: Boolean(meaning), saving, save, remove };
};
