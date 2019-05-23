const url = require('url');

const section = 'sourceMappingURL';

// read a variable uint encoding from the buffer stream.
// return the int, and the next position in the stream.
function read_uint(buf, pos) {
  let n = 0;
  let shift = 0;
  let b = buf[pos];
  let outpos = pos + 1;
  while (b >= 128) {
    n = n | ((b - 128) << shift);
    b = buf[outpos];
    outpos++;
    shift += 7
  }
  return [n + (b << shift), outpos];
};

function encode_uint(n) {
  result = [];
  while (n > 127) {
    result.push(128 | (n & 127));
    n = n >> 7;
  }
  result.push(n);
  return new Uint8Array(result);
};

function ab2str(buf) {
  let str = '';
  let bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
};

function str2ab(str) {
  let bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str[i].charCodeAt(0);
  }
  return bytes;
};

module.exports = {
  GetSourceMapURL: function (buf) {
    buf = new Uint8Array(buf);
    const uri_start = module.exports.FindSection(buf, section);
    if (uri_start == -1) {
      return null;
    }
    const [uri_len, uri_pos] = read_uint(buf, uri_start);
    return ab2str(buf.slice(uri_pos, uri_pos + uri_len));
  },
  MakeAbsolute: function (buf, wasmURL) {
    buf = new Uint8Array(buf);
    const uri_start = module.exports.FindSection(buf, section);
    if (uri_start == -1) {
      return buf;
    }
    const [uri_len, uri_pos] = read_uint(buf, uri_start);
    const uri = ab2str(buf.slice(uri_pos, uri_pos + uri_len));
    const new_uri = url.resolve(wasmURL, uri);
    if (uri == new_uri) {
      return buf
    }

    const [newSection, offset] = module.exports.WriteSection(section, new_uri);

    let oldSectionLen = offset + (uri_pos - uri_start + uri_len);
    const outBuffer = new Uint8Array(buf.length + newSection.length - oldSectionLen);
    outBuffer.set(buf.slice(0, uri_start - offset));
    outBuffer.set(newSection, uri_start - offset);
    outBuffer.set(buf.slice(uri_pos + uri_len), uri_start - offset + newSection.length);

    return outBuffer;
  },
  WriteSection: function (name, value) {
    const nameBuf = str2ab(name);
    const valBuf = str2ab(value);
    const nameLen = encode_uint(nameBuf.length);
    const valLen = encode_uint(valBuf.length);
    const sectionLen = nameLen.length + nameBuf.length + valLen.length + valBuf.length;
    const headerLen = encode_uint(sectionLen);
    let bytes = new Uint8Array(sectionLen + headerLen.length + 1);
    let pos = 1;
    bytes.set(headerLen, pos);
    pos += headerLen.length;
    bytes.set(nameLen, pos);
    pos += nameLen.length;
    bytes.set(nameBuf, pos);
    pos += nameBuf.length;
    const val_start = pos;
    bytes.set(valLen, pos);
    pos += valLen.length;
    bytes.set(valBuf, pos)
    return [bytes, val_start];
  },
  FindSection: function (buf, id) {
    let pos = 8;
    while (pos < buf.byteLength) {
      const sec_start = pos;
      const [sec_id, pos2] = read_uint(buf, pos);
      const [sec_size, body_pos] = read_uint(buf, pos2);
      pos = body_pos + sec_size;
      if (sec_id == 0) {
        const [name_len, name_pos] = read_uint(buf, body_pos);
        const name = buf.slice(name_pos, name_pos + name_len);
        const nameString = ab2str(name);
        if (nameString == id) {
          return name_pos + name_len;
        }
      }
    }
    return -1;
  },
};
