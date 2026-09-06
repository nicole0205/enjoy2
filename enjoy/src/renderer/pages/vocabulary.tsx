import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState, useContext, useEffect, useCallback } from "react";
import {
  AppSettingsProviderContext,
  HotKeysSettingsProviderContext,
} from "@renderer/context";
import { LoaderSpin, MeaningMemorizingCard } from "@renderer/components";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "i18next";

/**
 * The vocabulary book, one flashcard at a time.
 *
 * Read from the Library database rather than from Hosted Enjoy, which this
 * fork has no account for — under the account-less stand-in the page asked for
 * a page of meanings, was answered with nothing, and spread `undefined` into
 * its list, which is why it had always rendered blank.
 */
export default () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentHotkeys, enabled } = useContext(
    HotKeysSettingsProviderContext
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const fetchMeanings = useCallback(() => {
    setLoading(true);
    EnjoyApp.meanings
      .findAll({})
      .then((found) => {
        setMeanings(found || []);
        setCurrentIndex(0);
      })
      .finally(() => setLoading(false));
  }, [EnjoyApp]);

  useEffect(() => {
    fetchMeanings();
  }, [fetchMeanings]);

  useHotkeys(
    [currentHotkeys.PlayPreviousSegment, currentHotkeys.PlayNextSegment],
    (keyboardEvent, hotkeyEvent) => {
      keyboardEvent.preventDefault();

      switch (hotkeyEvent.keys.join("")) {
        case currentHotkeys.PlayPreviousSegment.toLowerCase():
          document.getElementById("vocabulary-previous-button")?.click();
          break;
        case currentHotkeys.PlayNextSegment.toLowerCase():
          document.getElementById("vocabulary-next-button")?.click();
          break;
      }
    },
    {
      enabled,
    },
    []
  );

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <div className="h-[100vh]">
      <div className="max-w-screen-md mx-auto p-4">
        {meanings.length === 0 ? (
          <div className="h-[calc(100vh-5.25rem)] flex flex-col items-center justify-center text-center">
            <div className="font-semibold mb-2">{t("vocabularyIsEmpty")}</div>
            <div className="text-sm text-muted-foreground max-w-sm">
              {t("vocabularyIsEmptyDescription")}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-5.25rem)] flex items-center justify-between space-x-6">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              id="vocabulary-previous-button"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                }
              }}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
            <div className="bg-background flex-1 h-5/6 border p-6 rounded-xl shadow-xl">
              <MeaningMemorizingCard meaning={meanings[currentIndex]} />
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              id="vocabulary-next-button"
              onClick={() => {
                if (currentIndex < meanings.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                }
              }}
            >
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
