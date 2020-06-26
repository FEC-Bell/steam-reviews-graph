var mysql = require('mysql');
var config = require('./config');
var db = mysql.createConnection( config );

// a flexible randomizer that takes arrays or numbers and returns a random element from that range
var rnd = n => Array.isArray(n) ? n[ rnd(n.length) - 1] : Math.floor( Math.random() * n ) + 1

var seedValues = () => {
  var values = '';

  // do this for each of the first 100 games, by gameID (1-100)
  for( var gameID = 1; gameID <= 100; gameID++ ) {

    // start from today
    var currentDay = new Date();

    // for each game, set up a range/ratio for scores to inhabit
    var posRange = rnd(20) + rnd(20);
    var negRange = rnd(20) - rnd(10); 

    // put a floor of 3 on negative reviews, in case randomization does something unexpected
    if ( negRange < 3 ) negRange = 3;

    // start from today's date and go back 365 days
    for ( var past = 0; past < 365 ; past++ ) {

      // INSERT statement looks like this:
      // INSERT into reviews_graph (gameid, date, positive, negative) VALUES ...
      values += `(${gameID},'${currentDay.toISOString().split("T")[0]}',${rnd(posRange)},${rnd(negRange)}),`
      // [date].toISOString().split("T")[0] translates a date into MySQL date format (YYYY-MM-DD)

      // shift one day into the past and continue
      currentDay.setDate( currentDay.getDate() - 1 )
    }
  }

  // strip off the last extraneous comma
  return values.slice(0,-1);
}

// run each of these lines in order
var sql = [
  `CREATE DATABASE IF NOT EXISTS steam;`,
  `USE steam;`,
  `DROP TABLE IF EXISTS reviews_graph;`,
  `CREATE TABLE reviews_graph (
    id int auto_increment primary key,
    gameid int not null,
    date date, 
    positive int,
    negative int
  );`,
  `INSERT into reviews_graph (gameid, date, positive, negative) VALUES ${ seedValues() };`
]

console.log( 'Beginning seed script for reviews_graph')

// convert this array of SQL statements into a set of ordered Promises
Promise.all( 
  sql.map( (sqlText) => {
      new Promise( (resolve, reject) => { 
        db.query( sqlText, (err, result, fields) => {
          // console.log('\nExecuting sql: ' + sqlText + '\n');
          if (err) throw err;
        })
      })
   })
)
.then(values => { console.log('Data generated successfully.') })
.catch(error => { console.error(error.message) })
db.end( () => { console.log('Connection closed.') });

/*

SQL for querying this dataset:

SELECT 
SUM(positive) as pos, 
SUM(negative) as neg
FROM reviews_graph
WHERE gameid = 1;

SELECT  
SUM(positive) as pos,  
SUM(negative) as neg 
FROM reviews_graph 
WHERE date >= CURDATE()-30 
AND date <= CURDATE() 
AND gameid = 1;

SELECT 
CONCAT ( Year(date), '-', LPAD( Month(date), 2, '0'), '-01' ) as month, 
SUM(positive) as pos, 
SUM(negative) as neg
FROM reviews_graph
WHERE gameid = 1
GROUP BY month
ORDER BY month;

SELECT 
date, 
positive as pos, 
negative as neg
FROM reviews_graph
WHERE date >= CURDATE()-30
AND date <= CURDATE()
AND gameid = 2
ORDER BY date;

*/