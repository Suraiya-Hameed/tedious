// s2.2.7.17

const valueParse = require('../value-parser');

module.exports = async function(parser, colMetadata, options, callback) {
  const columns = options.useColumnNames ? {} : [];

  const len = colMetadata.length - 1;

  const invokeParser = (columnMetaData, i) => {
    return new Promise((resolve, reject) => {
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

        if (i == len) {
          callback({
            name: 'ROW',
            event: 'row',
            columns: columns
          });
        }
        resolve();
      });
    });
  };

  for (let i = 0; i < colMetadata.length; i++) {
    await invokeParser(colMetadata[i], i);
  }
};
