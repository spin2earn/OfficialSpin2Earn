const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { Telegraf } = require('telegraf');
require('dotenv').config();
const path = require("path");
const cron = require('node-cron')

const app = express();
const bot1 = new Telegraf(process.env.TOKEN);
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'views/')));
app.set('view engine', 'ejs');

const WEBAPP_URL = process.env.WEBAPP;
const PORT = 3000;
const SALT = process.env.SALT || 'your-salt-value';
const MongoDBURL = process.env.MongoDBURL
const CHANNEL_ID = '@spintestdemo';


bot1.telegram.setWebhook(`${process.env.WEBAPP}/bot${process.env.TOKEN}`);

app.use(bot1.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

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
  eCoins: { type: Number , default: 0 },
  spinsLeft: {type: Number, default: 3 },
  referralUrl: String,
  referrals: [String],
  tasks: { 
    type: Map, 
    of: Boolean, 
    default: {} 
  }
});

// Redeem code schema
const redeemCodeSchema = new mongoose.Schema({
  code: String
});



// UPI Withdrawal Schema
const upiSchema = new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  upiId: String,
  email: String,
  amount: String,
});

// Bank Withdrawal Schema
const bankSchema = new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  ifsc: String,
  accountNumber: String,
  amount: String,
});

// User model
const User = mongoose.model('User', userSchema);
const RedeemCode = mongoose.model('RedeemCode', redeemCodeSchema);
const UPIWithdrawal = mongoose.model('UPIWithdrawal', upiSchema);
const BankWithdrawal = mongoose.model('BankWithdrawal', bankSchema);


// Function to generate SHA-1 hash
function generateHash(text) {
  const hash = crypto.createHash('sha1');
  hash.update(text + SALT);
  return hash.digest('hex').substring(0, 20);
}

// Generate a unique referral URL for a user
function generateReferralUrl(userId) {
  const hash = generateHash(userId.toString());
  return `https://t.me/${process.env.BOT_USERNAME}?start=${hash}`;
}

// Set up the menu button globally
// bot.setChatMenuButton({
//   menu_button: {
//     type: 'web_app',
//     text: 'Open Game',
//     web_app: { url: WEBAPP_URL }
//   }
// }).catch((error) => {
//   console.error('Error setting menu button:', error);
// });

bot1.telegram.setChatMenuButton({
  menu_button: {
        type: 'web_app',
        text: 'Open Game',
        web_app: { url: WEBAPP_URL }
      }
    }).catch((error) => {
      console.error('Error setting menu button:', error);
})

// Function to check if a user is in a specific channel
async function isUserInChannel(userId) {
  try {
    const chatMember = await bot1.telegram.getChatMember(CHANNEL_ID, userId);
    return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
  } catch (error) {
    console.error('Error checking user in channel:', error);
    return false;
  }
}



// Handle /start command and referrals
bot1.start(async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.first_name;
  const referralCode = msg.text.split(' ')[1];

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

    // Process referral if applicable
    if (referralCode) {
      try {
        const referrer = await User.findOne({ referralUrl: `https://t.me/${process.env.BOT_USERNAME}?start=${referralCode}` });
        if (referrer) {
          referrer.referrals.push(username);
          await referrer.save();
        }
      } catch (error) {
        console.error('Error processing referral:', error);
      }
    }
  }
 
  // Send a message with a WebApp button and pass the userId in the URL
  const webAppUrlWithUserId = `${WEBAPP_URL}?userId=${chatId}`;
  console.log(chatId);
  console.log(webAppUrlWithUserId.toString());
  
  msg.reply('Welcome! Click the button below to open the WebApp:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            type: 'web_app',
            text: 'Open Game',
            web_app: { url: webAppUrlWithUserId }
          }
        ]
      ]
    }
  }).catch((error) => {
    console.error('Error sending message with WebApp button:', error);
  });
});

bot1.launch();




// Route to check if a user is in the channel
app.post('/checkUser', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const isMember = await isUserInChannel(userId);
    if (isMember) {
      return res.status(200).json({ message: 'True' });
    } else {
      return res.status(200).json({ message: 'False' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/getFullDetails",async(req,res)=>{
  const { userId } = req.body;
  const user = await User.findOne({userId: userId})
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json({url: user.referralUrl, referralMembers: user.referrals})
})

// Fetch incomplete tasks using POST
app.post('/user/tasks/status', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).send('User not found');
    res.json(user.tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});



// Mark task as completed using POST
app.post('/user/tasks/completed', async (req, res) => {
  try {
    const { userId, taskName } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).send('User not found');

    user.tasks.set(taskName, true);
    await user.save();

    res.send('Task marked as completed');
  } catch (err) {
    res.status(500).send('Server error');
  }
});



// Main route
app.get("/", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const isMember = await isUserInChannel(userId);
    if (!isMember) {
      return res.status(403).json({ error: 'User is not a member of the channel' });
    }
    res.render('page', { userId });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/upiWithdrawal', async (req, res) => {
  try {
    const { userId, name, phone, upiId, email , amount} = req.body;
    console.log(req.body);
    
    // Validate required fields
    if (!userId || !name || !phone || !upiId || !email || !amount) {
      return res.status(400).json({ message: 'All fields are required for UPI withdrawal' });
    }

    // Create and save UPI withdrawal document
    const newUPIWithdrawal = new UPIWithdrawal({
      userId,
      name,
      phone,
      upiId,
      email,
      amount
    });
    await newUPIWithdrawal.save();
    let user = await User.findOne({ userId });
    if (user) {
      user.eCoins = 0;
      await user.save();
    }

    res.status(200).json({ message: 'UPI withdrawal request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting UPI withdrawal request' });
  }
});

app.post('/bankWithdrawal', async (req, res) => {
  try {
    const { userId, name, phone, ifsc, accountNumber , amount} = req.body;
    
    // Validate required fields
    if (!userId || !name || !phone || !ifsc || !accountNumber || !amount) {
      return res.status(400).json({ message: 'All fields are required for bank withdrawal' });
    }

    // Create and save bank withdrawal document
    const newBankWithdrawal = new BankWithdrawal({
      userId,
      name,
      phone,
      ifsc,
      accountNumber,
      amount,
    });
    await newBankWithdrawal.save();
    let user = await User.findOne({ userId });
    if (user) {
      user.eCoins = 0;
      await user.save();
    }

    res.status(200).json({ message: 'Bank withdrawal request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting bank withdrawal request' });
  }
});


// Route to check if a redeem code is valid
app.post("/checkRedeemCode", async (req, res) => {
  const { userRedeemCode } = req.body;

  if (!userRedeemCode) {
    return res.status(400).json({ error: 'userRedeemCode is required' });
  }

  try {
    const redeemCode = await RedeemCode.findOne({ code: userRedeemCode });

    if (!redeemCode) {
      return res.status(400).json({ error: 'Invalid Redeem Code' });
    } else {
      return res.status(200).json({ message: 'Valid Redeem Code' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to update eCoins when the wheel is spun
app.post('/updateEcoins', async (req, res) => {
  const { userId, eCoins , spinsLeft} = req.body;

  if (!userId || eCoins == null) {
    return res.status(400).json({ error: 'userId and eCoins are required' });
  }

  try {
    // Find the user in the database
    let user = await User.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user's eCoins
    user.eCoins += eCoins;
    user.spinsLeft = spinsLeft;
    await user.save();
    console.log("eCoins and spinsLeft updated successfully");
    
    return res.status(200).json({ message: 'eCoins and spinsLeft updated successfully', totalECoins: user.eCoins, spinsLeft: user.spinsLeft});
  } catch (error) {
    console.error('Error updating eCoins:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/getECoins', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ userId: userId });
    if (user) {
      res.status(200).json({ eCoins: user.eCoins , spinsLeft: user.spinsLeft});
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Cron job to ping the server every 12 minutes to keep it active
cron.schedule('*/12 * * * *', () => {
  console.log('Pinging the server to keep it active...');
  fetch(`http://localhost:${port}`)
      .then(res => res.text())
      .then(body => console.log(`Server response: ${body}`))
      .catch(err => console.error('Error pinging the server:', err));
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
