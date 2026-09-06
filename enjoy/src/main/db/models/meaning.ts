import {
  AfterCreate,
  AfterDestroy,
  AfterUpdate,
  BeforeSave,
  Column,
  DataType,
  Default,
  HasMany,
  IsUUID,
  Model,
  Table,
  Unique,
  AllowNull,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import { Lookup } from "@main/db/models";

/**
 * A word you saved, and what it means.
 *
 * One row per word: meeting `chirp` in a second sentence adds a Lookup under
 * the Meaning already there rather than a second entry in the book, which is
 * what makes the vocabulary page a list of words instead of a list of
 * occurrences.
 *
 * Local only. Hosted Enjoy kept the same pair of records behind
 * `/api/lookups`, and this fork has no account to keep them in — so the book
 * lives in the Library database beside everything else you practised against.
 */
@Table({
  modelName: "Meaning",
  tableName: "meanings",
  underscored: true,
  timestamps: true,
})
export class Meaning extends Model<Meaning> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  word: string;

  @Column(DataType.STRING)
  lemma: string;

  @Column(DataType.STRING)
  pronunciation: string;

  @Column(DataType.STRING)
  pos: string;

  @Column(DataType.TEXT)
  definition: string;

  @Column(DataType.TEXT)
  translation: string;

  @HasMany(() => Lookup, { foreignKey: "meaningId", onDelete: "CASCADE" })
  lookups: Lookup[];

  /**
   * The IPA the dictionaries hand over is written both ways — `tʃɜːp` from
   * Cambridge, `/tʃɜːp/` from the AI. Stored without the slashes, since every
   * place that shows it puts them back.
   */
  @BeforeSave
  static stripPronunciationSlashes(meaning: Meaning) {
    if (!meaning.pronunciation) return;

    meaning.pronunciation = meaning.pronunciation.replaceAll("/", "").trim();
  }

  @AfterCreate
  static notifyForCreate(meaning: Meaning) {
    this.notify(meaning, "create");
  }

  @AfterUpdate
  static notifyForUpdate(meaning: Meaning) {
    this.notify(meaning, "update");
  }

  @AfterDestroy
  static notifyForDestroy(meaning: Meaning) {
    this.notify(meaning, "destroy");
  }

  static notify(meaning: Meaning, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Meaning",
      id: meaning.id,
      action,
      record: meaning.toJSON(),
    });
  }
}
