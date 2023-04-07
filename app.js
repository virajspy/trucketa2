document.addEventListener("DOMContentLoaded", function () {
  initAutocomplete();
});
window.onload = function() {
  initAutocomplete();
};
  const driverLocationInput = document.getElementById("driver-location");
  const driverLocationAutocomplete = new google.maps.places.Autocomplete(driverLocationInput);

  const destinationLocationInput = document.getElementById("destination-location");
  const destinationLocationAutocomplete = new google.maps.places.Autocomplete(destinationLocationInput);
}

function toggleBreakInputs() {
  const onBreak = document.getElementById("on-break").checked;
  const remainingHosInput = document.getElementById("remaining-hos-input");
  const shiftRestartInput = document.getElementById("shift-restart-input");

  if (onBreak) {
    remainingHosInput.style.display = "none";
    shiftRestartInput.style.display = "block";
  } else {
    remainingHosInput.style.display = "block";
    shiftRestartInput.style.display = "none";
  }
}

function formatTime(hoursDecimal) {
  const hours = Math.floor(hoursDecimal);
  const minutes = Math.floor((hoursDecimal - hours) * 60);
  return `${hours}h ${minutes}m`;
}

function calculateETA() {
  const DRIVING_LIMIT = 11;
  const ON_DUTY_LIMIT = 14;
  const BREAK_DURATION = 0.5;

  const driverLocation = document.getElementById("driver-location").value;
  const destinationLocation = document.getElementById("destination-location").value;
  const onBreak = document.getElementById("on-break").checked;
  let remainingHOS;
  const shiftRestartTime = document.getElementById("shift-restart").value;

  if (onBreak) {
    const shiftRestart = new Date(shiftRestartTime);
    const now = new Date();
    remainingHOS = (shiftRestart - now) / 1000 / 60 / 60 + DRIVING_LIMIT;
  } else {
    remainingHOS = parseFloat(document.getElementById("remaining-hos").value);
  }

  const deliveryTimeString = document.getElementById("delivery-time").value;
  const deliveryTime = new Date(deliveryTimeString);
  const now = new Date();
  const timeUntilDelivery = (deliveryTime - now) / 1000 / 60 / 60; // in hours

  const directionsService = new google.maps.DirectionsService();
  const request = {
    origin: driverLocation,
    destination: destinationLocation,
    travelMode: "DRIVING",
  };

  directionsService.route(request, (response, status) => {
    if (status === "OK") {
      const route = response.routes[0].legs[0];
      const travelTime = route.duration.value / 60 / 60; // in hours
      const formattedTravelTime = formatTime(travelTime);

      let drivingTimeNeeded = travelTime;
      let onDutyTimeNeeded = travelTime;
      let breakTimeNeeded = 0;

      while (drivingTimeNeeded <= DRIVING_LIMIT && onDutyTimeNeeded <= ON_DUTY_LIMIT) {
        if (drivingTimeNeeded <= remainingHOS && onDutyTimeNeeded <= timeUntilDelivery) {
          break;
        }

        drivingTimeNeeded += travelTime;
        onDutyTimeNeeded += travelTime + 10;
        breakTimeNeeded += BREAK_DURATION;
      }

      let eta;
      const now = new Date();

  if (onBreak) {
    const shiftRestart = new Date(shiftRestartTime);
    const timeUntilShiftRestart = (shiftRestart - now) / 1000 / 60 / 60; // in hours
    const waitingTime = Math.max(0, timeUntilShiftRestart);
    eta = new Date(shiftRestart.getTime() + (waitingTime + drivingTimeNeeded + breakTimeNeeded) * 60 * 60 * 1000);
  } else {
    const waitingTime = (remainingHOS - drivingTimeNeeded) * (drivingTimeNeeded > remainingHOS);
    eta = new Date(now.getTime() + (waitingTime + drivingTimeNeeded + breakTimeNeeded) * 60 * 60 * 1000);
  }

  const etaString = eta.toLocaleString();
  const formattedBreakTime = formatTime(breakTimeNeeded);

  const canReachOnTime = eta <= deliveryTime;

  const resultsDiv = document.getElementById("results");
  if (canReachOnTime) {
    resultsDiv.innerHTML = `The driver can reach the destination on time! Estimated travel time: ${formattedTravelTime}. Total time of required breaks: ${formattedBreakTime}. ETA: ${etaString}`;
  } else {
    resultsDiv.innerHTML = `The driver cannot reach the destination on time. Estimated travel time: ${formattedTravelTime}. Total time of required breaks: ${formattedBreakTime}. ETA: ${etaString}`;
  }
} else {
  alert("Error calculating directions: " + status);
}
});
}
