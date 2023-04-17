const axios = require('axios');
const { WebhookClient, MessageEmbed } = require('discord.js');
const schedule = require('node-schedule');
require('dotenv').config();


const webhookURL = process.env.WEBHOOK_URL
const roleId = process.env.roleID;
const webhookClient = new WebhookClient({ url: webhookURL });

async function checkPoolNumber() {
    try {
        const response = await axios.get('https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/num_pools');
        return response.data.num_pools;
    } catch (error) {
        console.error('Erreur lors de la récupération du numéro de pool:', error);
    }
}

async function getPoolInfo(poolNumber) {
    try {
        const response = await axios.get(`https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools/${poolNumber}`);
        return response.data.pool;
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de pool:', error);
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
        console.error('Erreur lors de l\'envoi du message Discord:', error);
    }
}
(async () => {
    let lastPoolNumber = await checkPoolNumber();;
    console.log('Démarrage du programme, dernier numéro de pool:', lastPoolNumber);

    schedule.scheduleJob('*/1 * * * *', async () => {
    const currentPoolNumber = await checkPoolNumber();

    if (currentPoolNumber !== lastPoolNumber) {
        console.log(`Le numéro de pool a changé de ${lastPoolNumber} à ${currentPoolNumber}`);
        const poolInfo = await getPoolInfo(currentPoolNumber);
        await sendDiscordMessage(poolInfo);

        lastPoolNumber = currentPoolNumber;
    }
      });
})();
