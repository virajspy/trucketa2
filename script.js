// Replace YOUR_API_KEY with your Google Maps API key
const apiKey = 'YAIzaSyBVX4kyoQJOXHImKNf0VIC3BR-I1UDDm14';

function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: 37.7749, lng: -122.4194 }, // Default location (San Francisco)
    });
    directionsRenderer.setMap(map);

    // Get form elements
    const form = document.querySelector("form");
    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
    const remainingHoursInput = document.getElementById("remaining-hours-input");
    const appointmentTimeInput = document.getElementById("appointment-time-input");
    const etaContainer = document.getElementById("eta-container");
    const etaValue = document.getElementById("eta-value");
    const lateOrOnTimeValue = document.getElementById("late-or-on-time-value");

    // Handle form submit event
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Get user inputs
        const origin = originInput.value;
        const destination = destinationInput.value;
        const remainingHours = remainingHoursInput.value;
        const appointmentTime = appointmentTimeInput.value;

        // Calculate departure time based on remaining hours
        const now = new Date();
        const remainingMilliseconds = remainingHours * 60 * 60 * 1000;
        const shiftRestartTime = new Date(now.getTime() + remainingMilliseconds);
        const departureTime = shiftRestartTime > now ? shiftRestartTime : now;

        // Calculate arrival time based on appointment time and ETA
        calculateRoute(origin, destination, departureTime, apiKey)
            .then((result) => {
                const eta = result.duration.text;
                const arrivalTime = calculateArrivalTime(appointmentTime, eta);
                const lateOrOnTime = calculateLateOrOnTime(arrivalTime, appointmentTime);

                // Display results to user
                etaValue.textContent = `${eta} (including rest breaks and traffic)`;
                lateOrOnTimeValue.textContent = lateOrOnTime;
                etaContainer.style.display = "block";
            })
            .catch((error) => {
                console.error(error);
                alert("An error occurred while calculating the ETA. Please try again.");
            });
    });

    // Autocomplete for origin and destination inputs
    const autocompleteOrigin = new google.maps.places.Autocomplete(originInput);
    const autocompleteDestination = new google.maps.places.Autocomplete(destinationInput);

    // Calculate route and display on map
    function calculateRoute(origin, destination, departureTime, apiKey) {
        return new Promise((resolve, reject) => {
            directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                    drivingOptions: {
                        departureTime,
                        trafficModel: google.maps.TrafficModel.BEST_GUESS,
                    },
                },
                (response, status) => {
                    if (status === "OK") {
                        directionsRenderer.setDirections(response);
                        resolve(response.routes[0].legs[0]);
                    } else {
                        reject(status);
                    }
                }
            );
        });
    }

    // Calculate arrival time based on appointment time and ETA
      function calculateArrivalTime(appointmentTime, eta, remainingTime) {
  const [etaHours, etaMinutes] = eta.split(":").map((value) => parseInt(value, 10));
  const [appointmentHours, appointmentMinutes] = appointmentTime.split(":").map((value) => parseInt(value, 10));

  let drivingTime = Math.min(remainingTime, etaHours);
  let breakTime = Math.ceil((etaHours - drivingTime) / 4) * 10;
  let timeUntilBreak = 0;
  let timeDriven = 0;

  while (drivingTime > 0) {
    timeDriven += drivingTime;
    breakTime = Math.ceil((timeDriven / 60) / 4) * 10;
    timeUntilBreak = (4 - (timeDriven / 60) % 4) % 4;
    if (timeUntilBreak === 0) {
      breakTime = Math.max(breakTime, 30);
    }
    drivingTime -= timeUntilBreak;
    if (drivingTime <= 0) {
      break;
    }
    timeDriven += breakTime;
  }

  const totalMinutes = etaMinutes + timeDriven;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const late = totalMinutes > appointmentHours * 60 + appointmentMinutes;
  const breakCount = Math.ceil(timeDriven / 240);

  return {
    eta: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    late: late,
    timeUntilBreak: timeUntilBreak,
    breakCount: breakCount,
  };
}