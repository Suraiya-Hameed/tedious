const types = {
  1: {
    name: 'DATABASE',
    event: 'databaseChange'
  },
  2: {
    name: 'LANGUAGE',
    event: 'languageChange'
  },
  3: {
    name: 'CHARSET',
    event: 'charsetChange'
  },
  4: {
    name: 'PACKET_SIZE',
    event: 'packetSizeChange'
  },
  7: {
    name: 'SQL_COLLATION',
    event: 'sqlCollationChange'
  },
  8: {
    name: 'BEGIN_TXN',
    event: 'beginTransaction'
  },
  9: {
    name: 'COMMIT_TXN',
    event: 'commitTransaction'
  },
  10: {
    name: 'ROLLBACK_TXN',
    event: 'rollbackTransaction'
  },
  13: {
    name: 'DATABASE_MIRRORING_PARTNER',
    event: 'partnerNode'
  },
  17: {
    name: 'TXN_ENDED'
  },
  18: {
    name: 'RESET_CONNECTION',
    event: 'resetConnection'
  },
  20: {
    name: 'ROUTING_CHANGE',
    event: 'routingChange'
  }
};

function readNewAndOldValue(parser, length, type, callback) {
  switch (type.name) {
    case 'DATABASE':
    case 'LANGUAGE':
    case 'CHARSET':
    case 'PACKET_SIZE':
    case 'DATABASE_MIRRORING_PARTNER':
      return parser.readBVarChar((newValue) => {
        parser.readBVarChar((oldValue) => {
          if (type.name === 'PACKET_SIZE') {
            callback(parseInt(newValue), parseInt(oldValue));
          } else {
            callback(newValue, oldValue);
          }
        });
      });

    case 'SQL_COLLATION':
    case 'BEGIN_TXN':
    case 'COMMIT_TXN':
    case 'ROLLBACK_TXN':
    case 'RESET_CONNECTION':
      return parser.readBVarByte((newValue) => {
        parser.readBVarByte((oldValue) => {
          callback(newValue, oldValue);
        });
      });

    case 'ROUTING_CHANGE':
      parser.readUInt16LE((valueLength) => {
        // Routing Change:
        // Byte 1: Protocol (must be 0)
        // Bytes 2-3 (USHORT): Port number
        // Bytes 4-5 (USHORT): Length of server data in unicode (2byte chars)
        // Bytes 6-*: Server name in unicode characters
        parser.readBuffer(valueLength, (routePacket) => {
          const protocol = routePacket.readUInt8(0);

          if (protocol !== 0) {
            return parser.emit('error', new Error('Unknown protocol byte in routing change event'));
          }

          const port = routePacket.readUInt16LE(1);
          const serverLen = routePacket.readUInt16LE(3);
          // 2 bytes per char, starting at offset 5
          const server = routePacket.toString('ucs2', 5, 5 + (serverLen * 2));

          const newValue = {
            protocol: protocol,
            port: port,
            server: server
          };

          parser.readUInt16LE((oldValueLength) => {
            parser.readBuffer(oldValueLength, (oldValue) => {
              callback(newValue, oldValue);
            });
          });
        });
      });

      break;

    default:
      console.error('Tedious > Unsupported ENVCHANGE type ' + type.name);
      // skip unknown bytes
      parser.readBuffer(length - 1, () => {
        callback(undefined, undefined);
      });
  }
}

module.exports = function(parser, colMetadata, options, callback) {
  parser.readUInt16LE((length) => {
    parser.readUInt8((typeNumber) => {
      const type = types[typeNumber];

      if (!type) {
        console.error('Tedious > Unsupported ENVCHANGE type ' + typeNumber);
        // skip unknown bytes
        return parser.readBuffer(length - 1, () => {
          callback();
        });
      }

      readNewAndOldValue(parser, length, type, (newValue, oldValue) => {
        callback({
          name: 'ENVCHANGE',
          type: type.name,
          event: type.event,
          oldValue: oldValue,
          newValue: newValue
        });
      });
    });
  });
};

/*const EventEmitter = require('events').EventEmitter;

class EnvParser extends EventEmitter {
  constructor() {
    super();

  }

  async tryf(parser, colMetadata, options, callback) {
    console.log('in env-change-parser');
    // return new Promise((resolve, reject) {
    let length = await parser._readUInt16LE();
    let typeNumber = await parser._readUInt8();
    console.log('len of env ', length, ' |typeNumber ', typeNumber);
    const type = types[typeNumber];

    if (!type) {
      console.error('Tedious > Unsupported ENVCHANGE type ' + typeNumber);
      // skip unknown bytes
      // return parser.readBuffer(length - 1, () => {
      //   callback();
      // });
    }

    let { newValue, oldValue } = await this._readNewAndOldValue(parser, length, type);
    console.log('newValue ', newValue, ' |oldValue ', oldValue);
    // , (newValue, oldValue) => {
    callback({
      name: 'ENVCHANGE',
      type: type.name,
      event: type.event,
      oldValue: oldValue,
      newValue: newValue
    });

    console.log('Returning from eve-change')

  }

  async _readNewAndOldValue(parser, length, type, callback) {
    let newValue, oldValue;
    switch (type.name) {
      case 'DATABASE':
      case 'LANGUAGE':
      case 'CHARSET':
      case 'PACKET_SIZE':
      case 'DATABASE_MIRRORING_PARTNER':
        newValue = await parser._readBVarChar();
        oldValue = await parser._readBVarChar();

        if (type.name === 'PACKET_SIZE') {
          return {
            newValue: parseInt(newValue),
            oldValue: parseInt(oldValue)
          }
          // callback(parseInt(newValue), parseInt(oldValue));
        } else {

          return {
            newValue: newValue,
            oldValue: oldValue
          }

          // callback(newValue, oldValue);
        }

      // return parser.readBVarChar((newValue) => {
      //   parser.readBVarChar((oldValue) => {
      //     if (type.name === 'PACKET_SIZE') {
      //       callback(parseInt(newValue), parseInt(oldValue));
      //     } else {
      //       callback(newValue, oldValue);
      //     }
      //   });
      // });

      case 'SQL_COLLATION':
      case 'BEGIN_TXN':
      case 'COMMIT_TXN':
      case 'ROLLBACK_TXN':
      case 'RESET_CONNECTION':
        newValue = await parser._readBVarByte();
        oldValue = await parser._readBVarByte();
        return {
          newValue: newValue,
          oldValue: oldValue
        }
      // return parser.readBVarByte((newValue) => {
      //   parser.readBVarByte((oldValue) => {
      //     callback(newValue, oldValue);
      //   });
      // });

      case 'ROUTING_CHANGE':
        parser.readUInt16LE((valueLength) => {
          // Routing Change:
          // Byte 1: Protocol (must be 0)
          // Bytes 2-3 (USHORT): Port number
          // Bytes 4-5 (USHORT): Length of server data in unicode (2byte chars)
          // Bytes 6-*: Server name in unicode characters
          parser.readBuffer(valueLength, (routePacket) => {
            const protocol = routePacket.readUInt8(0);

            if (protocol !== 0) {
              return parser.emit('error', new Error('Unknown protocol byte in routing change event'));
            }

            const port = routePacket.readUInt16LE(1);
            const serverLen = routePacket.readUInt16LE(3);
            // 2 bytes per char, starting at offset 5
            const server = routePacket.toString('ucs2', 5, 5 + (serverLen * 2));

            const newValue = {
              protocol: protocol,
              port: port,
              server: server
            };

            parser.readUInt16LE((oldValueLength) => {
              parser.readBuffer(oldValueLength, (oldValue) => {
                callback(newValue, oldValue);
              });
            });
          });
        });

        break;

      default:
        console.error('Tedious > Unsupported ENVCHANGE type ' + type.name);
        // skip unknown bytes
        parser.readBuffer(length - 1, () => {
          callback(undefined, undefined);
        });
    }
  }


}

module.exports = async function (parser, colMetadata, options, callback) {
  let v = new EnvParser();
  await v.tryf(parser, colMetadata, options, callback);
}
*/