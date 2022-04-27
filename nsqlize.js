/**
 * NSQLize
 * As it were SQL, create a CRUD directly on node.
 * NSQLize is a small and basic project that brings functions to work with sql databases on node.
 * Note: actually mariadb is the only database tested on, using the ```mysql``` package for node.
 *
 * Summary: the module contains some basic functions just for a CRUD on sql databases on node.
 *
 * Copyright (c) 2020 Daniel Gutierrez
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";
let mysql = require("mysql");
let _nsqlize_confingurations = {};
try {
  _nsqlize_confingurations = require(process.mainModule.paths[0]
    .split("node_modules")[0]
    .slice(0, -1) + "/nsqlize/config.json");
} catch (err1) {
  try {
    _nsqlize_confingurations = require(process.mainModule.paths[0]
      .split("node_modules")[0]
      .slice(0, -1) + "/nsqlize/config.js");
  } catch (err2) {
    try {
      _nsqlize_confingurations = require(process.mainModule.paths[0]
        .split("bin")[0]
        .slice(0, -1) + "/nsqlize/config.json");
    } catch (err3) {
      try {
        _nsqlize_confingurations = require(process.mainModule.paths[0]
          .split("bin")[0]
          .slice(0, -1) + "/nsqlize/config.js");
      } catch (err4) {
        console.log(err4);
        _nsqlize_confingurations = null;
      }
    }
  }
}
if (
  typeof _nsqlize_confingurations != "object" ||
  Array.isArray(_nsqlize_confingurations) ||
  _nsqlize_confingurations === null
) {
  throw "Missing configuration. Check if confi.json or config.js is defined under nsqlize directory.";
}
let _keys = Object.keys(_nsqlize_confingurations);
if (
  _keys.indexOf("host") < 0 ||
  _keys.indexOf("database") < 0 ||
  _keys.indexOf("user") < 0 ||
  _keys.indexOf("password") < 0
) {
  throw "Wrong configuration object. Check all the keys and values, it must be like normal mysql configuration object.";
}
let pool = mysql.createPool(_nsqlize_confingurations);
/**
 * Checks the arguments when the function accepts undefined number of arguments.
 * @param  {...String}  _arguments - The arguments to sanitize. Single array of strings (one argument) or multiple strings (multiple arguments).
 */
function sanitizeArguments(..._arguments) {
  if (_arguments.length == 1) {
    if (typeof _arguments[0] === "string") {
      _arguments = [_arguments[0]];
    } else if (Array.isArray(_arguments[0])) {
      _arguments = _arguments[0];
    } else {
      throw "String or Array required when calling the function `sanitizeArguments` with a single argument.";
    }
  }
  for (let _argument of _arguments) {
    if (
      typeof _argument !== "string" ||
      _argument === "" ||
      _argument === null
    ) {
      throw "Each item of array (if passed as single argument) or each argument (when passing multiples), given when calling the function `sanitizeArguments`, must be of type string.";
    }
    let conarr = _argument.split(".");
    if (conarr.length > 2) {
      throw "Each item of array (if passed as single argument) or each argument (when passing multiples) for the function `sanitizeArguments`, can contain only one dot to define database scopes (only on selects). Example: `table`.`column` or `database`.`table`.";
    }
  }
  return _arguments;
}
/**
 * Checks if the conditions given are arrays like ['column','operator','value'].
 * @param  {...Array} _conditions - The conditions to sanitize. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
 */
function sanitizeConditions(..._conditions) {
  let conditions = [];
  let conditionsString = [];
  let argumentsString = [];
  if (_conditions.length == 1) {
    if (!Array.isArray(_conditions[0])) {
      throw "Array required when calling the function `sanitizeConditions` with single argument, multiple arrays required when calling with multiple arguments.";
    } else {
      _conditions = [_conditions[0]];
    }
  }
  for (let _condition of _conditions) {
    let condition = {};
    if (!Array.isArray(_condition)) {
      throw "Every condition for the function `sanitizeConditions` must be an array containing the column, the operator and the value.";
    }
    if (
      typeof _condition[0] == "string" &&
      _condition[0] != "" &&
      typeof _condition[1] == "string" &&
      _condition[1] != ""
    ) {
      condition.column = _condition[0];
      if (
        _condition[1] !== "=" &&
        _condition[1] !== "!=" &&
        _condition[1] !== "<>" &&
        _condition[1] !== "<" &&
        _condition[1] !== ">" &&
        _condition[1] !== "<=" &&
        _condition[1] !== ">=" &&
        _condition[1] !== "between" &&
        _condition[1] !== "not between" &&
        _condition[1] !== "like" &&
        _condition[1] !== "not like"
      ) {
        throw "Operator not supported yet by conditional comparations at function `sanitizeConditions`.";
      }
      condition.operator = _condition[1];
      if (_condition[1] === "between" || _condition[1] === "not between") {
        if (!Array.isArray(_condition[2])) {
          throw "The correct values for conditionals like between must be array with only two values, for the function `sanitizeConditions`.";
        }
        if (_condition[2].length !== 2) {
          throw "The between conditional requires only 2 values for the function `sanitizeConditions`.";
        }
        condition.arguments = _condition[2];
        conditions.push(condition);
        conditionsString.push(
          condition.column + " " + condition.operator + " ? and ?"
        );
        argumentsString.push(condition.arguments[0]);
        argumentsString.push(condition.arguments[1]);
      } else {
        condition.argument = _condition[2];
        conditions.push(condition);
        conditionsString.push(
          condition.column + " " + condition.operator + " ?"
        );
        argumentsString.push(condition.argument);
      }
    } else {
      throw "Wrong conditional form for the function `sanitizeConditions`.";
    }
  }
  return [conditions, conditionsString, argumentsString];
}
/**
 * Checks if the sets given are arrays like ['column','=','value'], or a single object like { points: 1, name: 'Jhon'}.
 * @param  {...Array} _sets - The sets to sanitize. Single array (one argument) for one set or multiple arrays (multiple arguments) for multiple sets. Also single object (one argument) for multiple sets.
 */
function sanitizeSets(..._sets) {
  let sets = [];
  let setsString = [];
  let valuesString = [];
  if (_sets.length == 1) {
    if (!Array.isArray(_sets[0]) && typeof _sets[0] != "object") {
      throw "Array required when calling the function `sanitizeSets` with single argument, multiple arrays required when calling with multiple arguments.";
    } else if (
      typeof _sets[0] == "object" &&
      _sets[0] !== null &&
      !Array.isArray(_sets[0])
    ) {
      let _objectKeys = Object.keys(_sets[0]);
      let _objectValues = Object.values(_sets[0]);
      _sets = [];
      for (let index = 0; index < _objectKeys.length; index++) {
        _sets.push([_objectKeys[index], "=", _objectValues[index]]);
      }
    } else {
      _sets = [_sets[0]];
    }
  }
  for (let _set of _sets) {
    let set = {};
    if (!Array.isArray(_set)) {
      throw "Every set for the function `sanitizeSets` must be an array containing the column, the operator = and the value.";
    }
    if (
      typeof _set[0] == "string" &&
      _set[0] != "" &&
      typeof _set[1] == "string" &&
      _set[1] != ""
    ) {
      set.column = _set[0];
      if (_set[1] !== "=") {
        throw "Operator not supported yet by seting definitions at function `sanitizeSets`.";
      }
      set.operator = _set[1];
      set.value = _set[2];
      sets.push(set);
      setsString.push(set.column + " " + set.operator + " ?");
      valuesString.push(set.value);
    } else {
      throw "Wrong seting form for the function `sanitizeSets`.";
    }
  }
  return [sets, setsString, valuesString];
}
/**
 * Export an object with the CRUD functions: insertInto, select, update, delete.
 * @param {Object} _configurations - Configurations to create a mysql pool.
 */
module.exports = {
  /**
   * Creates an object with some properties and one statement, but not ready to execute.
   * @param {String} _table - The name of the table where values will be inserted. It must be string.
   * @param {String[]} _columns - The name of the columns of the table where values will be inserted. It must be an array of strings.
   */
  insertInto: function (_table, _columns = null) {
    if (typeof _table !== "string" || _table === "") {
      throw "The first argument for `insertInto` must be a strign (the table name).";
    }
    _table = sanitizeArguments(_table);
    let _statement = "insert into " + _table;
    if (Array.isArray(_columns)) {
      _columns = sanitizeArguments(..._columns);
      _statement += "(" + _columns.join(", ") + ")";
    } else if (_columns !== null) {
      throw "The second parmeter for `insertInto` must be an array of strings, each string must be a column from the defined table at first parameter.";
    }
    return {
      table: _table,
      columns: _columns,
      statement: _statement,
      /**
       * Creates an object preppending the `insertInto` object, but this is ready to execute using the function `go`.
       * @param  {...any} _values
       */
      values: function (..._values) {
        if (_values.length == 1) {
          _values = [_values];
        }
        if (this.columns === null) {
          this.columns = undefined;
        }
        return {
          ...this,
          values: _values,
          statement:
            this.statement +
            " values(" +
            String("?, ").repeat(_values.length).slice(0, -2) +
            ")",
          /**
           * Executes the statement of the current object returning a `Promise`.
           */
          go: function () {
            return new Promise((resolve, reject) => {
              pool.query(this.statement, this.values, (err, res) => {
                err ? reject(err) : resolve(res);
              });
            });
          },
        };
      },
    };
  },
  /**
   * Creates an object with some properties to build a select statement, not ready to executes.
   * @param  {...String} _columns - The columns the information to retrieve from the database. Single array of strings (one argument) or multiple strings (multiple arguments) are accepted as columns.
   */
  select: function (..._columns) {
    _columns = sanitizeArguments(..._columns);
    return {
      columns: _columns,
      /**
       * Creates an object with some properties and statement preppending the `select` object, ready to execute using the function `go`.
       * @param  {...String} _tables - The tables containing the information to retrieve from the database.
       */
      from: function (..._tables) {
        _tables = sanitizeArguments(..._tables);
        let _statement =
          "select " + _columns.join(", ") + " from " + _tables.join(", ");
        return {
          ...this,
          tables: _tables,
          filtered: false,
          statement: _statement,
          /**
           * Creates an object with some properties and statement preppending the `from` or `orWhere` object, ready to execute using the function `go`.
           * @param  {...Array} _conditions - The conditions that must match to retrieve the information filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
           */
          where: function (..._conditions) {
            let x_o_x = sanitizeConditions(..._conditions);
            _conditions =
              typeof this.andConditions != "undefined"
                ? this.andConditions.raw.concat(x_o_x[0])
                : x_o_x[0];
            let _stringConditions =
              typeof this.andConditions != "undefined"
                ? this.andConditions.formed.concat(x_o_x[1])
                : x_o_x[1];
            let _arguments =
              typeof this.arguments != "undefined"
                ? this.arguments.concat(x_o_x[2])
                : x_o_x[2];
            let _statement = this.statement;
            if (!this.filtered) {
              _statement += " where ";
              this.filtered = true;
            } else {
              _statement += " and ";
            }
            _statement += x_o_x[1].join(" and ");
            return {
              ...this,
              andConditions: {
                raw: _conditions,
                formed: _stringConditions,
              },
              arguments: _arguments,
              statement: _statement,
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `from` or `where` object, ready to execute using the function `go`.
           * @param  {...Array} _conditions - The conditions that must match to retrieve the infromation filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
           */
          orWhere: function (..._conditions) {
            let x_o_x = sanitizeConditions(..._conditions);
            _conditions =
              typeof this.orConditions != "undefined"
                ? this.orConditions.raw.concat(x_o_x[0])
                : x_o_x[0];
            let _stringConditions =
              typeof this.orConditions != "undefined"
                ? this.orConditions.formed.concat(x_o_x[1])
                : x_o_x[1];
            let _arguments =
              typeof this.arguments != "undefined"
                ? this.arguments.concat(x_o_x[2])
                : x_o_x[2];
            let _statement = this.statement;
            if (!this.filtered) {
              _statement += " where ";
              this.filtered = true;
            } else {
              _statement += " or ";
            }
            _statement += x_o_x[1].join(" or ");
            return {
              ...this,
              orConditions: {
                raw: _conditions,
                formed: _stringConditions,
              },
              arguments: _arguments,
              statement: _statement,
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `from` or `where` or `orWhere` or `orderBy` object, ready to execute using the `go` function.
           * @param  {...String} _groups - The groups that will organize the infromation retrieved.
           */
          groupBy: function (..._groups) {
            _groups = sanitizeArguments(..._groups);
            let _statement = this.statement;
            this.where = undefined;
            this.orWhere = undefined;
            this.groupBy = undefined;
            return {
              ...this,
              groups: _groups,
              statement: _statement + " group by " + _groups.join(", "),
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `from` or `where` or `orWhere` or `groupBy` object, ready to execute using the `go` function.
           * @param  {String} _column - The column where the order will be applied for the infromation retrieved.
           * @param {String} _order - The order that will be applied to the information retrieved based on the column defined.
           */
          orderBy: function (_column, _order) {
            if (_order !== "desc" && _order !== "asc") {
              throw "Wrong order by definition, the function `orderBy` requires only two argumets of type string: column name and order.";
            }
            _order = {
              column: _column,
              direction: _order,
            };
            this.where = undefined;
            this.orWhere = undefined;
            this.orderBy = undefined;
            let _statement = this.statement;
            return {
              ...this,
              order: _order,
              statement:
                _statement +
                " order by " +
                _order.column +
                " " +
                _order.direction,
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `from` or `where` or `orWhere` or `groupBy` or `orderBy` object, ready to execute using the `go` function.
           * @param {bigint} _limit - Limit for the statement. It must be ingeter.
           */
          limit: function (_limit) {
            if (!Number.isInteger(_limit)) {
              throw "Limit must be integer values";
            }
            let _statement = this.statement;
            this.limit = undefined;
            return {
              ...this,
              limit: _limit,
              statement: _statement + " limit " + String(_limit),
            };
          },
          /**
           * Executes the statement of the current object returning a `Promise`.
           */
          go: function () {
            return new Promise((resolve, reject) => {
              if (typeof this.arguments != "undefined") {
                pool.query(this.statement, this.arguments, (err, res) => {
                  err ? reject(err) : resolve(res);
                });
              } else {
                pool.query(this.statement, (err, res) => {
                  err ? reject(err) : resolve(res);
                });
              }
            });
          },
        };
      },
    };
  },
  /**
   * Creates an object with some properties to build an update statement, not ready to execute.
   * @param {String} _table - The table where the information will be updated.
   */
  update: function (_table) {
    if (typeof _table != "string" || _table === "") {
      throw "The table name for update must be string at function `update`.";
    }
    return {
      table: _table,
      /**
       * Creates an object with some properties to build an update statement preppending the `update` object, ready to execute using the function `go`. WARNING: Use with care, using with the `where` or `orWhere` functions are a good idea.
       * @param  {...Array|Object} _sets - The that that will re-define the information stored. Single array (one argument) for one set or multiple arrays (multiple arguments) for multiple sets. It can also be a javascript object (one argument).
       */
      set: function (..._sets) {
        let x_o_x = sanitizeSets(..._sets);
        _sets = x_o_x[0];
        let _stringSets = x_o_x[1];
        let _values = x_o_x[2];
        let _statement = "update " + this.table + " set " + x_o_x[1].join(", ");
        return {
          ...this,
          sets: {
            raw: _sets,
            formed: _stringSets,
          },
          values: _values,
          statement: _statement,
          /**
           * Creates an object with some properties and statement preppending the `set` or `orWhere` object, ready to execute using the function `go`.
           * @param  {...Array} _conditions - The conditions that must match to retrieve the information filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
           */
          where: function (..._conditions) {
            let x_o_x = sanitizeConditions(..._conditions);
            _conditions =
              typeof this.andConditions != "undefined"
                ? this.andConditions.raw.concat(x_o_x[0])
                : x_o_x[0];
            let _stringConditions =
              typeof this.andConditions != "undefined"
                ? this.andConditions.formed.concat(x_o_x[1])
                : x_o_x[1];
            let _arguments =
              typeof this.arguments != "undefined"
                ? this.arguments.concat(x_o_x[2])
                : x_o_x[2];
            let _statement = this.statement;
            if (!this.filtered) {
              _statement += " where ";
              this.filtered = true;
            } else {
              _statement += " and ";
            }
            _statement += x_o_x[1].join(" and ");
            return {
              ...this,
              andConditions: {
                raw: _conditions,
                formed: _stringConditions,
              },
              arguments: _arguments,
              statement: _statement,
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `set` or `where` object, ready to execute using the function `go`.
           * @param  {...Array} _conditions - The conditions that must match to retrieve the infromation filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
           */
          orWhere: function (..._conditions) {
            let x_o_x = sanitizeConditions(..._conditions);
            _conditions =
              typeof this.orConditions != "undefined"
                ? this.orConditions.raw.concat(x_o_x[0])
                : x_o_x[0];
            let _stringConditions =
              typeof this.orConditions != "undefined"
                ? this.orConditions.formed.concat(x_o_x[1])
                : x_o_x[1];
            let _arguments =
              typeof this.arguments != "undefined"
                ? this.arguments.concat(x_o_x[2])
                : x_o_x[2];
            let _statement = this.statement;
            if (!this.filtered) {
              _statement += " where ";
              this.filtered = true;
            } else {
              _statement += " or ";
            }
            _statement += x_o_x[1].join(" or ");
            return {
              ...this,
              orConditions: {
                raw: _conditions,
                formed: _stringConditions,
              },
              arguments: _arguments,
              statement: _statement,
            };
          },
          /**
           * Creates an object with some properties and statement preppending the `from` or `where` or `orWhere` or `groupBy` or `orderBy` object, ready to execute using the `go` function.
           * @param {bigint} _limit - Limit for the statement. It must be ingeter.
           */
          limit: function (_limit) {
            if (!Number.isInteger(_limit)) {
              throw "Limit must be integer values";
            }
            let _statement = this.statement;
            this.limit = undefined;
            return {
              ...this,
              limit: _limit,
              statement: _statement + " limit " + String(_limit),
            };
          },
          /**
           * Executes the statement of the current object returning a `Promise`.
           */
          go: function () {
            return new Promise((resolve, reject) => {
              if (typeof this.arguments != "undefined") {
                pool.query(
                  this.statement,
                  this.values.concat(this.arguments),
                  (err, res) => {
                    err ? reject(err) : resolve(res);
                  }
                );
              } else {
                pool.query(this.statement, this.values, (err, res) => {
                  err ? reject(err) : resolve(res);
                });
              }
            });
          },
        };
      },
    };
  },
  /**
   * Creates an object with some properties to build an update statement, ready to execute. WARNING: Use with care, using with the `where` or `orWhere` functions are a good idea.
   * @param {String} _table - The table where the information will be deleted.
   */
  deleteFrom: function (_table) {
    if (typeof _table != "string" || _table === "") {
      throw "The table name for update must be string at function `delete`.";
    }
    let _statement = "delete from " + _table;
    return {
      table: _table,
      statement: _statement,
      /**
       * Creates an object with some properties and statement preppending the `delete` or `orWhere` object, ready to execute using the function `go`.
       * @param  {...Array} _conditions - The conditions that must match to retrieve the information filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
       */
      where: function (..._conditions) {
        let x_o_x = sanitizeConditions(..._conditions);
        _conditions =
          typeof this.andConditions != "undefined"
            ? this.andConditions.raw.concat(x_o_x[0])
            : x_o_x[0];
        let _stringConditions =
          typeof this.andConditions != "undefined"
            ? this.andConditions.formed.concat(x_o_x[1])
            : x_o_x[1];
        let _arguments =
          typeof this.arguments != "undefined"
            ? this.arguments.concat(x_o_x[2])
            : x_o_x[2];
        let _statement = this.statement;
        if (!this.filtered) {
          _statement += " where ";
          this.filtered = true;
        } else {
          _statement += " and ";
        }
        _statement += x_o_x[1].join(" and ");
        return {
          ...this,
          andConditions: {
            raw: _conditions,
            formed: _stringConditions,
          },
          arguments: _arguments,
          statement: _statement,
        };
      },
      /**
       * Creates an object with some properties and statement preppending the `delete` or `where` object, ready to execute using the function `go`.
       * @param  {...Array} _conditions - The conditions that must match to retrieve the infromation filtered. Single array (one argument) for one condition or multiple arrays (multiple arguments) for multiple conditions.
       */
      orWhere: function (..._conditions) {
        let x_o_x = sanitizeConditions(..._conditions);
        _conditions =
          typeof this.orConditions != "undefined"
            ? this.orConditions.raw.concat(x_o_x[0])
            : x_o_x[0];
        let _stringConditions =
          typeof this.orConditions != "undefined"
            ? this.orConditions.formed.concat(x_o_x[1])
            : x_o_x[1];
        let _arguments =
          typeof this.arguments != "undefined"
            ? this.arguments.concat(x_o_x[2])
            : x_o_x[2];
        let _statement = this.statement;
        if (!this.filtered) {
          _statement += " where ";
          this.filtered = true;
        } else {
          _statement += " or ";
        }
        _statement += x_o_x[1].join(" or ");
        return {
          ...this,
          orConditions: {
            raw: _conditions,
            formed: _stringConditions,
          },
          arguments: _arguments,
          statement: _statement,
        };
      },
      /**
       * Creates an object with some properties and statement preppending the `from` or `where` or `orWhere` or `groupBy` or `orderBy` object, ready to execute using the `go` function.
       * @param {bigint} _limit - Limit for the statement. It must be ingeter.
       */
      limit: function (_limit) {
        if (!Number.isInteger(_limit)) {
          throw "Limit must be integer values";
        }
        let _statement = this.statement;
        this.limit = undefined;
        return {
          ...this,
          limit: _limit,
          statement: _statement + " limit " + String(_limit),
        };
      },
      /**
       * Executes the statement of the current object returning a `Promise`.
       */
      go: function () {
        return new Promise((resolve, reject) => {
          if (typeof this.arguments != "undefined") {
            pool.query(this.statement, this.arguments, (err, res) => {
              err ? reject(err) : resolve(res);
            });
          } else {
            pool.query(this.statement, (err, res) => {
              err ? reject(err) : resolve(res);
            });
          }
        });
      },
    };
  },
};
