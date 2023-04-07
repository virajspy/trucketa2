function initAutocomplete() {
  const driverLocationInput = document.getElementById("driver-location");
  const driverLocationAutocomplete = new google.maps.places.Autocomplete(driverLocationInput);

  const destinationLocationInput = document.getElementById("destination-location");
  const destinationLocationAutocomplete = new google.maps.places.Autocomplete(destinationLocationInput);
}

document.addEventListener("DOMContentLoaded", function() {
  initAutocomplete();
});

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

      let drivingTimeAccumulated = 0;
      let onDutyTimeAccumulated = 0;
      let breakTimeNeeded = 0;

      while (true) {
        drivingTimeAccumulated += travelTime;
        onDutyTimeAccumulated += travelTime;

        if (drivingTimeAccumulated > remainingHOS) {
          break;
        }

        if (onDutyTimeAccumulated > ON_DUTY_LIMIT) {
          breakTimeNeeded += 10;
          drivingTimeAccumulated = 0;
          onDutyTimeAccumulated = 0;
        }

        if (drivingTimeAccumulated + breakTimeNeeded <= timeUntilDelivery) {
          break;
        }

        drivingTimeAccumulated += BREAK_DURATION;
        onDutyTimeAccumulated += BREAK_DURATION;
        breakTimeNeeded += BREAK_DURATION;
      }

      // The rest of the function remains the same
      // ...
    }
  });
}

