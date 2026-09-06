import { ipcMain, IpcMainEvent } from "electron";
import { Lookup, Meaning } from "@main/db/models";
import { Attributes, FindOptions, Op, WhereOptions } from "sequelize";
import log from "@main/logger";

const logger = log.scope("db/handlers/meanings-handler");

/**
 * The vocabulary book.
 *
 * `create` is an upsert rather than an insert: saving a word you already have
 * fills in whatever the dictionary knew this time and files the new sentence
 * under it. That is what lets the same button serve "save" from three
 * dictionaries without the caller having to know which of them you used before.
 */
class MeaningsHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Meaning>> & { query?: string }
  ) {
    const { query, where = {} } = options || {};
    delete options?.query;
    delete options?.where;

    if (query) {
      (where as any)[Op.or] = [
        { word: { [Op.like]: `%${query}%` } },
        { translation: { [Op.like]: `%${query}%` } },
        { definition: { [Op.like]: `%${query}%` } },
      ];
    }

    const meanings = await Meaning.findAll({
      order: [["createdAt", "DESC"]],
      include: [Lookup],
      where,
      ...options,
    });

    return meanings.map((meaning) => meaning.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Meaning>>
  ) {
    const meaning = await Meaning.findOne({
      where: caseInsensitiveWord(where),
      include: [Lookup],
    });
    if (!meaning) return;

    return meaning.toJSON();
  }

  private async create(
    _event: IpcMainEvent,
    params: {
      word: string;
      lemma?: string;
      pronunciation?: string;
      pos?: string;
      definition?: string;
      translation?: string;
      context?: string;
      contextTranslation?: string;
    }
  ) {
    const word = (params?.word || "").trim();
    if (!word) {
      throw new Error("Cannot save a word that is blank");
    }

    // Matched with `like` rather than `=` so that meeting `Chirp` at the start
    // of a sentence lands on the `chirp` already in the book: SQLite's `like`
    // ignores case for ASCII, and a vocabulary book with both is a book that
    // asks you to learn the same word twice.
    const existing = await Meaning.findOne({
      where: caseInsensitiveWord({ word }),
    });

    // Only what this dictionary actually knew. A local dictionary that hands
    // over nothing but the word must not blank the translation the AI wrote.
    const attributes = named({
      lemma: params.lemma,
      pronunciation: params.pronunciation,
      pos: params.pos,
      definition: params.definition,
      translation: params.translation,
    });

    const meaning = existing
      ? await existing.update(attributes)
      : await Meaning.create({ word, ...attributes });

    const context = (params.context || "").trim();
    if (context) {
      const [lookup] = await Lookup.findOrCreate({
        where: { meaningId: meaning.id, context },
      });

      if (params.contextTranslation) {
        await lookup.update({ contextTranslation: params.contextTranslation });
      }
    }

    return this.findOne(_event, { id: meaning.id });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const meaning = await Meaning.findByPk(id);
    if (!meaning) {
      logger.warn(`Meaning ${id} is already gone`);
      return;
    }

    await Lookup.destroy({ where: { meaningId: meaning.id } });
    return await meaning.destroy();
  }

  register() {
    ipcMain.handle("meanings-find-all", this.findAll);
    ipcMain.handle("meanings-find-one", this.findOne);
    ipcMain.handle("meanings-create", this.create.bind(this));
    ipcMain.handle("meanings-destroy", this.destroy);
  }

  unregister() {
    ipcMain.removeHandler("meanings-find-all");
    ipcMain.removeHandler("meanings-find-one");
    ipcMain.removeHandler("meanings-create");
    ipcMain.removeHandler("meanings-destroy");
  }
}

/**
 * Asking for a word means asking for the entry, whatever case you met it in.
 *
 * `save` merges `Chirp` into the `chirp` already in the book, so a caller that
 * then asked for `Chirp` with a plain `=` would be told the word is not saved
 * and offer to save it again. `like` with no wildcards is an equality test that
 * ignores case, which is the comparison both sides want.
 */
const caseInsensitiveWord = (
  where: WhereOptions<Attributes<Meaning>>
): WhereOptions<Attributes<Meaning>> => {
  const { word, ...rest } = (where || {}) as { word?: string };
  if (typeof word !== "string") return where;

  return { ...rest, word: { [Op.like]: word.trim() } } as WhereOptions<
    Attributes<Meaning>
  >;
};

/** The fields the caller actually named, blanks and absences dropped alike. */
const named = (fields: Record<string, string | undefined>) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value?.trim())
  );

export const meaningsHandler = new MeaningsHandler();
