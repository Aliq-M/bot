exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
      table.boolean('is_bot').notNullable();
      table.string('first_name');
      table.string('last_name');
      table.integer('telegram_id').primary();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.string('country');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('users');
  };
  