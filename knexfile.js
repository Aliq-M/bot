module.exports = {
    development: {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      },
      migrations: {
        tableName: 'knex_migrations'
      },
      useNullAsDefault: true
    }
  };