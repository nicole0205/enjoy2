import { ipcMain } from "electron";
import path from "path";
import fs from "fs-extra";
import log from "@main/logger";
import { Sequelize, DataType } from "sequelize-typescript";

const __dirname = import.meta.dirname.replace("app.asar", "app.asar.unpacked");

const logger = log.scope("camdict");

const DICT_FILE = "cam_dict.refined.sqlite";

/**
 * Where the shipped Cambridge dictionary is, in each distribution that has one.
 *
 * `vite.main.config.ts` copies it next to the built main process, which is what
 * the first path names. Local Web Enjoy runs this file from source instead, and
 * there the download script's own directory at the workspace root is the only
 * copy — no build step ever put one beside the source.
 */
const DICT_PATHS = [
  path.join(__dirname, "lib", "dictionaries", DICT_FILE),
  path.join(__dirname, "..", "..", "lib", "dictionaries", DICT_FILE),
];

class Camdict {
  public dbPath = DICT_PATHS.find((p) => fs.existsSync(p)) ?? DICT_PATHS[0];
  private sequelize: Sequelize;
  private db: any;

  async init() {
    if (this.db) return;

    try {
      this.sequelize = new Sequelize({
        dialect: "sqlite",
        storage: this.dbPath,
      });
      this.sequelize.sync();
      this.sequelize.authenticate();
      this.db = this.sequelize.define(
        "Camdict",
        {
          id: {
            type: DataType.INTEGER,
            primaryKey: true,
          },
          oid: {
            type: DataType.STRING,
          },
          word: {
            type: DataType.STRING,
          },
          posItems: {
            type: DataType.JSON,
          },
        },
        {
          modelName: "Camdict",
          tableName: "camdict",
          underscored: true,
          timestamps: true,
        }
      );
    } catch (err) {
      logger.error("Failed to initialize camdict", err);
    }
  }

  async lookup(word: string) {
    await this.init();

    const item = await this.db?.findOne({
      where: { word: word.trim().toLowerCase() },
    });

    return item?.toJSON();
  }

  registerIpcHandlers() {
    ipcMain.handle("camdict-lookup", async (_event, word: string) => {
      return this.lookup(word);
    });
  }
}

export default new Camdict();
