const wheel = document.querySelector('.wheel');
const spinBtn = document.querySelector('.spinBtn');
const resultPopup = document.querySelector('#result-popup');
const resultMessage = document.querySelector('#result-message');
const resultValue = document.querySelector('#result-value');
const spinCountElement = document.querySelector('#spin-count');
const noSpinsLeftPopup = document.querySelector('#no-spins-left');
const formError = document.querySelector('#form-error-message');
const formConfirmation = document.querySelector('#form-confirmation-message');
const linkText = document.querySelector('.the-link')
const copyBtn = document.querySelector('.referrals-link-btn')
// const shareBtn = document.querySelector('fa-share-nodes')
let spinsLeft; // Adjust this value for the actual spin count
let url;
let referrals;
let userData;
let totalCoins = 0;

let user = {
  spinCount: 0,     // Start at the first spin
  totalCoins: 0     // Initial total coins
};

const params = new URLSearchParams(window.location.search);
const userId = params.get('userId');

let confettiTimeout; // Variable to hold the confetti timeout ID
let frame; // Variable to manage the confetti animation frame
let timer; // Variable to hold the confetti timeout ID for adding confetti
let spinInProgress = false;


copyBtn.addEventListener("click",()=>{
  navigator.clipboard.writeText(url);
})

// shareBtn.addEventListener("click",()=>{
//   if(navigator.share){
//     navigator.share({
//       title: "Join!!!",
//       text: "This is the test text for sharing",
//       url: url
//       })
//   }
// })



//Fetching Happen here

async function fetchEcoins(userId) {
  try {
    const response = await fetch('/getEcoins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    totalCoins = data.eCoins; // Assuming the server returns an object with an eCoins property
    spinsLeft = data.spinsLeft;
    user.spinCount = data.spinsCount;
    user.totalCoins = data.eCoins;
    console.log("this is the data used in user: "+data.spinsCount);
    
    document.getElementById('spin-count').textContent = spinsLeft;
    updateTotalCoins();
  } catch (error) {
    console.error('Error fetching eCoins:', error);
  }
}

async function fetchUserFullDetails(userId) {
  try {
    const response = await fetch('/getFullDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    userData = await response.json();
    url = userData.url
    referrals = userData.referralMembers
    updateReferrals(referrals);
    // console.log(referrals);
    
    linkText.innerHTML = url
    // console.log("url: "+ url);
    
  } catch (error) {
    console.error('Error fetching:', error);
  }
}


async function sendEcoinsUpdate(userId, eCoins) {
  const data = {
    userId,
    eCoins: eCoins,
    spinsLeft: spinsLeft,
    spinsCount: user.spinCount
  };
  console.log("Data of coins sending with spinCount: ",data);
  
  try {
    const response = await fetch('/updateEcoins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    // console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

function updateReferrals(referrals) {
  const referralsContainer = document.querySelector('.friends-grid');
  referralsContainer.innerHTML = ''; // Clear existing content

  referrals.forEach(name => {
      const friendElement = document.createElement('p');
      friendElement.className = 'friend-name';
      friendElement.textContent = name;
      referralsContainer.appendChild(friendElement);
  });

  // Update the number of referrals
  document.querySelector('.no-of-referrals').textContent = `${referrals.length} Referrals`;
}

//one of the main function which runs while loading the game
window.onload = function() {
  fetchEcoins(userId);
  fetchUserFullDetails(userId);
  // window.Telegrm.WebApp.ready();
};

function updateTotalCoins() {
  document.getElementById('total-coins').textContent = `Total Coins: ${totalCoins}`;
  document.getElementById('total-coins-value').textContent = totalCoins;
  updateWithdrawableBalance();
}




function generatePrizeAmount(user) {
  let spinCount = user.spinCount;
  let currentCoins = user.totalCoins;
  let prize = 0;

  if (spinCount === 1) {
    // First spin: Prize should be a random amount leaving room for the second spin to total 55000
    prize = Math.floor(Math.random() * (35000 - 25000 + 1)) + 25000;
  } else if (spinCount === 2) {
    // Second spin: Prize should bring total coins to around 45000 to 55000
    prize = Math.floor(Math.random() * (55000 - 45000 + 1)) + 45000 - currentCoins;
  } else if (spinCount === 3) {
    // Third spin: Prize should bring total coins to around 65000 to 70000
    prize = Math.floor(Math.random() * (70000 - 65000 + 1)) + 65000 - currentCoins;
  } else if (spinCount === 4) {
    prize = Math.floor(Math.random() * (5020 - 4950 + 1)) + 4950;
  } else if (spinCount === 5) {
    prize = Math.floor(Math.random() * (3020 - 2950 + 1)) + 2950;
  } else if (spinCount === 6 || spinCount === 7) {
    prize = Math.floor(Math.random() * (1520 - 1450 + 1)) + 1450;
  } else if (spinCount >= 8 && spinCount <= 10) {
    prize = Math.floor(Math.random() * (1030 - 990 + 1)) + 2950;
  } else {
    prize = Math.floor(Math.random() * (450 - 400 + 1)) + 400;
  }
  user.totalCoins += prize;
  user.spinCount++;

  return prize;
}


function spinWheel() {
  if (spinInProgress) return;
  spinInProgress = true;
  spinBtn.disabled = true;
  if (spinsLeft > 0) {
    const degree = Math.floor(3000 + Math.random() * 2000);
    wheel.style.transition = 'transform 5s ease-out';
    wheel.style.transform = `rotate(${degree}deg)`;
    spinsLeft--;
    spinCountElement.textContent = spinsLeft;
    setTimeout(() => showResult(degree), 5000); // Show result after 5s
    setTimeout(() => {
      wheel.style.transition = 'transform 0s ease';
      wheel.style.transform = 'rotate(0deg)';
      spinInProgress = false;
      spinBtn.disabled = false;
    }, 8400); // Reset wheel rotation after 7s
  } else {
    showNoSpinsLeft();
    spinInProgress = false;
    spinBtn.disabled = false;
  }
}

function showResult(degree) {
  const sections = 8;
  const sectionSize = 360 / sections;
  const wheelRotation = degree % 360;
  const sectionIndex = Math.floor((360 - wheelRotation + sectionSize / 2) / sectionSize) % sections;

  let prize = 0; // Initialize the prize variable

  switch (sectionIndex) {
    case 0:
      prize = generatePrizeAmount(user); // Calculate the prize
      totalCoins += prize;
      resultValue.textContent = `You won\n ${prize} coins`;
      break;
    case 1:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 2:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 3:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 4:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 5:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 6:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
    case 7:
      prize = generatePrizeAmount(user);
      totalCoins += prize;
      resultValue.textContent = `You won ${prize} coins`;
      break;
  }
  resultPopup.style.display = 'block';
  triggerConfetti(); // Call the confetti function
  setTimeout(() => {
    resultPopup.style.display = 'none';
    stopConfetti(); // Stop confetti when the popup disappears
  }, 3000); // Hide the popup after 3 seconds

  
  updateTotalCoins();
  sendEcoinsUpdate(userId, prize)
  updateWithdrawableBalance();
  
}


function showNoSpinsLeft() {
  noSpinsLeftPopup.style.display = 'block';
  setTimeout(() => {
    noSpinsLeftPopup.style.display = 'none';
    switchToFriendsTab();
  }, 1800); // Hide the popup after 1.8 seconds
}

function switchToFriendsTab() {
  navLinks.forEach(link => link.classList.remove('active')); // Remove active class from all links
  document.querySelector('a[href="#add-friend"]').classList.add('active'); // Add active class to the friends tab link
  tabs.forEach(tab => {
    tab.style.display = 'none';
  });
  document.querySelector('#add-friend').style.display = 'block'; // Display the friends tab
}

spinBtn.addEventListener('click', spinWheel);

// withdrawal section
const withdrawalMethodSelect = document.getElementById('withdrawal-method');
const upiForm = document.getElementById('upi-form');
const bankForm = document.getElementById('bank-form');

withdrawalMethodSelect.addEventListener('change', (e) => {
  const selectedMethod = e.target.value;
  if (selectedMethod === 'upi') {
    upiForm.style.display = 'block';
    bankForm.style.display = 'none';
  } else if (selectedMethod === 'bank') {
    upiForm.style.display = 'none';
    bankForm.style.display = 'block';
  }
});

// document.getElementById('nav-wallet-history').addEventListener('click', function(e) {
//   e.preventDefault();
//   navLinks.forEach(link => link.classList.remove('active')); // Remove 'active' from all links
//   this.classList.add('active');
//   const target = this.getAttribute('href');
//   tabs.forEach(tab => {
//     tab.style.display = 'none';
//   });
//   document.querySelector(target).style.display = 'block';
// });

function updateWithdrawableBalance() {
  const withdrawableBalance = totalCoins / 1000;
  // console.log(`Updating withdrawable balance: ${withdrawableBalance}`);
  const withdrawableValueElement = document.getElementById('withdrawable-value');
  withdrawableValueElement.textContent = `₹${withdrawableBalance.toFixed(2)}`;
}


// Get the withdraw button
const withdrawButton = document.querySelector('.Withdraw-btn');
// Add an event listener to the withdraw button
withdrawButton.addEventListener('click', async (e) => {
  e.preventDefault();

  const activeForm = document.querySelector('.withdrawal-form:not([style*="display: none"])');
  if (!activeForm) {
    console.error('No active form found');
    return;
  }

  const nameInput = activeForm.querySelector('#name');
  const phoneInput = activeForm.querySelector('#phone');

  let isValid = true;
  let errorMessage = '';
  let confirmationMessage = 'You Will Receive your money in 3-4 days';

  // Clear previous messages
  formError.style.display = 'none';
  formError.textContent = '';
  formConfirmation.style.display = 'none';
  formConfirmation.textContent = '';

  // Validate name
  if (!nameInput || nameInput.value.trim() === '') {
    isValid = false;
    errorMessage = 'Please enter your name';
  }

  // Validate phone
  if (isValid && (!phoneInput || phoneInput.value.trim() === '')) {
    isValid = false;
    errorMessage = 'Please enter your phone number';
  }

  const phoneNumberRegex = /^[7-9]\d{9}$/;
  if (isValid && !phoneNumberRegex.test(phoneInput.value)) {
    isValid = false;
    errorMessage = 'Invalid phone number';
  }

  if (isValid) {
    formConfirmation.style.display = 'block';
    formConfirmation.textContent = confirmationMessage;

    // Hide the confirmation message after 1800 milliseconds
    setTimeout(() => {
      formConfirmation.style.display = 'none';
      formConfirmation.textContent = '';
    }, 1800);

    let formData = {};

    if (activeForm.id === 'upi-form') {
      // UPI form validation
      const upiIdInput = activeForm.querySelector('#upi-id');
      const emailInput = activeForm.querySelector('#email');

      if (!upiIdInput || upiIdInput.value.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter your UPI ID';
      }

      const upiIdRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9._]+$/;
      if (isValid && !upiIdRegex.test(upiIdInput.value)) {
        isValid = false;
        errorMessage = 'Invalid UPI ID';
      }

      if (!emailInput || emailInput.value.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter your email';
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (isValid && !emailRegex.test(emailInput.value)) {
        isValid = false;
        errorMessage = 'Invalid email';
      }

      // Construct the JSON object for UPI form
      formData = {
        name: nameInput.value,
        phone: phoneInput.value,
        upiId: upiIdInput.value,
        email: emailInput.value,
        amount: totalCoins/1000,
        userId: userId // Assuming userId is already defined in your scope
      };
    } else if (activeForm.id === 'bank-form') {
      // Bank form validation
      const ifscInput = activeForm.querySelector('#ifsc');
      const accountNumberInput = activeForm.querySelector('#account-number');

      if (ifscInput.value.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter your IFSC code';
      }

      const ifscRegex = /^[A-Z]{4}0\d{6}$/;
      if (isValid && !ifscRegex.test(ifscInput.value)) {
        isValid = false;
        errorMessage = 'Invalid IFSC code';
      }

      if (!accountNumberInput || accountNumberInput.value.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter your account number';
      }

      // Construct the JSON object for Bank form
      formData = {
        name: nameInput.value,
        phone: phoneInput.value,
        ifsc: ifscInput.value,
        accountNumber: accountNumberInput.value,
        amount: totalCoins/1000,
        userId: userId // Assuming userId is already defined in your scope
      };
    }

    // Check minimum withdrawable balance
    if (isValid) {
      const withdrawableBalance = totalCoins / 1000;
      if (withdrawableBalance < 100) {
        isValid = false;
        errorMessage = 'Insufficient balance. Minimum requirement is 100Rs.';
      }
    }

    if (!isValid) {
      // Hide confirmation message and display error message
      formConfirmation.style.display = 'none';
      formError.style.display = 'block';
      formError.textContent = errorMessage;

      // Hide the error message after 1.8 seconds
      setTimeout(() => {
        formError.style.display = 'none';
        formError.textContent = '';
      }, 1800);
    } else {
      // Convert formData object to JSON string
      const jsonData = JSON.stringify(formData);

      // Determine the fetch URL based on the form ID
      const fetchUrl = activeForm.id === 'upi-form' ? '/upiWithdrawal' : '/bankWithdrawal';

      // console.log(jsonData);
      

      try {
        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: jsonData,
        });

        if (response.ok) {
          // Handle successful response

          fetchEcoins(userId);
          fetchUserFullDetails(userId);

          console.log('Form submitted successfully');
          activeForm.reset(); // Reset the form after submission
        } else {
          // Handle errors
          const errorResponse = await response.json();
          console.error('Form submission failed:', errorResponse.message);
          formError.style.display = 'block';
          formError.textContent = errorMessage;

          // Hide the popup after 1.8 seconds
          setTimeout(() => {
            formError.style.display = 'none';
            formError.textContent = '';
          }, 1800);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting your request. Please try again later.');
      }
    }
  }
});


//task tab

document.addEventListener('DOMContentLoaded', function() {
  // Set default active tab
  fetchTasks();
  document.getElementById('daily-tab').classList.add('active');
  showTasks('daily');
});


async function fetchTasks() {
  const response = await fetch('/user/tasks/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId })
  });

  const tasksCompleted = await response.json();
  updateTaskUI(tasksCompleted);
}


function updateTaskUI(tasksCompleted) {
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(taskItem => {
    const taskName = taskItem.id.replace(/-/g, ' ');

    // Check if the task is completed
    if (tasksCompleted[taskName] === true) {
      taskItem.classList.add('completed');
      setTimeout(() => {
        taskItem.classList.add('move-to-bottom', 'delay');
        setTimeout(() => {
          const tasksContainer = document.getElementById('tasks-container');
          tasksContainer.appendChild(taskItem);
          taskItem.classList.remove('move-to-bottom', 'delay');
        }, 1);
      }, 2);
    } else {
      taskItem.style.display = 'block'; // Show incomplete or unattempted tasks
    }
  });
}

function showTasks(type) {
  // Fetch the tasks' status after loading the tasks
  const dailyTab = document.getElementById('daily-tab');
  const weeklyTab = document.getElementById('weekly-tab');
  const tasksContainer = document.getElementById('tasks-container');

  dailyTab.classList.remove('active');
  weeklyTab.classList.remove('active');

  fetchTasks();

  if (type === 'daily') {
    dailyTab.classList.add('active');
    tasksContainer.innerHTML = generateTaskHTML('Join Telegram Channel', 1000, 'fa fa-telegram') +
                               generateTaskHTML('Subscribe Youtube Channel', 250, 'fa fa-youtube') +
                               generateTaskHTML('Watch Youtube Video', 150, 'fa fa-youtube') +
                               generateSpecialTaskHTML('Special Task 1', 5000, 'special-input-1', 'fa fa-trophy', '123456') +
                               generateSpecialTaskHTML('Special Task 2', 5000, 'special-input-2', 'fa fa-medal', '9999');
  } 
  else if (type === 'weekly') {
    weeklyTab.classList.add('active');
    tasksContainer.innerHTML = generateTaskHTML('Invite 10 friends', 7000, 'fa fa-people-pulling') +
                               generateTaskHTML('Invite 20 friends', 1500, 'fa fa-users');
  }
}

function generateTaskHTML(taskName, reward, icon) {
  return `
    <div class="task-item" id="${taskName.replace(/\s+/g, '-')}">
      <div class="task-icon">
        <i class="${icon}"></i>
      </div>
      <p>${taskName}</p>
      <p>Reward: ${reward} coins</p>
      <div class="task-buttons">
        <button class="go-button" onclick="goToTask('${taskName}')">Go</button>
        <button class="check-button" onclick="checkTask(this, ${reward})">Check</button>
      </div>
    </div>
  `;
}

function generateSpecialTaskHTML(taskName, reward, inputId, icon, keyCode) {
  return `
    <div class="task-item" id="${taskName.replace(/\s+/g, '-')}">
      <div class="task-icon">
        <i class="${icon}"></i>
      </div>
      <p>${taskName}</p>
      <p>Reward: ${reward} coins</p>
      <div class="task-buttons">
        <button class="go-button" onclick="goToTask('${taskName}')">Go</button>
        <input type="text" id="${inputId}" class="special-input" placeholder="Enter code">
        <button class="check-button" onclick="checkSpecialTask(this, document.getElementById('${inputId}').value)">Submit</button>
      </div>
    </div>
  `;
}

// Object to store the timestamp of when the "Go" button was clicked
const taskGoTimes = {};

function goToTask(taskName) {
  const taskLinks = {
    'Join Telegram Channel': 'https://t.me/spintestdemo',
    'Subscribe Youtube Channel': 'https://youtube.com/@spin2earn-rvm?si=m7r7G8zLSNU-Zv2T ',
    'Watch Youtube Video': 'https://youtu.be/SmRltCNkOQI?si=ruh9kBDTo9O-o9NC',
    'Special Task 1': 'https://link.vipurl.in/18e3vGa',
    'Special Task 2': 'https://link.vipurl.in/18e3vGa',
    // Add more tasks and their respective links here
  };

  const link = taskLinks[taskName];
  if (link) {
    // Record the time when "Go" was clicked
    taskGoTimes[taskName] = new Date().getTime();

    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank'; // Open in new tab

    // Append the anchor to the body
    document.body.appendChild(a);

    // Trigger the click event
    a.click();

    // Remove the anchor from the DOM
    document.body.removeChild(a);
  } else {
    console.error(`No link found for task: ${taskName}`);
  }
}

// Object to store task start times for the check process
const taskStartTimes = {};

async function checkTask(button, reward) {
  const taskItem = button.closest('.task-item');
  const taskName = taskItem.id.replace(/-/g, ' ');

  // Check if the "Go" button was clicked
  if (!taskGoTimes[taskName]) {
    alert('You need to start the task by clicking the "Go" button first.');
    return;
  }
  const currentTime = new Date().getTime();

  // Check if 5 minutes have passed since the "Go" button was clicked
  if (['Subscribe Youtube Channel', 'Watch Youtube Video'].includes(taskName)) {
    const elapsedTime = (currentTime - taskGoTimes[taskName]) / 1000; // time in seconds

    if (elapsedTime < 120) { // 2 minutes = 300 seconds
      alert('First do the task full. Please wait for 2 minutes before marking this task as complete.');
      return; // Exit if 5 minutes have not passed
    }
  }

  if (taskName === 'Join Telegram Channel') {
    // Check if the user is a member of the Telegram channel
    try {
      // console.log("Sending request to server to check the user in telegram channel!!!");
      const response = await fetch('/checkUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.message !== 'True') {
          alert('You must join the Telegram channel to complete this task.');
          return; // Exit the function if the user is not a member
        }
      } else {
        console.error('Error checking membership:', data.error);
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      return;
    }
  }

  // Mark the task as completed and update the UI
  taskItem.classList.add('completed');
  await updateTaskStatus(taskName);

  setTimeout(() => {
    taskItem.classList.add('move-to-bottom', 'delay');
    setTimeout(() => {
      const tasksContainer = document.getElementById('tasks-container');
      tasksContainer.appendChild(taskItem);
      taskItem.classList.remove('move-to-bottom', 'delay');
    }, 450);
  }, 230);
  claimReward(reward);
}

async function checkSpecialTask(button, inputValue) {
  const taskName = button.closest('.task-item').id.replace(/-/g, ' ');
  const data = JSON.stringify({ taskName, inputValue })
  // console.log(data);
  
  try {
    const response = await fetch('/checkSpecialTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskName, inputValue }),
    });

    const data = await response.json();

    if (response.ok) {
      const taskItem = button.closest('.task-item');
      taskItem.classList.add('completed');
      taskItem.style.display = 'none'; // Hide completed task

      await updateTaskStatus(taskName);
      
      setTimeout(() => {
        taskItem.classList.add('move-to-bottom', 'delay');
        setTimeout(() => {
          const tasksContainer = document.getElementById('tasks-container');
          tasksContainer.appendChild(taskItem);
          taskItem.classList.remove('move-to-bottom', 'delay');
        }, 1000);
      }, 500);

      claimReward(data.reward);
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while checking the task. Please try again later.');
  }
}

async function updateTaskStatus(taskName) {
  await fetch('/user/tasks/completed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId, taskName })
  });
}

function claimReward(reward) {
  totalCoins += reward;
  updateTotalCoins();
  sendEcoinsUpdate(userId, reward)
  updateWithdrawableBalance();
  // Disable task buttons and navigation links during the reward claim process
  disableTaskButtons();
  disableNavLinks();
  // Wait for few seconds before displaying the popup
  setTimeout(() => {
    // popup.style.display = 'block';
    // Create a new popup element
    const popup = document.createElement('div');
    popup.className = 'reward-popup';
    popup.innerHTML = `
      <img class="ecoin-spin" src="images/ecoin.png" alt="coins">
      <h2>Congratulations!</h2>
      <p>You have claimed a reward of ${reward} coins!</p>
    `;
    triggerConfetti();
    // Add the popup to the page
    document.body.appendChild(popup);
    // Close the popup after 5 seconds
    setTimeout(() => {
      popup.remove();
      stopConfetti();
      // Re-enable task buttons and navigation links after the reward is claimed and processed
      enableTaskButtons();
      enableNavLinks();
    }, 4500);
  }, 600);
}

function disableTaskButtons() {
  const taskButtons = document.querySelectorAll('.task-buttons button');
  taskButtons.forEach(button => button.disabled = true);
}

function enableTaskButtons() {
  const taskButtons = document.querySelectorAll('.task-buttons button');
  taskButtons.forEach(button => button.disabled = false);
}

// Disable navigation links by adding the "disable" class
function disableNavLinks() {
  const navLinks = document.querySelectorAll('.bottom-bar .nav-link');
  navLinks.forEach(link => {
    link.classList.add('disable');
  });
}

// Enable navigation links by removing the "disable" class
function enableNavLinks() {
  const navLinks = document.querySelectorAll('.bottom-bar .nav-link');
  navLinks.forEach(link => {
    link.classList.remove('disable');
  });
}

// Prevent navigation if the link has the "disable" class
document.querySelectorAll('.bottom-bar .nav-link').forEach(link => {
  link.addEventListener('click', function(event) {
    if (link.classList.contains('disable')) {
      event.preventDefault();  // Stop the navigation
    }
  });
});

// Navigation between sections
const navLinks = document.querySelectorAll('.bottom-bar .nav-link');
const tabs = document.querySelectorAll('.js-tab');

navLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    navLinks.forEach(link => link.classList.remove('active')); // Remove 'active' from all links
    this.classList.add('active');
    const target = this.getAttribute('href');
    tabs.forEach(tab => {
      tab.style.display = 'none';
    });
    document.querySelector(target).style.display = 'block';
  });
});

// Confetti function (or) result effects
function triggerConfetti() {
  'use strict';

  var random = Math.random
    , cos = Math.cos
    , sin = Math.sin
    , PI = Math.PI
    , PI2 = PI * 2
    , confetti = [];

  var particles = 10
    , spread = 40
    , sizeMin = 3
    , sizeMax = 12 - sizeMin
    , eccentricity = 10
    , deviation = 100
    , dxThetaMin = -.1
    , dxThetaMax = -dxThetaMin - dxThetaMin
    , dyMin = .13
    , dyMax = .18
    , dThetaMin = .4
    , dThetaMax = .7 - dThetaMin;

  var colorThemes = [
    function() {
      return color(200 * random()|0, 200 * random()|0, 200 * random()|0);
    }, function() {
      var black = 200 * random()|0; return color(200, black, black);
    }, function() {
      var black = 200 * random()|0; return color(black, 200, black);
    }, function() {
      var black = 200 * random()|0; return color(black, black, 200);
    }, function() {
      return color(200, 100, 200 * random()|0);
    }, function() {
      return color(200 * random()|0, 200, 200);
    }, function() {
      var black = 256 * random()|0; return color(black, black, black);
    }, function() {
      return colorThemes[random() < .5 ? 1 : 2]();
    }, function() {
      return colorThemes[random() < .5 ? 3 : 5]();
    }, function() {
      return colorThemes[random() < .5 ? 2 : 4]();
    }
  ];

  function color(r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function interpolation(a, b, t) {
    return (1-cos(PI*t))/2 * (b-a) + a;
  }

  var radius = 1/eccentricity, radius2 = radius+radius;

  function createPoisson() {
    var domain = [radius, 1-radius], measure = 1-radius2, spline = [0, 1];
    while (measure) {
      var dart = measure * random(), i, l, interval, a, b, c, d;

      for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
        a = domain[i], b = domain[i+1], interval = b-a;
        if (dart < measure+interval) {
          spline.push(dart += a-measure);
          break;
        }
        measure += interval;
      }
      c = dart-radius, d = dart+radius;

      for (i = domain.length-1; i > 0; i -= 2) {
        l = i-1, a = domain[l], b = domain[i];
        if (a >= c && a < d)
          if (b > d) domain[l] = d;
          else domain.splice(l, 2);
        else if (a < c && b > c)
          if (b <= d) domain[i] = c;
          else domain.splice(i, 0, c, d);
      }

      for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
        measure += domain[i+1]-domain[i];
    }

    return spline.sort();
  }

  var container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top      = '0';
  container.style.left     = '0';
  container.style.width    = '100%';
  container.style.height   = '0';
  container.style.overflow = 'visible';
  container.style.zIndex   = '9999';

  function Confetto(theme) {
    this.frame = 0;
    this.outer = document.createElement('div');
    this.outer.className = 'confetti';
    this.inner = document.createElement('div');
    this.outer.appendChild(this.inner);

    var outerStyle = this.outer.style, innerStyle = this.inner.style;
    outerStyle.position = 'absolute';
    outerStyle.width  = (sizeMin + sizeMax * random()) + 'px';
    outerStyle.height = (sizeMin + sizeMax * random()) + 'px';
    innerStyle.width  = '100%';
    innerStyle.height = '100%';
    innerStyle.backgroundColor = theme();

    outerStyle.perspective = '50px';
    outerStyle.transform = 'rotate(' + (360 * random()) + 'deg)';
    this.axis = 'rotate3D(' +
      cos(360 * random()) + ',' +
      cos(360 * random()) + ',0,';
    this.theta = 360 * random();
    this.dTheta = dThetaMin + dThetaMax * random();
    innerStyle.transform = this.axis + this.theta + 'deg)';

    this.x = window.innerWidth * random();
    this.y = -deviation;
    this.dx = sin(dxThetaMin + dxThetaMax * random());
    this.dy = dyMin + dyMax * random();
    outerStyle.left = this.x + 'px';
    outerStyle.top  = this.y + 'px';

    this.splineX = createPoisson();
    this.splineY = [];
    for (var i = 1, l = this.splineX.length-1; i < l; ++i)
      this.splineY[i] = deviation * random();
    this.splineY[0] = this.splineY[l] = deviation * random();

    this.update = function(height, delta) {
      this.frame += delta;
      this.x += this.dx * delta;
      this.y += this.dy * delta;
      this.theta += this.dTheta * delta;

      var phi = this.frame % 7777 / 7777, i = 0, j = 1;
      while (phi >= this.splineX[j]) i = j++;
      var rho = interpolation(
        this.splineY[i],
        this.splineY[j],
        (phi-this.splineX[i]) / (this.splineX[j]-this.splineX[i])
      );
      phi *= PI2;

      outerStyle.left = this.x + rho * cos(phi) + 'px';
      outerStyle.top  = this.y + rho * sin(phi) + 'px';
      innerStyle.transform = this.axis + this.theta + 'deg)';
      return this.y > height+deviation;
    };
  }

  function poof() {
    if (!frame) {
      document.body.appendChild(container);

      var theme = colorThemes[0];
      (function addConfetto() {
        var confetto = new Confetto(theme);
        confetti.push(confetto);
        container.appendChild(confetto.outer);
        timer = setTimeout(addConfetto, spread * random());
      })(0);

      var prev = undefined;
      frame = requestAnimationFrame(function loop(timestamp) {
        var delta = prev ? timestamp - prev : 0;
        prev = timestamp;
        var height = window.innerHeight;

        for (var i = confetti.length-1; i >= 0; --i) {
          if (confetti[i].update(height, delta)) {
            container.removeChild(confetti[i].outer);
            confetti.splice(i, 1);
          }
        }

        if (timer || confetti.length)
          return frame = requestAnimationFrame(loop);

        document.body.removeChild(container);
        frame = undefined;
      });
    }
  }

  poof();
}

function stopConfetti() {
  clearTimeout(timer); // Correctly clear the timer
  if (frame) {
    cancelAnimationFrame(frame);
    frame = undefined;
  }
  var container = document.querySelector('div[style*="z-index: 9999"]');
  if (container) {
    document.body.removeChild(container);
  }
  // Remove confetti elements from the page
  var confettiElements = document.querySelectorAll('.confetti');
  confettiElements.forEach(function(element) {
    element.parentNode.removeChild(element);
  });
}

//loading page 

document.addEventListener('DOMContentLoaded', function() {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');
  let loaded = false;
  let timer;

  // Function to hide loading screen
  function hideLoadingScreen() {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.visibility = 'hidden';
      mainContent.style.display = 'block';
  }

  // Event listener for when all content is fully loaded
  window.addEventListener('load', () => {
      loaded = true;
      if (timer) {
          clearTimeout(timer); // Clear any existing timer if content loads before 1 second
      }
      hideLoadingScreen(); // Hide loading screen immediately when content is fully loaded
  });

  // Set a timer to hide loading screen after 1 second if content loads quickly
  timer = setTimeout(() => {
      if (loaded) return; // If content has already loaded, do nothing
      hideLoadingScreen();
  }, 1000); // 1 second
});