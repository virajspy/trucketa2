const driverLocationInput = document.getElementById('driverLocation');
const destinationInput = document.getElementById('destination');
const appointmentTimeInput = document.getElementById('appointmentTime');
const driverStatusSelect = document.getElementById('driverStatus');
const remainingTimeDiv = document.getElementById('remainingTime');
const remainingHoursInput = document.getElementById('remainingHours');
const restartTimeDiv = document.getElementById('restartTime');
const restartTimeInput = document.getElementById('restart');
const calculateButton = document.getElementById('calculateButton');
const outputDiv = document.getElementById('output');

function toggleRemainingTime() {
  if (driverStatusSelect.value === 'onRoute') {
    remainingTimeDiv.style.display = 'block';
    restartTimeDiv.style.display = 'none';
  } else {
    remainingTimeDiv.style.display = 'none';
    restartTimeDiv.style.display = 'block';
  }
}

driverStatusSelect.addEventListener('change', toggleRemainingTime);
toggleRemainingTime();

function calculateETA(event) {
  event.preventDefault();

  const driverLocation = driverLocationInput.value;
  const destination = destinationInput.value;
  const appointmentTime = new Date(appointmentTimeInput.value);
  const driverStatus = driverStatusSelect.value;

  let remainingTime, restartTime;
  if (driverStatus === 'onRoute') {
    remainingTime = parseInt(remainingHoursInput.value);
  } else {
    restartTime = new Date(restartTimeInput.value);
  }

  const apiKey = 'YOUR_API_KEY';
 const apiUrl = https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(driverLocation)}&destination=${encodeURIComponent(destination)}&key=AIzaSyBVX4kyoQJOXHImKNf0VIC3BR-I1UDDm14;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const travelTimeInSeconds = data.routes[0].legs[0].duration.value;
      const travelTimeInHours = travelTimeInSeconds / 3600;

      let eta;
      if (driverStatus === 'onRoute') {
        if (travelTimeInHours <= remainingTime) {
          eta = new Date(appointmentTime.getTime() + (travelTimeInSeconds * 1000));
        } else {
          eta = new Date(appointmentTime.getTime() + ((remainingTime * 3600) * 1000) + (10 * 3600 * 1000) + (travelTimeInSeconds - (remainingTime * 3600)) * 1000);
        }
      } else {
        const timeToRestartInSeconds = Math.max(0, restartTime.getTime() - appointmentTime.getTime()) / 1000;
        if (travelTimeInSeconds <= timeToRestartInSeconds) {
          eta = new Date(appointmentTime.getTime() + (travelTimeInSeconds * 1000));
        } else {
          eta = new Date(appointmentTime.getTime() + timeToRestartInSeconds * 1000 + (10 * 3600 * 1000) + (travelTimeInSeconds - timeToRestartInSeconds) * 1000);
        }
      }

      const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
      const formattedEta = eta.toLocaleString('en-US', options);
      outputDiv.innerHTML = `Driver will arrive at ${formattedEta}.`;
    })
    .catch(error => {
      outputDiv.innerHTML = 'An error occurred while fetching the data.';
      console.error(error);
    });
}

calculateButton.addEventListener('click', calculateETA);
