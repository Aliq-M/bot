/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
        table.boolean('is_bot').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name');
        table.integer('telegram_id').primary();
        table.dateTime('created_at').defaultTo(knex.fn.now());
        table.string('country');
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
