// s2.2.7.17

const valueParse = require('../value-parser');

/*module.exports = function(parser, colMetadata, options, callback) {
  const columns = options.useColumnNames ? {} : [];

  const len = colMetadata.length;
  let i = 0;

  function next(done) {
    if (i === len) {
      return done();
    }


    const columnMetaData = colMetadata[i];
    valueParse(parser, columnMetaData, options, (value) => {
      const column = {
        value: value,
        metadata: columnMetaData
      };

      if (options.useColumnNames) {
        if (columns[columnMetaData.colName] == null) {
          columns[columnMetaData.colName] = column;
        }
      } else {
        columns.push(column);
      }

      i++;

      next(done);
    });
  }

  next(() => {
    callback({
      name: 'ROW',
      event: 'row',
      columns: columns
    });
  });
};
*/

/*
module.exports = function (parser, colMetadata, options, callback) {
  const columns = options.useColumnNames ? {} : [];

  const len = colMetadata.length;

  let done = () => {
    callback({
      name: 'ROW',
      event: 'row',
      columns: columns
    });
  }

  console.log('- Total columns :', len);
  for (let i = 0; i < len; i++) {
    console.log('Parsing column ', i)
    const columnMetaData = colMetadata[i];

    valueParse(parser, columnMetaData, options, (value) => {
      const column = {
        value: value,
        metadata: columnMetaData
      };

      if (options.useColumnNames) {
        if (columns[columnMetaData.colName] == null) {
          columns[columnMetaData.colName] = column;
        }
      } else {
        columns.push(column);
      }
      // console.log('insde value ',value)
      if (i == len - 1) {
        return done();
      }
    });
  }

  console.log('- calling Done')


};
*/


module.exports = async function (parser, colMetadata, options, callback) {
  const columns = options.useColumnNames ? {} : [];

  const len = colMetadata.length;

  let done = () => {
    callback({
      name: 'ROW',
      event: 'row',
      columns: columns
    });
  }

  console.log('- Total columns :', len);
  for (let i = 0; i < len; i++) {
    console.log('Parsing column ', i)
    const columnMetaData = colMetadata[i];
    let value = await valueParse(parser, columnMetaData, options);

    const column = {
      value: value,
      metadata: columnMetaData
    };

    if (options.useColumnNames) {
      if (columns[columnMetaData.colName] == null) {
        columns[columnMetaData.colName] = column;
      }
    } else {
      columns.push(column);
    }
    console.log(' value from within: ',value)
    if (i == len - 1) {
      return done();
    }
/*    await _valueParse(parser, columnMetaData, options, (value) => {
      const column = {
        value: value,
        metadata: columnMetaData
      };

      if (options.useColumnNames) {
        if (columns[columnMetaData.colName] == null) {
          columns[columnMetaData.colName] = column;
        }
      } else {
        columns.push(column);
      }
      // console.log('insde value ',value)
      if (i == len - 1) {
        return done();
      }
    });*/
  }

  console.log('- calling Done')


};
