/**
 * The settings that decide how a piece of text sounds.
 *
 * Three fields, and only three: `use-speech.tsx` destructures `engine`,
 * `model` and `voice` before calling any synthesiser, and `speeches-create`
 * stores those three against the Speech it writes. A `language` travels with
 * them through the forms — it filters Azure's several hundred voices down to
 * the ones worth showing — but it is never sent anywhere, so two settings that
 * differ only in language produce the same audio.
 */
export type VoiceSettings = {
  engine?: string;
  model?: string;
  voice?: string;
};

/**
 * Whether audio made under `a` would sound like audio made under `b`.
 *
 * A Speech is found by the text it speaks, so nothing else notices when the
 * voice moves on. This is how a panel showing an old Speech can tell that it
 * is old, and offer to say the text again rather than leaving the new setting
 * looking ignored.
 *
 * Settings that are absent answer `true`. A Speech from before this question
 * existed, or one stored with nothing in its configuration, gives no grounds
 * for telling the user their audio is out of date — and a warning that might
 * be wrong is worse than no warning at all.
 */
export const sameVoice = (a?: VoiceSettings, b?: VoiceSettings): boolean => {
  if (!settled(a) || !settled(b)) return true;

  return a.engine === b.engine && a.model === b.model && a.voice === b.voice;
};

/** Settings that actually say which voice they mean. */
const settled = (settings?: VoiceSettings): settings is VoiceSettings =>
  Boolean(settings?.engine && settings?.model && settings?.voice);

/**
 * The settings a piece of text will actually be spoken with, given the app's
 * and whatever it carries of its own.
 *
 * Field by field rather than one object over the other, and a blank is not an
 * answer. A Diary or a Document keeps its own voice so that one piece can be
 * spoken differently from the rest, but the forms that write those settings
 * accepted an empty voice — so a piece saved before a voice was ever chosen
 * carries a blank, and a blank taken as an override silences a perfectly good
 * app-level voice. The failure then arrives at synthesis, telling the user to
 * choose a voice in preferences where one is already chosen.
 */
export const resolveVoiceSettings = (
  appConfig?: TtsConfigType,
  own?: Partial<TtsConfigType>
): TtsConfigType => {
  const resolved = { ...(appConfig || {}) } as TtsConfigType;

  for (const [key, value] of Object.entries(own || {})) {
    if (value === "" || value === null || value === undefined) continue;

    (resolved as any)[key] = value;
  }

  return resolved;
};
