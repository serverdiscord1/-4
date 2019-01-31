const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();

/*
package
npm install discord.js
npm install ytdl-core
npm install get-youtube-id
npm install youtube-info
npm install simple-youtube-api
npm install queue
npm i ffmpeg
*/

client.on('ready', () => {
       console.log(`----------------`);
     console.log(`ON ${client.guilds.size} Servers '     Script By : Dark7oveRR ' `);
   console.log(`----------------`);
 console.log(`Logged in as ${client.user.tag}!`);
 client.user.setGame(`Darven !!!!play`,"https://www.twitch.tv/dark7overr")
 client.user.setStatus("dnd")
});
const prefix = "!!!!"
client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(prefix)) return undefined;
	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);
	let command = msg.content.toLowerCase().split(" ")[0];
	command = command.slice(prefix.length)
	if (command === `play`) {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('You need to have a voice mail.');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.channel.send('I have no authority to speak with the Rooms');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('I have no authority to speak with the rooms');
		}

		if (!permissions.has('EMBED_LINKS')) {
			return msg.channel.sendMessage("**You must connect to the array `EMBED LINKS`I have**")
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); 
				await handleVideo(video2, msg, voiceChannel, true);
			}
			return msg.channel.send(` **${playlist.title}** Has been added to the playlist`);
		} else {
			try {

				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					const embed1 = new Discord.RichEmbed()
			        .setDescription(`**Please enter your section number** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)
					
					msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)})
					
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('No soundtrack selected');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send(':X: No search results available');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === `skip`) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not an audio podcast .');
		if (!serverQueue) return msg.channel.send('No clip available');
		serverQueue.connection.dispatcher.end('No clip available');
		return undefined;
	} else if (command === `stop`) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not an audio podcast.');
		if (!serverQueue) return msg.channel.send('There is no section to be aware of');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('This section has been disabled');
		return undefined;
	} else if (command === `vols`) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not an audio podcast .');
		if (!serverQueue) return msg.channel.send('Nothing works.');
		if (!args[1]) return msg.channel.send(`:loud_sound: Volume level**${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
		return msg.channel.send(`:speaker: Sound changed to **${args[1]}**`);
	} else if (command === `np`) {
		if (!serverQueue) return msg.channel.send('There is nothing present in the work.');
		const embedNP = new Discord.RichEmbed()
	.setDescription(`:notes: Now it is running : **${serverQueue.songs[0].title}**`)
		return msg.channel.sendEmbed(embedNP);
	} else if (command === `queue`) {
		if (!serverQueue) return msg.channel.send('There is nothing present in the work.');
		let index = 0;
		const embedqu = new Discord.RichEmbed()
.setDescription(`**Songs Queue**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**Now it is running** ${serverQueue.songs[0].title}`)
		return msg.channel.sendEmbed(embedqu);
	} else if (command === `pause`) {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('Music paused!');
		}
		return msg.channel.send('There is nothing present in the work.');
	} else if (command === "resume") {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('Music resumed for you!');
		}
		return msg.channel.send('There is nothing present at work.');
	}

	return undefined;
});
async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);
		queueConstruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`I can not enter this rum${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(` **${song.title}** The song has been added to the menu!`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);
	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`Start : **${song.title}**`);
}

client.on('message', message => {
    var prefix = "/";

      if (!message.content.startsWith(prefix)) return;
      var args = message.content.split(' ').slice(1);
      var argresult = args.join(' ');
      if (message.author.id == 411564557027508235) return;


    if (message.content.startsWith(prefix + 'playing')) {
    if (message.author.id !== '350780696203231242') return message.reply('** This is just for the pot owner and thank you **')
    client.user.setGame(argresult);
        message.channel.sendMessage(`**${argresult}** : Status changed`)
    } else


    if (message.content.startsWith(prefix + 'stream')) {
    if (message.author.id !== '341617957409128460') return message.reply('** This is just for the pot owner and thank you **')
    client.user.setGame(argresult, "http://twitch.tv/dark7overr");
        message.channel.sendMessage(`**${argresult}** :Status changed to streaming`)
    } else

    if (message.content.startsWith(prefix + 'setname')) {
    if (message.author.id !== '341617957409128460') return message.reply('** This is just for the pot owner and thank you **')
      client.user.setUsername(argresult).then
          message.channel.sendMessage(`**${argresult}** : Status changed the name`)
      return message.reply("**You can only change the name after two hours**");
    } else

    if (message.content.startsWith(prefix + 'setavatar')) {
    if (message.author.id !== '341617957409128460') return message.reply('** This is just for the pot owner and thank you **')
    client.user.setAvatar(argresult);
        message.channel.sendMessage(`**${argresult}** : Status changed picture the bot`);
    }



     });


client.on('message', message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  if (message.content === '*join') {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voiceChannel) {
      message.member.voiceChannel.join()
        .then(connection => { // Connection is an instance of VoiceConnection
          message.reply('I have successfully connected to the channel!');
        })
        .catch(console.log);
    } else {
    }
  }
})




   
client.login(process.env.BOT_TOKEN);
