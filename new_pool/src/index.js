const axios = require('axios');
const fs = require('fs');
const { WebhookClient, MessageEmbed } = require('discord.js');
const schedule = require('node-schedule');
require('dotenv').config();

const webhookURL = process.env.WEBHOOK_URL
const roleId = process.env.roleID;
const webhookClient = new WebhookClient({ url: webhookURL });

function logMessage(type, message) {
    if (type !== 'error' && type !== 'info') {
        type = info;
    }
    const date = new Date();
    const timestamp = date.toLocaleString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
    fs.appendFile('log.txt', logMessage, (err) => {
        if (err) {
            console.error("Error:", err);
        }
    });
}

async function checkPoolNumber() {
    try {
        const response = await axios.get('https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/num_pools');
        return response.data.num_pools;
    } catch (error) {
        logMessage('error', `pool number cannot be read`);
    }
}

async function getPoolInfo(poolNumber) {
    try {
        const response = await axios.get(`https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools/${poolNumber}`);
        return response.data.pool;
    } catch (error) {
        logMessage('error', `pool information cannot be read`);
    }
}

async function sendDiscordMessage(poolInfo) {
    try {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Nouvelle pool disponible !`)
            .setURL(`https://frontier.osmosis.zone/pool/${poolInfo.id}`)
            .addFields(
                {
                    name: 'Numéro de la pool :',
                    value: `${poolInfo.id}`,
                    inline: false
                },
                {
                    name: 'Adresse de la pool :',
                    value: `[${poolInfo.address}](https://www.mintscan.io/osmosis/account/${poolInfo.address})`,
                    inline: false
                }
            );
        await webhookClient.send({
            content: `<@&${roleId}>`,
            embeds: [embed],
        });
    } catch (error) {
        logMessage('error', `message not send to discord`);
    }
}
(async () => {
    let lastPoolNumber = await checkPoolNumber();
    logMessage('info', `the program has started`);
    schedule.scheduleJob('*/1 * * * *', async () => {
        const currentPoolNumber = await checkPoolNumber();
        if (currentPoolNumber == undefined) {
            logMessage('error', 'pool number is undefined');
        } else if (currentPoolNumber !== lastPoolNumber) {
            logMessage('info', `pool number has been change for ${lastPoolNumber}`);
            console.log(`Le numéro de pool a changé de ${lastPoolNumber} à ${currentPoolNumber}`);
            const poolInfo = await getPoolInfo(currentPoolNumber);
            await sendDiscordMessage(poolInfo);
            lastPoolNumber = currentPoolNumber;
        }
    });
})();
