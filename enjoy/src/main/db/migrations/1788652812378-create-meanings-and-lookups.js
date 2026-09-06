import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("meanings", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    word: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lemma: {
      type: DataTypes.STRING,
    },
    pronunciation: {
      type: DataTypes.STRING,
    },
    pos: {
      type: DataTypes.STRING,
    },
    definition: {
      type: DataTypes.TEXT,
    },
    translation: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex("meanings", ["word"], {
    unique: true,
    name: "meanings_word_unique",
  });

  await queryInterface.createTable("lookups", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    meaning_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    context: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    context_translation: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex("lookups", ["meaning_id", "context"], {
    unique: true,
    name: "lookups_meaning_id_context_unique",
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("lookups");
  await queryInterface.dropTable("meanings");
}

export { up, down };
