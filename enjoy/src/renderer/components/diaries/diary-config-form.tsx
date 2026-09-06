import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Form } from "@renderer/components/ui";
import { t } from "i18next";
import { TTSForm } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { useContext, useState } from "react";
import { AISettingsProviderContext } from "@renderer/context";
import { resolveVoiceSettings } from "@/voice-settings";

const diaryConfigSchema = z.object({
  config: z.object({
    // Non-empty, the same as the app-level form: a blank voice saves cleanly
    // and then fails at synthesis, one screen away from the field that caused
    // it. Required here, the empty select says so where it can be fixed.
    tts: z.object({
      engine: z.string().min(1),
      model: z.string().min(1),
      voice: z.string().min(1),
      language: z.string().min(1),
    }),
  }),
});

/**
 * A Diary configures only its voice. Document's form carries reading options —
 * translation, layout, advancing to the next paragraph — that belong to reading
 * a book, and a Diary is not read that way.
 */
export const DiaryConfigForm = (props: {
  config?: DiaryType["config"];
  onSubmit: (data: z.infer<typeof diaryConfigSchema>) => Promise<void>;
}) => {
  const { config, onSubmit } = props;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { ttsConfig } = useContext(AISettingsProviderContext);

  // Seeded the same way the Diary will be spoken: its own settings where it
  // has them, the app's where it does not, so a Diary carrying a blank voice
  // opens on the voice it would actually use rather than on nothing.
  const tts = resolveVoiceSettings(ttsConfig, config?.tts);
  if (!tts.language) {
    tts.language = "en-US";
  }

  const form = useForm<z.infer<typeof diaryConfigSchema>>({
    resolver: zodResolver(diaryConfigSchema),
    defaultValues: { config: { tts } },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          setSubmitting(true);
          onSubmit(data).finally(() => {
            setSubmitting(false);
          });
        })}
      >
        <div className="space-y-4">
          <TTSForm form={form} />
        </div>

        <div className="flex justify-end my-4">
          <Button type="submit" disabled={submitting}>
            {submitting && <LoaderIcon className="w-4 h-4 animate-spin mr-2" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
