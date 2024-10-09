import axios from 'axios';
import fs from 'fs';

const TG_TOKEN = '6387629342:AAFRPGYusy4vz8Ok1msaytA0457iQMRvHLA';
const CHAT_ID = '-1001830699077';
const LOG_FILE = 'members.log';

async function getChatMemberCount() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getChatMemberCount?chat_id=${CHAT_ID}`);
    return response.data.result;
  } catch (error) {
    console.error('Ошибка при получении количества участников:', error.message);
    process.exit(1);
  }
}

async function getChatMember(userId) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=${userId}`);
    return response.data.result;
  } catch (error) {
    console.error(`Ошибка при получении информации о пользователе ${userId}:`, error.message);
    return null;
  }
}

async function logMember(member) {
  if (member && member.user) {
    const logEntry = `ID: ${member.user.id}, Имя: ${member.user.first_name} ${member.user.last_name || ''} (Username: ${member.user.username || 'нет'})\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  }
}

async function getAllMembers() {
  const memberCount = await getChatMemberCount();
  console.log(`Всего участников в группе: ${memberCount}`);

  for (let i = 1; i <= memberCount; i++) {
    const member = await getChatMember(i);
    if (member) {
      await logMember(member);
    }
  }

  console.log(`Все участники сохранены в файл ${LOG_FILE}`);
}

getAllMembers();