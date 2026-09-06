import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  IsUUID,
  Model,
  Table,
} from "sequelize-typescript";
import { Meaning } from "@main/db/models";

/**
 * One occurrence of a saved word: the sentence you met it in.
 *
 * A Meaning without Lookups is a word you saved from nowhere in particular —
 * legitimate, and what saving from the widget with no sentence around it
 * produces. The memorizing card shows the contexts on its front side, so the
 * ones that have them are the ones worth reviewing.
 */
@Table({
  modelName: "Lookup",
  tableName: "lookups",
  underscored: true,
  timestamps: true,
})
export class Lookup extends Model<Lookup> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @ForeignKey(() => Meaning)
  @AllowNull(false)
  @Column(DataType.UUID)
  meaningId: string;

  @BelongsTo(() => Meaning, { foreignKey: "meaningId", constraints: false })
  meaning: Meaning;

  @Default("")
  @AllowNull(false)
  @Column(DataType.TEXT)
  context: string;

  @Column(DataType.TEXT)
  contextTranslation: string;
}
