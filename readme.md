# Minecraft Server Proxy (NodeJS)
Created for 1.15

I created this to learn a bit more about how TCP and Network Communications work.
Keep in mind when looking this over, I am new to this and I am learning still.
Although that being said, I am open to any suggestions or information you may have.

I will be treating this almost like a blog while I learn.

## Setup.
Make sure you have NodeJS installed.

1. First you need to download a Minecraft server from their site.
Give it a quick run to it produces the Eula and server properties.

2. In the server properties make sure to disable online mode. This is needed.
As I am not advanced enough to deal with encryption, this disables encryption for the server. Be safe though as hackers can log in with any username and things are not verified or encrypted any more.

3. Set the query.port=25555 and server-port=25555.
This can be almost anything you want I just used these because it is close to the 25565 default we will be using for the proxy.

4. Configure the IP's for in the server.js
If you are not hosting both off of one machine make sure to set the right IP's in the server file.

5. Tweak the settings.
Change the filters for what you want to see. Feel free to change how things operate, if you have a better way send it my way.

6. Run both servers.
- Type "node server.js" in a command line that is in the current directory.
- Then run the Minecraft server.

7. Launch MC and connect to the proxy.
Make sure when you enter the IP in the multiplayer area that it is the one set for the proxy and not the actual server.

## Process
- I started by using the 'net' package from NodeJS to create a simple TCP server that could be connected to.

- After verifying that it works, I then used a simple net socket and attach it to the client socket that was created when connecting to the tcp server

- The net socket connected to the Minecraft server and would also have a link to the client that created it.

- I started by just forwarding the data from the client to the server, then from the server back to the client.

- Now that it was working and I could connect to the server through the proxy I started by converting the data they were sending to JS hex using the Node Buffer class and just logging it. I would print "Client: hexData" and "Server: hexData" for each of them so it could be identified where the information was coming from.

- There was a lot of information. So I wrote some basic filtering. 0 for Client, 1 for Server, 2 for both.

- Now I mainly focused on the client since it had the most understandable information.

- I started by making sure the world in my server was simple, and clean. No mobs, flat, no animals.

- This made sure that very little was coming through the proxy.

- I started by walking. Just using WASD to see how it reacts. I noticed a lot of common packets. So I took a bunch of data and pasted  them in a comment.

- I broke them apart into similar sections and found out that the first few bytes were the same and so was the last byte of data.

- After a ton of looking around online and my own fighting with it. I found out a few things. The first byte, is the length of the packet. The next 2 bytes were the packetID (each action has its own) and the rest after was generally just some data.

- I will put my findings in charts down below.

- So while working with this data. I started to write a parser that would check the packetId and do different actions based on it.

- I started simple and just looked at the data. It was obvious after a while of testing that when moving left and right, one sections changed. When moving forwards and backwards another section changed, and when jumping (changing elevation) another section changed

- So I started there. I knew that each section was each of the coords. But how were they formatted? Well that took a while. So each coordinate got 8 bytes. (2 hex numbers per byte so 16 hex numbers/letters) but really how was the data formatted. I tried a lot. Converting right to decimal, trying to convert to floats. When I finally came across [this site](https://gregstoll.com/~gregstoll/floattohex/), I plugged my numbers in the double section and it popped out my Coords. I was amazed.

- So I spent a few hours trying to find a function that would help me convert to doubles but I could not get one to work. So I rolled up my sleeves and did it my self. With the information from that site (they have a lovely calculations section) and my knowledge from school I taught my self how to convert from hex to doubles and floating point numbers.

- I managed to parse the hex data coming from the client and could log my coords to the console. This was the start. It felt finally so good to actually see results rather than just forwarding information.

- Now I am not going to go into much detail for the rest as I did this one because it is all a similar process. I also will put each of my findings on packets of information down below so you can see how they are broken up.

- So after that I did practically the same process for moving the mouse. Except instead of doubles they were floats and took a  whole  other calculate but thankfully that site saved my butt.

- Next up was message parsing. This one has been cool. So it has the same structure as most of the packets (while uncompressed) and goes as follows packetSize packetID(0003) mesageLength message. This one was a little more tough to break down because each message is almost unique based on the size.

- So I spent some time doing some tests, I would send a single letter(of many letters) and would compare to a couple(of the letters) sent.
- I managed to break it down and parse out the actual message. Now this is where some more fun came in.

- I decided I want to make my own "Command" system. Since I can parse what the user types. Why not try to manipulate some packets when they type specific things. So As of right now. I can parse their message and compare it to another string, like tp (teleport) or something similar.

- Now I managed to reverse the process (taking a string and converting it to the same format as a packet). So when the user types "tp" I instead send a "hello" message.

- My goal is to be able to send packets like movements and placing things without the need to actually move or place in game. I think it would be neat.

- This is how far I have gotten so far. But this will continue! There is still much for me to learn and play with. Keep checking back and I will update this with my findings for packets and my process. Thanks for stopping by!

## Findings
These are all examples of each type of packet. They are not gonna always be exactly what you see here. Lengths and information change.
All packets seem to start with the length of the packet. Then some packet ID. Then the actual data.

### [Client To Server]

### Message:
When a client sends a message. The first byte is the length of the packet. The next 2 bytes are the packet id (0003 means sending a message).
Then the next byte is the length of the message (if the length is greater than one byte can hold, more than 255 characters, it uses the compressed packet system which I have not figured out yet.) Then comes the actual message where each byte is a character.

|Packet Length | Packet ID | Message Length | Message        |
|--------------|-----------|----------------|----------------|
|08            |0003       |05              |6161616161      |

### Position:
This is sent when you are moving around using WASD. The X Y Z coordinates are sent as doubles until they get to really large numbers. The last byte keeps track of if you are on the ground. 00 if not and 01 if you are.

|Packet Length | Packet ID | X (Double)     | Y (Double)     | Z (Double)     | On Ground |
|--------------|-----------|----------------|----------------|----------------|-----------|
|1b            |0011       |4065478211b66e84|4015024197a953aa|c062171258865939|00         |

### Movement:
This type of packet is sent when you are moving and looking using the mouse. XYZ are saved as doubles. The X looking direction, and y looking direction are saved as floats. The only thing is that Look X and Look Y are bound in game to -180 --> 180 and -90 --> 90 respectively but for the look X it is sent as a number that always grows in each direction, so I have to figure out the math for how to detect if changing direction from looking left to right. For now I just mod the number by 180 to keep it in the same range, kinda.

|Packet Length | Packet ID | X (Double)     | Y (Double)     | Z (Double)     | Look_X (Float) | Look_Y (Float) | On Ground |
|--------------|-----------|----------------|----------------|----------------|----------------|----------------|-----------|
|23            |0012       |4065478211b66e84|4015024197a953aa|c062171258865939|c0621712        |58865939        |00         |

### Looking:
This is the packet sent when moving the mouse (looking around). Stores both the lookX and lookY as Floats.

|Packet Length | Packet ID | Look_X (Float) | Look_Y (Float) | On Ground |
|--------------|-----------|----------------|----------------|-----------|
|0b            |0013       |43f0d30b        |425b999e        | 01        |

### Movement Modifiers:
This is a packet sent when there is an effect for movement. The last 2 bytes keep track of the modifier. This keeps track of if you are crouching (0000), stopped crouching (0100), are sprinting (0300), and stopped sprinting(0400). There are other ones but I have not found out how to consistently get them to show up. There is a byte in the middle that changes on occasion and I am not sure what it means yet but when I find out I will update.

|Packet Length | Packet ID | ?  | Modifier |
|--------------|-----------|----|----------|
|05            |001b       | 01 | 0000     |
