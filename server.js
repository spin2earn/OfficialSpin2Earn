const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const crypto = require('crypto');
const {Telegraf} = require('telegraf')
require('dotenv').config();

const app = express();
const token = process.env.TOKEN;
const bot1 = new Telegraf(process.env.TOKEN)
const bot = new TelegramBot(token, { polling: true });
app.use(express.json());

const WEBAPP_URL = process.env.WEBAPP;
const PORT = process.env.PORT || 3000;
const SALT = process.env.SALT || 'your-salt-value'; // Define a salt for hashing
const MongoDBURL = process.env.MONGODB_URL || 'mongodb://localhost:27017/telebot';
const CHANNEL_ID = '@spintestdemo';


// MongoDB connection
mongoose.connect(MongoDBURL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// User schema
const userSchema = new mongoose.Schema({
  userId: Number,
  username: String,
  amount: { type: Number, default: 0 },
  referralUrl: String,
  referrals: [String] // Store only Telegram usernames
});

// User model
const User = mongoose.model('User', userSchema);

// Function to generate SHA-1 hash
function generateHash(text) {
  const hash = crypto.createHash('sha1');
  hash.update(text + SALT);
  return hash.digest('hex').substring(0, 20); // Use the first 20 characters of the hash
}

// Generate a unique referral URL for a user
function generateReferralUrl(userId) {
  const hash = generateHash(userId.toString());
  return `https://t.me/${process.env.BOT_USERNAME}?start=${hash}`;
}
// Set up the menu button globally
bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: 'Open Game',
    web_app: { url: WEBAPP_URL }
  }
}).catch((error) => {
  console.error('Error setting menu button:', error);
});

// Function to check if a user is in a specific channel
async function isUserInChannel(userId) {
  try {
    const chatMember = await bot1.telegram.getChatMember(CHANNEL_ID, userId);
    const isMember = chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';

    return isMember;
  } catch (error) {
    console.error('Error checking user in channel:', error);
    return false;
  }
}


// Handle /start command and referrals
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.first_name;
  const referralCode = msg.text.split(' ')[1]; // Extract referral code if present
  console.log(chatId);
  var test = bot1.telegram.getChatMember
  bot.getChatMember(chatId,msg.chat.id)

  if(referralCode){
    console.log(`Received referral code: ${referralCode}`);
  }

  // Check if the user already exists in the database
  let user = await User.findOne({ userId: chatId });

  if (!user) {
    // Create a new user entry if not found
    user = new User({
      userId: chatId,
      username: username,
      referralUrl: generateReferralUrl(chatId)
    });

    await user.save();
    console.log(`User ${username} saved to the database.`);

    // If the user joined via a referral link, update the referrer's record
    if (referralCode) {
      try {
        const referrer = await User.findOne({ referralUrl: `https://t.me/${process.env.BOT_USERNAME}?start=${referralCode}` });
        if (referrer) {
          console.log(`Referrer found: ${referrer.username}`);
          
          // Add the new user's username to the referrer's referrals array
          referrer.referrals.push(username); // Store only the new user's username
          await referrer.save();
          console.log(`User ${username} referred by ${referrer.username}. Referrals updated: ${referrer.referrals}`);
        } else {
          console.log('Referrer not found');
        }
      } catch (error) {
        console.error('Error processing referral:', error);
      }
    }
  }

  // Send a message with a WebApp button
  bot.sendMessage(chatId, 'Welcome! Click the button below to open the WebApp:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            type:'web_app',
            text: 'Open Game',
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    }
  }).catch((error) => {
    console.error('Error sending message with WebApp button:', error);
  });
});


// New route to check if a user is in the channel
app.post('/checkUser', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log(userId);
    const isMember = await isUserInChannel(userId);
    if (isMember) {
      return res.status(200).json({ message: 'User is a member of the channel' });
    } else {
      return res.status(200).json({ message: 'User is NOT a member of the channel' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
