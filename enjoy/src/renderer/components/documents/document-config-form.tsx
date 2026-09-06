import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@renderer/components/ui";
import { t } from "i18next";
import { TTSForm } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { useContext, useState } from "react";
import { AISettingsProviderContext } from "@renderer/context";
import { resolveVoiceSettings } from "@/voice-settings";

const documentConfigSchema = z.object({
  config: z.object({
    autoTranslate: z.boolean(),
    autoNextSpeech: z.boolean(),
    layout: z.enum(["horizontal", "vertical"]),
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

export const DocumentConfigForm = (props: {
  config?: DocumentEType["config"];
  onSubmit: (data: z.infer<typeof documentConfigSchema>) => Promise<void>;
}) => {
  const { config, onSubmit } = props;
  if (!config?.layout) {
    config.layout = "horizontal";
  }
  if (config?.tts && !config?.tts?.language) {
    config.tts.language = "en-US";
  }
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { ttsConfig } = useContext(AISettingsProviderContext);

  const form = useForm<z.infer<typeof documentConfigSchema>>({
    resolver: zodResolver(documentConfigSchema),
    defaultValues: config
      ? // The Document's own settings where it has them, the app's where it
        // does not, so a Document carrying a blank voice opens on the voice it
        // would actually use rather than on nothing.
        { config: { ...config, tts: resolveVoiceSettings(ttsConfig, config.tts) } }
      : {
          config: {
            autoTranslate: true,
            autoNextSpeech: true,
            tts: ttsConfig,
          },
        },
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
          <FormField
            control={form.control}
            name="config.autoTranslate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between space-x-2">
                  <FormLabel>{t("autoTranslate")}</FormLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.autoNextSpeech"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between space-x-2">
                  <FormLabel>{t("autoNextSpeech")}</FormLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("layout")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pleaseSelect")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">
                      {t("horizontal")}
                    </SelectItem>
                    <SelectItem value="vertical">{t("vertical")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

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
