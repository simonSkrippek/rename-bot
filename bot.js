require('http').createServer().listen(3000);

const Discord = require("discord.js");
const bot = new Discord.Client();

const PREFIX = '!';
var commandChannels = null;
var managedChannels = null;

bot.on('ready', () =>{
    console.log('bot is online');
})

bot.on('message', message => {
    if (message.content[0] == PREFIX){

        var channel = null;

        //split message into phrases
        let args = message.content.substring(PREFIX.length).split(" ");
        const command = args[0];

        //is current channel a command channel?
        var isCommandChannel = false;
        if (commandChannels != null){            
            for (var i = 0; i < commandChannels.length; i++){
                if (commandChannels[i] == message.channel) isCommandChannel = true;
            }
        }

        var commandAnswered = false;

        //commands that should work regardless of where they are issued
        switch(command){
            case 'ping':
                if (!checkUserPermissions(message.member, 0)) 
                {
                    throwException('InsufficientPermission', message);
                    break;
                }
                message.channel.send('pong')
                break;
            case 'help':
                if (!checkUserPermissions(message.member, 1)) 
                {
                    throwException('InsufficientPermission', message);
                    break;
                }
                displayHelpMessage(message);
                break;

            case 'showCommandChannels':                
                if (!checkUserPermissions(message.member, 1)) 
                {
                    throwException('InsufficientPermission', message);
                    break;
                }
                var output = 'command channels are:'
                if (commandChannels) 
                {
                    commandChannels.forEach(element => 
                    {
                        if (element) output += '\n'+ element.toString();
                    });
                }
                else 
                {
                    output += '\nnone';
                }
                message.channel.send(output);
                commandAnswered = true;
                break;

            case 'showManagedChannels':                
                if (!checkUserPermissions(message.member, 1)) 
                {
                    throwException('InsufficientPermission', message);
                    break;
                }
                var output = 'managed channels are:'
                if (managedChannels) 
                {
                    managedChannels.forEach(element => 
                    {
                        if (element) output += '\n'+ element.toString();
                    });
                }
                else 
                {
                    output += '\nnone';
                }
                message.channel.send(output);
                commandAnswered = true;
                break;
        }

        //if command not already handled
        if (!commandAnswered)
        {
            //commands that should only work in Command channels
            if (isCommandChannel)
            {
                switch(command)
                {
                    case 'addCommandChannel':                        
                        throwException('AlreadyCommandChannel', message);;
                        break;

                    case 'addChannelToManage':
                        if (!checkUserPermissions(message.member, 0)) 
                        {
                            throwException('InsufficientPermission', message);
                            break;
                        }
                        channel = findChannelByName(message.guild, args[1]);
                        //return if no channel was mentioned
                        if (!channel)
                        {                            
                            throwException('InvalidArguments', message);
                            break;
                        }
                        //else add channel to managedChannels
                        if (managedChannels == null)
                        {
                            managedChannels = [channel, null]
                        }
                        else
                        {
                            managedChannels[length - 1] = channel;
                            managedChannels[length] = null;
                        }
                        message.channel.send("added this channel to managedChannels list");
                        break;

                    case 'changeChannelName':
                        if (!checkUserPermissions(message.member, 1))
                        {
                            throwException('InsufficientPermission', message);
                            break;
                        }
                        channel = findChannelByName(message.guild, args[1]);
                        if (isManagedChannel(channel))
                        {
                            if (args.length == 3){
                                const newChannelName = formatChannelName(args, 2);
                                channel.setName(newChannelName);
                                message.channel.send('channel name changed to ' + channel.toString());
                            }
                            else 
                            {
                                throwException('InvalidArguments', message);
                            }
                        }
                        else
                        {
                            throwException('NotAManagedChannel', message);
                        }
                        break;

                    default:
                        throwException('CommandUnknown', message);
                        return;
                }
            }        
            //commands that should only work in no-Command channels
            else 
            {
                switch(command)
                {                
                    case 'addCommandChannel':
                        if (!checkUserPermissions(message.member, 0)) 
                        {
                            throwException('InsufficientPermission', message);
                            break;
                        }
                        if (commandChannels == null)
                        {
                            commandChannels = [message.channel, null]
                        }
                        else
                        {
                            commandChannels[length - 1] = message.channel;
                            commandChannels[length] = null;
                        }
                        message.channel.send("added this channel to commandChannel list");
                        break;
                }
            }
        }
    }
})

function findChannelByName(server, name)
{
    var channel = null;

    if (name != null)
    {
        console.log('passed name = ' + name.toString())

        if (server != null)
        {
            const serverChannelArray = server.channels.cache;
            serverChannelArray.find(element => {
                    console.log('found: ' + element.name.toString() + ', comparing to: ' + name.toString() + ', '+ (element.name.toString() === name.toString()).toString());
                    const bool = element.name.toString() === name.toString();
                    if (bool) channel = element;
                    return bool;
                });
        }
    }

    if(channel) console.log(channel.toString());
    else console.log('null');

    return channel;
}

function isManagedChannel(channel)
{   
    if(channel && managedChannels != null)
    {
        for(var i = 0; i < managedChannels.length; i ++)
        {
            if (managedChannels[i] == channel) return true;
        }
    }
    return false;
}

function formatChannelName(args, startIndex){
    var channelName = args[startIndex];
    for(var i = startIndex + 1; i < args.length; i++)
    {
        channelName += '-' + args[i];
    }
    return channelName;
}

//requiredPermission: 0 is admin/allowed to edit channels, 1 is everyones
function checkUserPermissions(member, requiredPermission)
{
    var hasPermission;
    if (requiredPermission == 0) hasPermission = member.roles.highest.permissions.any('MANAGE_CHANNELS');
    else hasPermission =  member.roles.highest.permissions.any('MENTION_EVERYONE')
    return hasPermission;
}

function throwException(exception, message)
{
    var errorMessage;
    switch(exception)
    {
        case 'InsufficientPermission':
            errorMessage = 'you do not have sufficient permissions to execute this command';
            break;

        case 'CommandUnknown':
            errorMessage = 'the command you entered was not recognized';
            break;

        case 'NotAManagedChannel':
            errorMessage = 'the channel you tried to perform operations on is not a managed channel';
            break;

        case 'AlreadyCommandChannel':
            errorMessage = 'this channel is already a command channel. you can not make it a command channel again';
            break;

        case 'InvalidArguments':
            errorMessage = 'the arguments you tried to pass do not match the command';
            break;

        default:
            errorMessage = 'error';
            break;
    }
    errorMessage += '\n     type !help for help';
    message.reply(errorMessage);
}

function displayHelpMessage(message)
{
    const helpMessageText = 
    'here is help!\n' +
    '\n' +
    '**universal commands**\n' +
    '!help  to see this message\n' +
    '!ping  to get a response: \'pong\'  to check if the bot is working\n' +
    '!showCommandChannels   to see a list of all current command channels (channels in which commands should be typed)\n' +
    '!showManagedChannels   to see a list of all current managed channels (channels the commands you type apply to)\n' +
    '\n' +
    '**commands for channels that are _not_ command channels** \n'+
    '!addCommandChannel     to add the current channel as a new command channel\n' +
    '\n' +
    '**commands for channels that _are_ command channels** \n' +
    '!addChannelToManage <currentChannelName>   to add a new channel to the managed channels list\n' +
    '!changeChannelName <currentChannelName> <newChannelName>   to rename a managed channel\n' +
    '\n'+
    '\n'+
    'any more questions, scream for an admin';

    message.reply(helpMessageText);
}

bot.login(process.env.BOT_TOKEN);
