const net = require('net');
const port = 25565;
const host = '127.0.0.1';
const proxy = net.createServer();

const filter = 0; //0 client, 1, server, 2 both;

let sockets = [];

proxy.listen(port, host, () => {
    console.log('TCP Server is running on port ' + port +'.');
});


proxy.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sockets.push(sock);

    sock.gameServer = new net.Socket();
    sock.gameServer.client = sock;

    sock.gameServer.connect(25555, '127.0.0.1', function() {
      console.log('Connected to game server');
    });

    sock.gameServer.on('data', function(data) {
      if(filter == 1 || filter == 2) {
        var buff = new Buffer(data);

        var data16 = buff.toString('hex');
        console.log('Server: ' + data16);
      }
      sock.gameServer.client.write(data);
    });

    sock.gameServer.on('close', function() {
    	console.log('Connection closed');
    });

    sock.gameServer.on('err', err => {
      console.log(err);
    });

    sock.on('data', function(data) {
      var response;
      if(filter == 0 || filter == 2) {
        var buff = new Buffer(data);
        var data16 = buff.toString('hex');
        response = parse(data16);
      }
      if(response) {
        sock.gameServer.write(Buffer.from(response, 'hex'));
      } else {
        sock.gameServer.write(data);
      }
    });

    sock.on('close', function(data) {
        let index = sockets.findIndex(function(s) {
            return s.remoteAddress === sock.remoteAddress && s.remotePort === sock.remotePort;
        })
        if (index !== -1) {
          sockets.splice(index, 1);
          console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
        }
    });

}).on('err', err => {
  console.log(err);
});

function parseDoubleFromHex(input) {
  //console.log("Input: " + input);
  //console.log(hex2bin(input));
  var bin = (hex2bin(input));
  if(bin.length % 4 != 0) {
    bin = bin.padStart(bin.length + 4 - (bin.length % 4), '0');
    //console.log(bin);
  }
  var sign = bin[0];
  if(sign == 0) {
    sign = 1;
  } else {
    sign = -1;
  }
  //console.log("Sign: " + sign);
  var expon = parseInt(bin.substring(1,12), 2);
  //console.log("Expon: " + expon);
  var exponent = Math.pow(2, expon - 1023);
  //console.log("Exponent: " + exponent);
  //52
  bin = bin.substring(12);
  //console.log(bin);
  var mantissa = 1;
  var num = 0;
  for(var i = 0; i < bin.length; i++) {
    if(bin[i] == '1') {
      num = 1;
    } else {
      num = 0;
    }
    mantissa += (num / (Math.pow(2, i+1)));
  }
  //console.log(mantissa);

  return exponent * mantissa * sign;

}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function parseFloatFromHex(hex) {
  var bin = hex2bin(hex);

  if(bin.length % 4 != 0) {
    bin = bin.padStart(bin.length + 4 - (bin.length % 4), '0');
    //console.log(bin);
  }
  var sign = bin[0];
  if(sign == 0) {
    sign = 1;
  } else {
    sign = -1;
  }
  //console.log("Sign: " + sign);
  var expon = parseInt(bin.substring(1,9), 2);
  //console.log("Expon: " + expon);
  var exponent = Math.pow(2, expon - 127);
  //console.log("Exponent: " + exponent);
  //52
  bin = bin.substring(9);
  //console.log(bin);
  var mantissa = 1;
  var num = 0;
  for(var i = 0; i < bin.length; i++) {
    if(bin[i] == '1') {
      num = 1;
    } else {
      num = 0;
    }
    mantissa += (num / (Math.pow(2, i+1)));
  }
  //console.log(mantissa);

  return exponent * mantissa * sign;
}
/* Position: 0011
packet       x               y           z                ground
1b0011 4065478211b66e84 4015024197a953aa c062171258865939 00
1b0011 406546e8abe22ef6 4014b5006226a98a c06218c405b56ecb 00
1b0011 4065463efe7e08b2 40141902a0d07312 c06219b0f2d1f01b 00
1b0011 40654600ae36fc12 40132fdb7511b94a c0621a010b0ff604 00
1b0011 4065462411643376 4011fb15f04ec37d c06219c26bd52d05 00
1b0011 406546e1fd694bb1 40107c353d2ce552 c062196b59915058 00
1b0011 4065478ed1a1754f 4010000000000000 c062191c1d6d0280 01
1b0011 40654881f70eba1f 4010000000000000 c06218aca479e017 01
1b0011 406548ca736b6494 4010000000000000 c06218aca479e017 01
1b0011 4060e11b3696c8d8 4010000000000000 c06074e2c0318c78 01
1b0011 406130be4f351252 4010000000000000 c05fc3bdbf72510e 01
1b0011 40794626363b2d35 40f69a21f83b20b4 416312c43bd4ef22 00
1b0011 407935d06273c6fe 40f69a2ddf76d216 416312c440eebd8e 00
1b0011 4079363a1036f441 40f69a2ddf76d216 416312c4417f7a76 00
1b0011 4079369f9df91675 40f69a2ddf76d216 416312c4420a9110 00
1b0011 407936ff617ad65f 40f69a2ddf76d216 416312c4423ebdac 00
1b0011 407936ff617ad65f 40f69a2ddf76d216 416312c4423ebdac 00
1b0011 407936ff617ad65f 40f69a2ddf76d216 416312c4423ebdac 00
1b0011 3fe0000000000000 0000000000000000 3fe0000000000000 00
1b0011 41612a87e99999a0 0000000000000000 bfe6666660000000 00
1b0011 4059200000000000 4059000000000000 4059200000000000 00
1b0011 4059377f3b1d2b99 4010000000000000 40592dda69b1387b 01
1b0011 4025000000000000 4010000000000000 4025000000000000 01
1b0011 408f440000000000 4010000000000000 40c3884000000000 01

LOOKING: 0013
0b0013 43f0d30b 425b999e 01
0b0013 43ecc63e 4271ccd2 01
0b0013 43e98ca5 42810002 01
0b0013 43e5a640 4289199a 01
0b0013 43e12641 4290e665 01
0b0013 43ddb30f 42973330 01
0b0013 43daffdc 429a7fff 01
0b0013 43d84ca9 429b6666 01
0b0013 43d6f30f 429b6666 01
0b0013 43d64644 429b1999 01
0b0013 43d5f978 429b1999 01
0b0013 43d63311 429b1999 01
0b0013 43d65977 429b1999 01
0b0013 43d67fdd 429b1999 01
0b0013 43d6b976 429b1999 01
0b0013 43d6f30f 429b1999 01
0b0013 44a3b02b c242ffff 01
0b0013 44a311c5 c2726666 01
0b0013 44a34692 c2930001 01
0b0013 44a45cfa c2a6cccc 01
0b0013 44a65e94 c2b3ffff 01
0b0013 44a899c6 c2b2cccc 01
0b0013 44aa3b5f c2ab999a 01
0b0013 44ab002b c2a1199a 01
0b0013 44ab51c4 c28de666 01
0b0013 44ab0e90 c2640002 01
0b0013 44aaae92 c23ecccf 01
0b0013 44a9682b c21a3334 01
0b0013 44a6c82c c20c6668 01
0b0013 44a504fa c226ccce 01
0b0013 44a444fa c24accce 01
0b0013 44a474fa c262ccce 01
0b0013 44a64694 c2828000 01
0b0013 44a88b5f c283b333 01
0b0013 bc73e258 37c35000 01
0b0013 43951742 c1a7ffeb 01
0b0013 439b8a98 c1ddffde 01 -48.9 -27.7
0b0013 bc7b5c58 42b40000 01 -0.0/90
0b0013 4333fbf4 42b40000 01 180/90
0b0013 4334225a 42b40000 01 -179.9/90
0b0013 435548ae 40366664 01

MESSAGES: 0003
 len id    messlen message
 04  0003  01      61          ;a
 05  0003  02      61 61       ;aa
 06  0003  03      61 61 61    ;aaa
 07  0003  04      61 61 61 61 ;aaaa
 08  0003  05      61 61 61 61 61 ;aaaaa

 Move and LOook: 0012
bytes   packid   x                y                z                lookx    looky    ground
23      0012     c03890a071bf9f0e 4011ae147a000000 c0433b2e4e14e20f 444fda47 423799a8 00
23 0012 c03898a8d7da76ed 40130346db0ebedf c0432b23e11bbf6c 444ec3dc 423199a5 00
23 0012 c0389fa69289d8bb 4014015e380a6116 c0431a0a137b84d3 44499710 42353340 00
23 0012 c038a2a6fae19fc1 4014aa188bcd2b60 c043089d52cd7d43 443ffd75 424699ab 00
23 0012 c038a0dd59fbf336 4014ff2ae5c72d3e c042f7aaf0874728 443a70a6 423a99a8 00
23 0012 c0389a7d5a6857a1 4015024197a953aa c042e76f6b1b1427 4438b70a 422f333c 00
23 0012 c038923afb14f76a 4014b5006226a98a c042d66aff397050 443813d0 421c999e 00
23 0012 c03888035b8f03e1 40141902a0d07312 c042c4c1eeacba51 44374a2f 41f00004 00
23 0012 c0387bfdbc129f0e 40132fdb7511b94a c042b284df91e1c3 443736fb 41726668 00
23 0012 c0386eb305c6055b 4011fb15f04ec37d c0429fa5e6c4d0e3 44386a33 3f199990 00
23 0012 c038614cfba778b0 40107c353d2ce552 c0428bffef6c3379 443b9097 c10d999c 00
23 0012 c038558bba42ca30 4010000000000000 c0427791b4d16546 44407a2e c1499998 01
23 0012 c03855f940a99e12 4010000000000000 c0425972f9971674 4445b096 c144cccc 01
23 0012 c038696241c301eb 4010000000000000 c04240a868386e18 444b93ce c0e1999b 01
23 0012 c0388c159ff9451d 4010000000000000 c0422ecef6d84731 4450d3d1 3fe6666f 01
23 0012 c038b85a84ed02c3 4010000000000000 c042232eee5800a7 4453a3cf 413d999a 01
23 0012 c038ea1784558ccd 4011ae147a000000 c0421c30867862ec 44550704 41cc0004 00
23 0012 c0390a5a99daf90c 40130346db0ebedf c042182cbf54785f 4454a701 420d999d 00
23 0012 c0392cad5901e503 4014015e380a6116 c04213e550e0977c 44523701 42353337 00
23 0012 c0395042bac05b81 4014aa188bcd2b60 c0420ea6b37f282d 444dca39 425b999e 00
23 0012 c039704bea3cc021 4014ff2ae5c72d3e c042076030a0d2c8 444983d6 4271333a 00
23 0012 c0398bdba09185d1 4015024197a953aa c041fe6034a0c6f3 4445e0a5 427f000b 00
23 0012 c039a287a8232076 4014b5006226a98a c041f3fc2e3c5eaa 444353d7 4286b33d 00
23 0012 c039b4783ea1a7e6 40141902a0d07312 c041e8698ac1e7e2 444263d2 428c6674 00
23 0012 c039bfc7cfbb78bd 40132fdb7511b94a c041dd5d2125c820 44422a36 429699ae 00
23 0012 c039c51369511b8f 4011fb15f04ec37d c041d2c0c99a7c70 444263d2 429f99b4 00
23 0012 c039c56b6ed9ac40 40107c353d2ce552 c041ca3b70643d0f 4443c707 42a7b352 00
23 0012 c039c0976a3c1bc5 4010000000000000 c041c329351b2c94 44468d6d 42ad19bc 01
23 0012 c039a31cb8f1a451 4010000000000000 c041bce63aba5791 444a4d6a 42ad6689 01
23 0012 c0397a2f787b0b97 4010000000000000 c041b7b09b8c3db4 444c8d6a 42a7b352 01
23 0012 c0394b16ae76bf73 4010000000000000 c041b2cbbac8f40b 444cda3a 42a4b350 01
23 0012 c039315fac82cd6c 4010000000000000 c041b01fa87dfba0 444d00a2 42a1b34e 01
23 0012 c039235559ee060b 4010000000000000 c041aeaa27b588ae 444d13d6 42a0801a 01
23 0012 c0391baad9d68e33 4010000000000000 c041adde38f08538 444d1d70 429f99b3 01

Movment Modifier: 001b
PLength  PID  ?  Modifier
05       001b 01 0000       Crouching
05       001b 01 0100       Not Crouching
05       001b 05 0300       Sprinting
05       001b 05 0400       Stopped Sprinting

*/

function hex2String(hexx) {
    var hex = hexx.toString();
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function hexEncode(string) {
   var result = "";
   for (var i = 0; i < string.length; i++) {
       var hex = string.charCodeAt(i).toString(16);
       result += hex;
   }

   return result;
}

function parseMovement(data) {
  var x = data.substring(6,22)
  x = parseDoubleFromHex(x);

  var y = data.substring(22, 38);
  y = parseDoubleFromHex(y);

  var z = data.substring(38, 54);
  z = parseDoubleFromHex(z);

  console.log("X: " + x + " Y: " + y + " Z: " + z);
}

function parseLooking(data) {
  var lookX = parseFloatFromHex(data.substring(6, 14));
  var lookY = parseFloatFromHex(data.substring(14, 22));

  console.log((lookX % 180) + ' / ' + lookY);
}

function parse(data) {
  var packetId = data.substring(2,6);
  if(packetId == "0011") {
    if (0) {
      console.log("Client: " + data);
      console.log('');
      //6-21
      parseMovement(data);
    }
  } else if(packetId == "0012") {
    if(0) {
      console.log("Client: " + data);
      console.log('');

      parseMovement(data);
      parseLooking(data.substring(48));
    }
  }else if(packetId == "0013") {
    if(0) {
      console.log("Client: " + data);
      console.log('');

        parseMovement(data);
    }
  }else if(packetId == "0003") {
    if(0)
    {
      console.log("Client: " + data);
      var mlength = parseInt(data.substring(6,8), 16);
      var message = hex2String(data .substring(8));

      if(message.substring(0,2) == "tp") {
        var coords = message.substring(2).split(' ');
        var string  = "hello";
        var response = hexEncode(string);
        response = (string.length).toString(16) + response;
        if(string.length < 10) {
          response = "0" + response;
        }
        //console.log(response);
        response = "0003" + response;
        response = (response.length/2).toString(16) + response;
        if(response.length/2 < 10) {
          response = "0" + response;
        }
        //console.log(response);
        return response;
      }

      console.log("Message[" + mlength + "]: " + message);
    }
  }else if(packetId == "001b") {
    if(1) {
      if(data[9] == '0') {
        console.log("Client has started crouching.");
      }
      else if(data[9] == '1') {
        console.log("Client has stopped crouching.");
      }
      else if(data[9] == '3') {
        console.log("Client has started sprinting.");
      }
      else if(data[9] == '4') {
        console.log("Client has stopped sprinting.");
      }
      else {
        console.log("Crouch: Unknown Value. Should Check.");
      }
    }
    console.log("Client: " + data);
  }
  else {
    console.log(data.substring(0, 6));
    console.log("Client: " + data);
    console.log('');

  }
}
