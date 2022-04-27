# NSQLize (not loger maintained, this is from a backup of my old GitHub account)

> As it were SQL, create a CRUD directly on node.

NSQLize is a small and basic module that brings functions to work with sql databases on node.
NOTE: actually mariadb is the only database tested on, using the ```mysql``` package for node.

Summary: the module contains some basic functions just for a CRUD on sql databases on node.

## Installation

This repo' can be cloned or directly downloaded and placed everywhere inside the project's folder as long as the ```require()``` function points to the correct path to the file ```nsqlize.js```.

### npm

The ```nsqlize``` module is available on Github Pakages, to install from it, ```git``` and ```npm``` must be installed and the next command must be writen and executed on the CLI:

```
npm install netherlink117/nsqlize --save
```

Then the module configuration must be created under the ```nsqlize``` folder from the ```root``` path of the project/package, like is shown in the example below.

```
├── node_modules
│   └── ...
├── public
│   └── ...
└── nsqlize             # nsqlize folder in root folder
│   └── config.json     # configuration file, its content is an object with host, user, password and database; as properties
├── app.js
├── package.json
│
```

Then the ```nsqlize``` module just needs to be included with the ```require()``` function, preferably somewhere with enough scope so it doesn need to be declared multiple times.

```javascript
let nsqlize = require('@netherlink117/nsqlize');
```

If the above steps were followed correctly, then ```nsqlize``` is ready to use.

## Why?

There are many frameworks that can do almost everything, but some of those frameworks requires and generates stuff that sometimes is not easy to catch. So this alternative lets do stuff which is relatively easy to catch.

## Usage

The usage is relatively simple, it's almost like using SQL statemens directly on the database's client, but on node.

### Inserting data:

There are multiple forms to define an insert statement, since it builds the statement by steps, let's show it step by step:

- First we call the ```nsqlize.insertInto()``` function which can be called this way:

    ```javascript
    nsqlize.insertInto('table')
    ```

    or

    ```javascript
    nsqlize.insertInto('table', ['column1', 'column2', 'column3'])
    ```

- After that, we have a pseudo-statement object, but it can not be executed, so we need to call the function ```values()``` from the pseudo-statement object returned, which can be called like this:

    ```javascript
    values('value1', 'value2', 'value3')
    ```

    or

    ```javascript
    values(['value1', 'value2', 'value3'])
    ```

After following these steps, the pseudo-statement returned can be execute with the function ```go()``` because it becomes available, so the sentece with execution must be something like:

```javascript
nsqlize.insertInto().values().go()
```

NOTE: the pseudo-statement object never gets executed unless you call the function ```go()``` which connects to the database and executes the statement returning a promise with the results and errors relatively.

### Selecting data (queries):

The select statemens is also formed step by step, since it works with pseudo-statment objects too.

- First we call the ```nsqlize.select()``` function like:

    ```javascript
    nsqlize.select('column1', 'column2', 'table.column3')
    ```

    or

    ```javascript
    nsqlize.select(['column1', 'column2', 'table.column3'])
    ```

- Then we can call the ```from()``` function like:

    ```javascript
    from('table1', 'database.table2')
    ```

    or

    ```javascript
    from(['table1', 'database.table2'])
    ```

    After that, we can use the ```go()``` function to retrieve information from the database, but aso we can do more complex statements by using some conditions and options like:

    - Where:

        This filters using the ```and``` SQL operator.

        ```javascript
        where(['column1', 'operator', 'argument'])
        ```

    - orWhere:

        This filters using the ```or``` SQL operator.

        ```javascript
        orWhere(['column1', 'operator', 'argument'])
        ```

    - groupBy:

        This groups the results by the defined columns.

        ```javascript
        groupBy('column1', 'column2')
        ```

        or

        ```javascript
        groupBy(['column1', 'column2'])
        ```

    - orderBy:

        This organize the results by the column defined in the order defined.

        ```javascript
        orderBy('column', 'order')
        ```

        Where ```'order'``` can be ```'asc'``` or ```'desc'```

    - limit:

        This limits the quantity of results.

        ```javascript
        limit(x)
        ```

        Where ```x``` is any integer number.

If we go straight and use all the functions, the sentence must end like this one:

```javascript
nsqlize.select().from().where().orWhere().orderBy().groupBy().limit().go()
```

Simple, isn't? Now let's go ahead to updates.

### Updating data:

Updating data shares some similarities with the inserting and selecting pseudo-statemens, due to the idea of "inserting" data onto "selected" columns and tables, the way ot works is as shown below:

- First we call the ```nsqlize.update()``` function to get a pseudo-statement object.

    ```javascript
    nsqlize.update('table')
    ```

- Now we can give some sets of colums and values with the ```set()``` function like this:

    ```javascript
    set({column1: 'value1', column2: 'value2', column3: 'value3'})
    ```

    or

    ```javascript
    set(['column1', '=', 'value1'], ['column2', '=', 'value2'], ['column3', '=', 'value3'])
    ```

    I know, the first option is cleaner and more readable, so I personally recommend to use that one. By the way, after calling the function ```update()``` and ```set()```, the pseudo-statement is ready to execute with the function ```go()``` but... Calm down my friend! I suggest you to use conditions. We don't want to override all the database's data, so... Use conditions as in the "select" pseudo-statement:

    - Where:

        This filters using the ```and``` SQL operator.

        ```javascript
        where(['column1', 'operator', 'argument'])
        ```

    - orWhere:

        This filters using the ```or``` SQL operator.

        ```javascript
        orWhere(['column1', 'operator', 'argument'])
        ```

The final sentence must be like this:

```javascript
nsqlize.update().set().where().orWhere().go()
```

Do you see it? It't almost the same (if it isn't) as the select pseudo-statement's "where" and "orWhere", now we can finish with this, going ahead to the delete example.

### Delete

The delete, one more time, share some similarities with the select and update pseudo-statements, in terms of filtration (conditions).

- First we cal the ```nsqlize.deleteFrom()``` function:

    ```javascript
    nsqlize.deleteFrom('table')
    ```

    It returns an executable-ready pseudo statement with ```go()```, but again, don't delete your database's data!... Use conditions!

   - Where:

        This filters using the ```and``` SQL operator.

        ```javascript
        where(['column1', 'operator', 'argument'])
        ```

    - orWhere:

        This filters using the ```or``` SQL operator.

        ```javascript
        orWhere(['column1', 'operator', 'argument'])
        ```

A well formed delete pseudo-statemen must be like this:

```javascript
nsqlize.deleteFrom().where().orWhere().limit();
```

NOTE: Yes, we can use the ```limit()``` function on some sql databases, if not any.

### The final function: ```go()```

As you may know, or at least you may noticed, every complete sentence ends with the function ```go()``` which has explained earlier.
I tried to go syncrhnous while I was moving some of my project from php to node, but at the end I couldn't keep it synchronous, so every connection to the database is asynchronous.

While the first functions of each statement are synchronous and returns a pseudo-statement object, the final one returns a ```Promise``` which is "asynchronous", so you can create the statement and then call the promise when everything in the pseudo-statement is ready.
Look at the example:

```javascript
// create statement
let statement = nsqlize.select('column1', 'column2', 'column3').from('table');

// execute statement in the only way this project can do: Promises
statement.go().then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
});
```

NOTE: the ```result``` is a result object from the connection created at the pool of the dependency (```mysql``` package), in other words, it is the same as the ```res``` retrieved by ```mysql``` alone in its ```query``` function at a ```pool```. For more information check the code of this module and the documentation for the ```mysql``` package for node.

### Recommendations

You can always check the pseudo-statement object generated and returned by each function, by using the ```console.log()``` function. Doing that, you can see the statement string, parameters, conditions, options, etc. Also you can analize the code and understand what is happening on each function, it might help a little to build better statements. This module is intented to work with ongoing projects, for new projects I suggest to use more complete frameworks.

By the way, this small project that I made was only for personal uses... But now I want to share it with the people (even when no one cares).
The project is under the MIT license and may containg bugs, use at your own responsability.

I do no plan to maintain (build new features, fix all bugs, or improve performance) if I don't see the needings, so you can clone this repo' and build something amazing by yourself.

Regards:

Daniel

## License

MIT